# Logging and Comments Modernization Plan

## Status

Proposed. This document defines the implementation and validation work; it does not change runtime behavior by itself.

## Objective

Standardize application logging and source comments across Rain while preserving existing business behavior and Node.js 10 compatibility.

The change will:

- Replace application `console` calls with structured, level-aware logging.
- Prevent credentials, tokens, verification codes, personal information, and request internals from reaching stdout or stderr.
- Use stable English event messages such as `[upload] file stored`.
- Translate repository-owned Chinese code comments into concise English.
- Remove stale comments and commented-out implementation code.
- Preserve runtime response text, robot message content, and other user-facing Chinese strings.

## Runtime Constraint

Node.js 10 support is mandatory.

- Run `nvm use node10` before installing dependencies or running validation.
- Validate against Node.js `v10.24.1` and npm `v6.14.12`.
- Keep the implementation in CommonJS.
- Do not introduce optional chaining, nullish coalescing, ESM-only packages, or APIs unavailable in Node.js 10.
- Pin `pino` to the exact version `6.14.0`, the final Pino 6 release and the last Pino major line that supports Node.js 10.
- Generate and verify `package-lock.json` with Node.js 10 and npm 6.
- Do not add current Pino transports or pretty-printing packages that require newer Node.js releases.

Pino 6 is no longer maintained. This is an accepted compatibility constraint until Rain upgrades from Node.js 10. Reassess the logger version as part of that runtime upgrade.

## Scope

### Included

- Repository-owned JavaScript under `src/`.
- Application startup, request, service, model, schedule, and integration logs.
- Promise rejection callbacks that currently reference `console.error`.
- Repository-owned comments and JSDoc under `src/`.
- FEPerf verification-script messages where structured application logging is appropriate.
- Logging and comment conventions in `AGENTS.md`.
- Focused logger and redaction tests under `scripts/`.

### Excluded

- Vendored code under `src/utils/say/`.
- User-facing Chinese response messages and error messages.
- Robot notification content and business-specific Chinese text.
- Business-logic refactors, response-envelope changes, database changes, and route changes.
- Changes to error propagation currently hidden by `.catch(console.error)`.
- Production log shipping, rotation, retention, or external observability services.

## Confirmed Problems

The current application mixes useful operational events with development traces. High-risk examples include logging complete environment configuration, decoded authentication state, Koa contexts, verification codes, addresses, phone numbers, robot webhook URLs, logistics access tokens, and complete third-party responses.

Legacy comments also mix Chinese and English, describe obvious statements, preserve disabled implementations, and contain stale claims. For example, the JWT middleware comment says five routes are protected while the list contains nine routes, and the upload service says it decodes a token that middleware has already decoded.

## Logging Standard

### Logger Boundary

Create one logger module under `src/entities/logger.js`. Application modules import this shared instance instead of constructing independent loggers.

The logger will:

- Write newline-delimited JSON to stdout and stderr for PM2 collection.
- Use `LOG_LEVEL` when configured and default to `info`.
- Expose Pino's standard `debug`, `info`, `warn`, and `error` methods.
- Configure redaction once during initialization.
- Avoid application-specific fallback behavior or wrapper errors.

### Levels

- `debug`: local diagnostic details that are safe but too noisy for normal production operation.
- `info`: startup completion, scheduled-job completion, and successful external or filesystem operations worth retaining.
- `warn`: recoverable failures, skipped work, invalid optional configuration, or degraded behavior.
- `error`: failed required operations, unhandled application errors, and external I/O failures.

Do not log routine variable values, complete ORM results, every branch decision, or successful low-level operations without operational value.

### Messages

Messages use concise, stable English in this format:

```text
[component] event description
```

Examples:

```text
[app] server listening
[upload] file stored
[feperf] topic cache refreshed
[robot] message delivery failed
```

Dynamic values belong in structured fields, not in the message. Field names use lower camel case. Prefer stable identifiers, counts, durations, and status values over complete objects.

### Sensitive Data

Never intentionally log:

- Passwords, password hashes, or signing secrets.
- Authorization headers, cookies, JWTs, or decoded token payloads.
- Verification codes.
- Database credentials or complete configuration objects.
- Robot webhook keys or URLs containing keys.
- Access tokens, secret keys, or complete Axios request/response objects.
- Complete Koa contexts, request bodies, or headers.
- Addresses, phone numbers, email addresses, or arbitrary log content.

Configure explicit redaction paths for conventional sensitive keys, including `password`, `user_password`, `authorization`, `cookie`, `token`, `accessToken`, `access_token`, `secret`, `key`, and nested request-header variants.

Redaction is a secondary safeguard. It cannot reliably remove secrets embedded in strings or URLs, so sensitive values must not be passed to the logger in the first place.

### Errors

Log errors with a stable event message and safe error metadata. Preserve useful error messages and stacks without serializing complete third-party objects that may include request configuration or credentials.

Replacing `.catch(console.error)` must preserve current fulfillment and rejection behavior during this work. Any change that allows a rejection to propagate is a separate behavioral fix requiring focused review and tests.

### CLI Scripts

Standalone validation scripts may continue using `console.log` for concise success output and `console.error` for terminal failures. They are command-line interfaces, not application telemetry. Their output must still exclude credentials and restored database content.

## Comment Standard

