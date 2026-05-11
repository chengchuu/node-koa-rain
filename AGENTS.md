# AGENTS.md

## Purpose

This repository is a small Koa-based backend service. It exposes APIs for:

- user registration, login, and token generation
- short-link generation and redirect
- file upload and asset metadata management
- visitor/IP/weather reporting
- robot notification integrations
- reading-club features under `nut/*`
- game, score, and tag features
- card, address, and logistics-related flows under `card/*`
- experimental chat and text-to-speech endpoints

The codebase is mostly organized as:

`router -> service -> model -> MySQL / external API`

That layering is not perfectly strict. Some routes still call models directly, and some services mix validation, persistence, and side effects.

## Runtime

- Node.js `10.x`
- Koa `2.x`
- CommonJS modules
- JavaScript only, no TypeScript

Keep new code compatible with Node.js 10 syntax and older tooling. Avoid ESM, top-level `await`, optional chaining, nullish coalescing, and other newer syntax unless the runtime/tooling target is explicitly changed.

## Entry Points

- Runtime entry: `src/app.js`
- Main API router: `src/router/server.js`
- Short-link redirect router: `src/router/tiny.js`

`package.json` starts the service with PM2 and points `main` to `src/app.js`.

## Folder Map

- `src/app.js`
  Koa bootstrap, multipart parsing, router mounting, app-level caches, error hook, port binding.
- `src/router`
  HTTP route layer. Most handlers are thin and delegate into services.
- `src/service`
  Business logic, orchestration, validation, third-party HTTP calls, filesystem side effects, and robot notifications.
- `src/model`
  Sequelize models and query/update helpers.
- `src/entities`
  Cross-cutting infrastructure such as ORM setup, JWT auth, responses, and errors.
- `src/config`
  Environment-specific config and shared app constants.
- `src/utils`
  Helpers, including the local `say` implementation under `src/utils/say`.

Subdomains worth knowing:

- `src/service/nut`, `src/model/nut`
  Reading-club features.
- `src/service/game`, `src/model/game`
  Games, scores, tags, and related dictionaries.
- `src/service/card`, `src/model/card`
  Card import, card lookup, address updates, crab metadata, and logistics lookup.
- `src/service/upload`
  Uploads, asset records, OSS config management, and text-to-speech export.
- `src/service/robot`
  Robot scheduling, messaging, and duplicate-log suppression.

## Important Modules

- `src/entities/orm.js`
  Creates the shared Sequelize connection.
- `src/entities/jwt/index.js`
  JWT creation and request auth middleware.
  Auth is path-based and enforced only for a route allowlist.
- `src/entities/response/index.js`
  Standard `rsp(...)` and `rspPage(...)` helpers.
- `src/entities/error/index.js`
  Standard `err(...)` helper and error-code mapping.
- `src/service/log.js`
  Log persistence, duplicate-content checks, and error reporting to robots.
- `src/service/tiny.js`
  Short-link creation and lookup with in-memory cache usage.
- `src/service/upload/index.js`
  Upload handling, asset persistence, OSS config operations, and speech export.
- `src/service/card/card.js`
  Card import, card ownership checks, address update flow, and logistics lookup.
- `src/service/robot/robot.js`
  Most robot integrations and schedule-driven reminders.

## Request Flow

Typical request lifecycle:

1. Request enters Koa in `src/app.js`.
2. `authMiddleware` runs first.
   It only protects selected routes listed inside `src/entities/jwt/index.js`.
3. `koa-body` parses JSON and multipart form data.
4. Request is routed to:
   - `/server/*` via `src/router/server.js`
   - `/t/*` via `src/router/tiny.js`
5. Router delegates to a service function.
6. Service may:
   - validate with `Joi`
   - read/write MySQL through model helpers
   - call third-party APIs through `axios`
   - write files locally
   - send robot notifications
7. Response is usually shaped with `rsp(...)` or `err(...)`.

## Main Data Flows

### Short links

- Create:
  `POST /server/generate/short-link`
  -> `src/service/tiny.js`
  -> `src/model/tiny.js`
- Resolve:
  `GET /t/:key`
  -> `src/router/tiny.js`
  -> `src/service/tiny.js`
  -> `app.context.linkMap` cache, then DB fallback
  -> HTTP 302 redirect

### Uploads and assets

