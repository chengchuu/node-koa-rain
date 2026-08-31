# AGENTS.md

## Project Overview

`node-koa-rain` is a JavaScript/CommonJS backend built on Koa 2 and Sequelize. It provides user and JWT APIs, short links, uploads and asset metadata, visitor/weather reporting, robot notifications, reading-club features, game data, card/address workflows, and experimental chat and speech endpoints.

The dominant dependency direction is:

`router -> service -> model -> MySQL`

Services also call external HTTP APIs, write local files, and send robot notifications. The boundaries are pragmatic rather than strict: some routers call models directly, and several services combine validation, persistence, and side effects.

## Runtime Contract

- Runtime target: Node.js `10.x`
- Web framework: Koa `2.x`
- Language: JavaScript only
- Module system: CommonJS (`require`/`module.exports`)
- Database: MySQL through Sequelize 6
- Process manager: PM2

Keep changes parseable by Node.js 10. Do not introduce ESM, top-level `await`, optional chaining, nullish coalescing, class fields, or other newer syntax without changing the runtime contract and tooling first. The ESLint parser target is ECMAScript 2018.

## Entry Points

- `src/app.js`: runtime bootstrap and HTTP listener on port `3224`
- `src/router/server.js`: routes mounted below `/server`
- `src/router/tiny.js`: redirect routes mounted below `/t`
- `deploy.js`: SSH deployment helper used by `npm run deploy`
- `webpack.config.js`: bundles only `deploy.js`; it is not the server build pipeline

`package.json` points `main` to `src/app.js`. There is no compilation step for the server.

## Repository Map

- `src/app.js`: creates directories, installs middleware, owns process-local caches, mounts routers, schedules cache clearing, and reports app errors.
- `src/router/`: HTTP routing and extraction of request parameters.
- `src/service/`: business orchestration, Joi validation, external calls, filesystem work, and notification side effects.
- `src/model/`: Sequelize definitions and persistence helpers.
- `src/entities/orm.js`: shared Sequelize/MySQL connection.
- `src/entities/jwt/`: token creation and path-based authentication middleware.
- `src/entities/response/`: standard `rsp(...)` and `rspPage(...)` response envelopes.
- `src/entities/error/`: standard `err(...)` error envelopes and error codes.
- `src/config/`: environment configuration loader and the checked-in development configuration.
- `src/utils/`: shared utilities and the vendored cross-platform `say` implementation.
- `temp/`: multipart upload staging directory, created at startup.
- `video/`: local media directory, created at startup.
- `eslint-rules/`: local rule experiments; these rules are not currently wired into `npm run lint`.

Feature areas:

- `src/service/nut/`, `src/model/nut/`: reading cards, notes, likes, achievements, and reporting.
- `src/service/game/`, `src/model/game/`: games, scores, tags, and dictionary data.
- `src/service/card/`, `src/model/card/`: Excel card imports, crab metadata, ownership checks, addresses, and logistics.
- `src/service/upload/`: uploads, asset records, OSS configuration, and speech synthesis.
- `src/service/robot/`: robot integrations, reminders, scheduling, and messages.

## Startup And Request Flow

At module load/startup, `src/app.js`:

1. Loads routers and services through top-level imports; these imports can trigger Sequelize model synchronization.
2. Creates `temp` and `video` if absent.
3. Installs request logging. Every request except `/server/log/add` is submitted to `sAddLog(...)` without awaiting completion.
4. Installs `authMiddleware`.
5. Installs `koa-body` for JSON and multipart parsing, using `temp` for uploaded files.
6. Initializes `app.context.linkMap` and `app.context.logContent`.
7. Schedules `linkMap` replacement with `*/60 * * * *`, which runs at minute zero of each hour.
8. Mounts `/server` and `/t`, registers the app error hook, and listens on port `3224`.

A typical request then flows through logging, path-based authentication, body parsing, router, service, and model/external side effects. Responses normally use `rsp(...)` or `err(...)`, but this is not universally enforced.

## Main Data Flows

### Short Links

- Creation: `POST /server/generate/short-link` -> `src/service/tiny.js` -> `src/model/tiny.js` -> MySQL.
- Cache inspection: `GET /server/get/link-map` -> `sGetLinkMap(ctx)` -> serialized `app.context.linkMap` entries.
- Redirect: `GET /t/:key` -> `queryOriLinkByKey(...)` -> built-in special links, then `linkMap`, then MySQL -> HTTP 302.
- Unknown keys fall back to `https://blog.mazey.net/tiny`.

The cache is process-local and is neither shared across PM2 workers nor durable across restarts.

### Uploads And Assets

- `koa-body` stages multipart files in `temp`.
- `src/service/upload/index.js` reads the staged file, chooses a destination, writes it locally, and delegates metadata persistence to `src/model/asset.js`.
- The same service manages OSS configuration records and exposes two speech-synthesis handlers.

Treat client-supplied upload targets as filesystem input and validate them before expanding this behavior.

### Reading Club