- Write repository-owned comments in clear American English.
- Explain intent, constraints, side effects, compatibility requirements, or non-obvious decisions.
- Do not narrate code that is already self-explanatory.
- Use `// ` with one space for short comments.
- Use complete sentences with punctuation when a comment is a sentence.
- Keep short route-group and schema-field labels as concise noun phrases.
- Remove commented-out code and rely on Git history.
- Preserve external documentation URLs only when they explain a constraint; add a short description of why the link matters.
- Use JSDoc only for non-obvious exported functions or contracts.
- Standardize JSDoc on `@description`, `@param`, and `@returns`, with lowercase primitive types such as `{string}`, `{boolean}`, and `{object}`.
- Do not rewrite vendored comments under `src/utils/say/`.

## Implementation Phases

### Phase 1: Logger Foundation

1. Run `nvm use node10` and confirm Node.js `v10.24.1`.
2. Install exact dependency `pino@6.14.0` with npm 6.
3. Add the shared CommonJS logger with level configuration and explicit redaction paths.
4. Add focused tests for module loading, levels, output shape, error fields, and redaction.
5. Confirm output remains compatible with PM2 stdout and stderr collection.

### Phase 2: High-Risk Logging Cleanup

1. Remove complete configuration logging.
2. Remove authentication contexts, decoded token data, and verification codes.
3. Remove personal address, phone, and upload-user data.
4. Remove webhook URLs, access tokens, and complete third-party responses.
5. Replace useful failures with structured, sanitized logger calls.
6. Verify that redaction tests cover every sensitive field found during the audit.

### Phase 3: Repository-Owned Log Migration

1. Replace remaining application `console` calls with the shared logger.
2. Normalize messages to stable `[component] event` text.
3. Assign levels according to operational impact.
4. Convert safe dynamic values to structured metadata.
5. Replace direct `console.error` promise callbacks without changing their current resolution behavior.
6. Keep allowed CLI output and vendored code unchanged.

### Phase 4: Comment Modernization

1. Translate repository-owned Chinese comments into English.
2. Correct stale or inaccurate comments.
3. Remove redundant narration and commented-out implementations.
4. Normalize useful JSDoc.
5. Preserve domain meaning and all runtime strings.
6. Review large legacy files feature by feature so comment churn does not hide code changes.

### Phase 5: Documentation And Policy

1. Document the logger module, levels, message format, and sensitive-data policy in `AGENTS.md`.
2. Document the Node.js 10 and pinned-Pino constraint.
3. Add a static audit that rejects direct application `console` references outside approved paths.
4. Record explicit exceptions for CLI scripts and `src/utils/say/`.

## Validation

Run all validation after `nvm use node10`:

1. Confirm `node --version` reports `v10.24.1`.
2. Install with npm 6 and confirm the lockfile does not resolve packages requiring a newer Node.js runtime.
3. Run syntax checks over every changed JavaScript file.
4. Run ESLint without introducing new errors.
5. Run focused logger tests for levels, stable messages, redaction, and error serialization.
6. Verify no forbidden `console` references remain in repository-owned application code.
7. Run the FEPerf contract verification with schedules disabled.
8. Run the Docker MySQL 5.5 and Node.js 10 FEPerf integration test when database behavior could be affected.
9. Start Rain through the production-style PM2 path and inspect representative JSON output.
10. Confirm startup, request logging, uploads, scheduled jobs, and handled failures do not expose sensitive values.
11. Run `git diff --check`.

## Acceptance Criteria

- Rain starts and runs under Node.js `v10.24.1`.
- `pino` is pinned exactly to `6.14.0` and the npm 6 lockfile is reproducible.
- Repository-owned application code uses the shared logger instead of direct `console` calls.
- Approved CLI and vendored exceptions are documented and mechanically checked.
- Logs use appropriate levels and stable English messages.
- Automated tests prove that configured sensitive fields are redacted.
- No reviewed log call intentionally passes secrets, personal information, complete contexts, or credential-bearing URLs.
- Repository-owned comments are English, accurate, and useful.
- Commented-out implementation code is removed.
- Runtime API responses, database behavior, schedules, and business logic remain unchanged.
- Existing FEPerf checks pass.
- `git diff --check` passes.

## Risks And Mitigations

- **Unsupported dependency line:** Pino 6 is out of LTS. Pin it exactly, retain Node.js 10 test coverage, and upgrade it with the future Node.js runtime migration.
- **Secret leakage through strings:** Redaction only protects configured object paths. Do not log complete URLs, arbitrary content, contexts, or third-party payloads.
- **Changed PM2 output:** Validate newline-delimited JSON through the real production-style startup path before deployment.
- **Lost diagnostics:** Keep safe identifiers, event names, status, duration, and error stacks while removing payloads and credentials.
- **Behavior changes in promise chains:** Preserve existing `.catch(console.error)` resolution semantics during migration and review propagation separately.
- **Large review surface:** Separate logger infrastructure, log migration, and comment-only cleanup into reviewable commits.
- **Translation drift:** Review domain-specific comments near their implementation and preserve uncertain intent rather than inventing explanations.

## Delivery Sequence

Use separate Conventional Commits so functional and comment-only review remains clear:

1. `feat(logging): add Node 10 structured logger`
2. `refactor(logging): migrate application logs`
3. `docs(comments): standardize source comments in English`
4. `docs(agents): document logging conventions`

Do not deploy between the logger foundation and application migration unless both old and new output formats have been validated together.