- `koa-body` writes uploads into the temp directory configured in `src/app.js`
- `src/service/upload/index.js` inspects the file, writes it to a target path, and saves metadata
- `src/model/asset.js` stores the asset record in MySQL

### Card flow

- Import cards:
  `POST /server/card/batch-add`
  -> `src/service/card/card.js`
  -> Excel parsing with `exceljs`
  -> `src/model/card/card.js`
- Import crab metadata:
  `POST /server/card/batch-add-crab`
  -> `src/service/card/card.js`
  -> `src/model/card/crab.js`
- Card lookup:
  `POST /server/card/get-number`
  -> password check via `mCheckCardByNumber(...)`
- Address lookup/update:
  `POST /server/card/get-address`
  `POST /server/card/add-address`
  `POST /server/card/update-address`
  -> `src/service/card/card.js`
  -> `src/model/card/address.js`
  -> `src/model/card/card.js`
  -> optional robot notification
- Logistics lookup:
  `POST /server/card/get-logistics`
  -> `src/service/card/card.js`
  -> external SF API

### Reading club

- `src/router/server.js` exposes `nut/*`
- `src/service/nut/read.js` contains the main business logic
- `src/model/nut/*` persists cards, notes, likes, and achievement-related data
- robot notifications are triggered as side effects

### Visitors and weather

- `/server/ip` collects request metadata
- `src/service/ip.js` calls external IP and weather APIs
- `src/model/visitor.js` stores visitor records

### Logging and alerting

- App-level errors are handled in `src/app.js`
- `src/service/log.js` stores logs and forwards error content to robot integrations
- `app.context.logContent` is used as a small in-memory dedupe buffer for some robot messages

## Project-Specific Behaviors

- The service listens on port `3224`.
- `app.context.linkMap` is an in-memory short-link cache and is cleared on a schedule.
- `app.context.logContent` is an in-memory array used for duplicate-log suppression.
- `src/app.js` creates `temp` and `video` directories on startup.
- Many model files call `.sync()` at import time, so simply importing modules can trigger schema side effects.
- Auth is not role-based; it is a hard-coded route allowlist in `src/entities/jwt/index.js`.
- This repository includes committed environment/config placeholders or secrets-style values in `src/config/env.development.js` instead of using a fully externalized config model.

## Configuration Notes

- Config is loaded from `src/config/env.${NODE_ENV}.js` through `src/config/index.js`.
- `tinyBaseUrl` and `assetsBaseUrl` are assigned in `src/config/index.js`.
- If you add a new external integration, prefer adding explicit config keys to the env config rather than hard-coding them inside services.

## Tooling

- ESLint uses classic `.eslintrc.js`, not flat config.
- The repo currently targets `eslint@7.x` with `eslint-plugin-node`.
- Linting is warning-heavy and intended to be compatible with Node 10-era code.
- The lint script is:
  `npm run lint`

## Developer Commands

- Install dependencies: `npm install`
- Run in development: `npm run dev`
- Run in production mode with PM2: `npm run start`
- Stop PM2 process: `npm run stop`
- Restart: `npm run restart`
- Lint and fix: `npm run lint`

## Editing Guidance

- Keep route handlers thin when possible.
- Prefer business logic in `src/service/*` and DB logic in `src/model/*`.
- Reuse `rsp(...)` and `err(...)` for API responses.
- Be careful when changing `src/entities/jwt/index.js`.
  Route protection is currently path-based, so adding a route may also require updating the auth allowlist.
- Be careful when changing imports around model files because `.sync()` runs during module load.
- If touching upload, speech, or short-link code, verify both filesystem/cache behavior and DB behavior.
- If touching card endpoints, review authentication and ownership checks carefully.
- If touching robot/log code, check both the DB path and the in-memory dedupe path.

## Known Rough Edges

- `src/service/chat.js` is experimental and currently not production-ready.
- `src/service/upload/index.js` speech export uses the local `say` wrapper and may have platform-specific behavior.
- `src/service/card/card.js` expects logistics config for the SF lookup route; verify env config before relying on that endpoint.
- Large formatting-only or lint-only branches can still carry behavior changes in this repo because feature work and cleanup have sometimes landed together.

## Good First Places To Read

- `src/app.js`
- `src/router/server.js`
- `src/entities/jwt/index.js`
- `src/service/tiny.js`
- `src/service/upload/index.js`
- `src/service/card/card.js`
- `src/service/nut/read.js`
- `src/service/robot/robot.js`
- `src/entities/orm.js`
