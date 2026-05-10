# AGENTS.md

## Purpose

This repository is a small Koa-based backend service that exposes HTTP APIs for:

- user registration and login
- short-link generation and redirects
- file upload and asset metadata management
- visitor/IP/weather reporting
- bot notifications
- reading-club features under `nut/*`
- game, score, and tag features

The app is a single Node.js service with a mostly consistent layering:

`router -> service -> model -> MySQL / external API`

## Runtime

- Node.js `10.x`
- Koa `2.x`

When editing code, keep syntax and library usage compatible with Node.js 10 and the current Koa 2 middleware style.

## Entry Points

- Runtime entry: `src/app.js`
- Main API router: `src/router/server.js`
- Short-link redirect router: `src/router/tiny.js`

`package.json` starts the service with PM2 and points `main` at `src/app.js`.

## Folder Map

- `src/app.js`
  Bootstraps Koa, installs middleware, mounts routers, initializes short-link cache, and starts listening on port `3224`.
- `src/router`
  Thin HTTP layer. Most handlers unpack `ctx` and delegate to services.
- `src/service`
  Business logic, validation, orchestration, and third-party API calls.
- `src/model`
  Sequelize models and DB-facing query/update helpers.
- `src/entities`
  Shared infrastructure such as ORM setup, JWT auth, response formatting, and error formatting.
- `src/config`
  Environment-specific config loading and app-level constants.
- `src/utils`
  Small helpers such as directory creation and general utilities.

## Important Modules

- `src/entities/orm.js`
  Creates the shared Sequelize connection used throughout the app.
- `src/entities/jwt/index.js`
  JWT creation and auth middleware. Note that auth is enforced only for a small allowlist of endpoints.
- `src/entities/response/index.js`
  Standard success response helpers.
- `src/entities/error/index.js`
  Standard error response helpers.
- `src/service/log.js`
  Error reporting pipeline: saves logs and triggers robot notifications.
- `src/service/tiny.js`
  Short-link creation and lookup, including in-memory cache usage.
- `src/service/upload/index.js`
  Upload handling, asset persistence, and OSS config operations.
- `src/service/nut/read.js`
  Reading-club domain logic, including persistence and notification side effects.

## Request Flow

Typical request lifecycle:

1. Request enters Koa in `src/app.js`.
2. `authMiddleware` runs first, but only blocks a few write routes.
3. `koa-body` parses JSON or multipart form data.
4. Request is routed to either:
   - `/server/*` via `src/router/server.js`
   - `/t/*` via `src/router/tiny.js`
5. Router delegates to a service function.
6. Service validates input, performs orchestration, and may:
   - call model functions for MySQL access
   - call third-party APIs with `axios`
   - send bot notifications
   - write files locally
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
  -> in-memory `linkMap` cache, then DB fallback
  -> HTTP 302 redirect

### Uploads

- `koa-body` writes uploads into the temp directory configured in `src/app.js`
- `src/service/upload/index.js` inspects the uploaded file, determines the target path, and records asset metadata
- `src/model/asset.js` stores metadata in MySQL

### Reading club

- `src/router/server.js` exposes `nut/*` endpoints
- `src/service/nut/read.js` contains the main business logic
- `src/model/nut/*` persists cards, notes, likes, and achievement-related data
- bot notifications are triggered as side effects

### Visitors and weather

- `/server/ip` collects request metadata
- `src/service/ip.js` calls external IP and weather APIs
- `src/model/visitor.js` stores visitor records

### Logging and alerting

- app-level errors are handled in `src/app.js`
- `src/service/log.js` formats, stores, and forwards error information to robot integrations

## Project-Specific Behaviors

- The service listens on port `3224`.
- `app.context.linkMap` is used as an in-memory cache for short-link lookups and is reset on a schedule.
- Many model files call `.sync()` at import time, so module loading has schema side effects.
- Some code bypasses the service layer and calls models directly from routers.
- Some services combine validation, persistence, and network side effects in the same module.

## Configuration Notes

- Config is loaded from `src/config/env.${NODE_ENV}.js` via `src/config/index.js`.
- The current repository layout includes environment secrets in config files instead of reading everything from external environment variables.
- `tinyBaseUrl` and `assetsBaseUrl` are assigned in `src/config/index.js`.

## Developer Commands

- Install dependencies: `npm install`
- Run in development: `npm run dev`
- Run in production mode with PM2: `npm run start`
- Stop PM2 process: `npm run stop`
- Restart: `npm run restart`
- Lint and fix: `npm run lint`

## Editing Guidance

- Keep new code aligned with the current layering: route handlers should stay thin when possible.
- Prefer adding business logic in `src/service/*` and DB logic in `src/model/*`.
- Reuse `rsp(...)` and `err(...)` for API responses.
- Be careful when changing auth behavior in `src/entities/jwt/index.js`; protection is currently path-based.
- Be careful when changing model imports because `.sync()` runs during module load.
- If touching upload or short-link code, verify both filesystem/cache behavior and DB behavior.

## Good First Places To Read

- `src/app.js`
- `src/router/server.js`
- `src/service/tiny.js`
- `src/service/upload/index.js`
- `src/service/nut/read.js`
- `src/entities/orm.js`