- `/server/nut/*` routes delegate mainly to `src/service/nut/read.js`.
- `src/model/nut/*` stores reading cards, notes, likes, and related statistics.
- Robot notifications are side effects of several reading operations.

### Card And Address Flows

- Card and crab batch imports parse uploaded spreadsheets with `exceljs`.
- Card lookup checks `card_number` and `card_password` through `src/model/card/card.js`.
- Address operations use `src/model/card/address.js` and update card state through `src/model/card/card.js`.
- Logistics lookup calls the SF sandbox API only when a `logistics` configuration object is available.

`src/model/card/card.js` synchronizes crab, address, and card tables sequentially at import time and catches synchronization errors so optional card schema failures do not terminate startup.

### Logging And Alerts

- Request logs and explicit `/server/log/*` operations persist through `src/service/log.js`.
- `app.context.logContent` is a small process-local duplicate-suppression buffer.
- App-level errors are passed to `sReportErrorInfo(...)`, which can notify robot integrations.

## Authentication And Security

Authentication is not applied globally and is not role-based. `src/entities/jwt/index.js` checks an exact hard-coded path allowlist; routes absent from that list are public. Query strings are removed before matching.

When adding or changing a route, explicitly decide whether it belongs in the protected-path list. For card, upload, log, chat, and data-mutation endpoints, verify both authentication and resource ownership rather than assuming the router is protected.

The JWT signing secret and several integration-style values are currently stored in source. Do not add new credentials to the repository; prefer environment-backed configuration.

## Database Behavior

- `src/entities/orm.js` creates one shared Sequelize instance with MySQL and timezone `+08:00`.
- Many model modules call `.sync()` during import. Starting the app, importing a router, or running an isolated script can therefore query or mutate the database schema.
- Most model helpers return response envelopes directly, coupling persistence code to the HTTP response format.
- Some legacy helpers use `.catch(console.error)`, which can turn database failures into later null/undefined behavior.

Do not assume importing a model is side-effect free. Prefer explicit migrations for new production schema work rather than adding more import-time synchronization.

## Configuration

`src/config/index.js` loads `src/config/env.${NODE_ENV}.js`, then derives `tinyBaseUrl` and `assetsBaseUrl`. Only `src/config/env.development.js` is checked in. `npm run start` sets `NODE_ENV=production`, so production requires an externally supplied `src/config/env.production.js` or an intentional configuration refactor.

The checked-in development config contains placeholders for MySQL, JWT, weather, email, and robot integrations. It does not currently provide the `logistics` object expected by the card logistics service. The config loader also logs the loaded configuration object, so avoid placing secrets there without first removing or sanitizing that output.

## Commands And Tooling

- Install: `npm install`
- Development under `pm2-dev`: `npm run dev`
- Production under PM2: `npm run start`
- Foreground production-style PM2 run: `npm run start:nodaemon`
- Stop/restart PM2: `npm run stop` / `npm run restart`
- Lint and auto-fix: `npm run lint`
- Deploy over SSH: `npm run deploy`

ESLint uses classic `.eslintrc.js` with `eslint@7.32.0` and `eslint-plugin-node@11.1.0`. Most formatting findings are warnings, and the lint command includes `--fix`, so it modifies files. The repository has no automated test suite or `test` script; validation currently depends on linting and targeted manual/runtime checks.

`deploy.js` contains connection placeholders and executes `git pull`, `npm i`, and `npm run restart` remotely. Do not run deployment as routine validation.

## Change Guidance

- Keep routers thin; put orchestration in `src/service/*` and persistence in `src/model/*` when practical.
- Preserve `rsp(...)`, `rspPage(...)`, and `err(...)` response shapes for existing APIs.
- Check the JWT protected-path list whenever routes are added or renamed.
- Account for import-time `.sync()` and external service calls in tests and scripts.
- Validate filesystem paths for upload changes and await callback-based work before returning success.
- Verify cache behavior across restart and multi-process deployment for short-link or log-deduplication changes.
- For card changes, verify authentication, card ownership, affected-row counts, schema ordering, and missing logistics configuration.
- For robot/log changes, verify both database writes and in-memory duplicate suppression.
- Preserve unrelated work in the working tree and keep patches narrow.

## Known Production Risks

- `src/service/chat.js` is experimental: its upstream request and success response handling are not production-ready.
- Speech export in `src/service/upload/index.js` relies on callback-based, platform-specific `say` backends; the current route can return before the output file exists.
- The logistics endpoint cannot perform its intended lookup with the checked-in configuration.
- Process-local caches diverge across workers and reset on restart.
- Import-time schema synchronization makes startup database-dependent and can create production schema side effects.
- Several routes that read or mutate sensitive data remain public unless explicitly added to the JWT path list.

## First Files To Read

1. `src/app.js`
2. `src/router/server.js`
3. `src/entities/jwt/index.js`
4. `src/config/index.js`
5. `src/entities/orm.js`
6. `src/service/tiny.js`
7. `src/service/upload/index.js`
8. `src/service/card/card.js`
9. `src/service/nut/read.js`
10. `src/service/robot/robot.js`
