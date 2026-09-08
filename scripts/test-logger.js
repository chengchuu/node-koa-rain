const assert = require("assert");
const path = require("path");
const { spawnSync } = require("child_process");
const loggerPath = path.resolve(__dirname, "../src/entities/logger");
function run(source, level) {
  const env = Object.assign({}, process.env);
  delete env.LOG_LEVEL;
  if (level !== undefined) env.LOG_LEVEL = level;
  return spawnSync(process.execPath, [ "-e", "const logger = require(" + JSON.stringify(loggerPath) + ");\n" + source ], { env, encoding: "utf8" });
}
function records(output) {
  return output.trim() ? output.trim().split("\n").map(line => JSON.parse(line)) : [];
}
const source = '["trace", "debug", "info", "warn", "error", "fatal"].forEach(level => logger[level]("[test] event"));';
let result = run(source);
assert.strictEqual(result.status, 0);
assert.deepStrictEqual(records(result.stdout).map(row => row.level), [ 30, 40 ]);
assert.deepStrictEqual(records(result.stderr).map(row => row.level), [ 50, 60 ]);
records(result.stdout + result.stderr).forEach(row => {
  assert.strictEqual(row.msg, "[test] event");
  assert.strictEqual(typeof row.time, "number");
  assert.strictEqual(typeof row.pid, "number");
});
result = run(source, "trace");
assert.deepStrictEqual(records(result.stdout).map(row => row.level), [ 10, 20, 30, 40 ]);
[ "debug", "info", "warn", "error", "fatal", "silent" ].forEach(level => {
  result = run(source, level);
  assert.strictEqual(result.status, 0);
  const minimum = { debug: 20, info: 30, warn: 40, error: 50, fatal: 60, silent: Infinity }[level];
  assert.deepStrictEqual(records(result.stdout + result.stderr).map(row => row.level), [ 10, 20, 30, 40, 50, 60 ].filter(value => value >= minimum));
});
assert.notStrictEqual(run(source, "invalid").status, 0);
assert.notStrictEqual(run(source, "").status, 0);
result = run('logger.info("[test] final record"); process.exit(0);');
assert.strictEqual(records(result.stdout).length, 1);
const keys = [ "password", "user_password", "passwordHash", "authorization", "Authorization", "cookie", "Cookie", "token", "accessToken", "access_token", "secret", "key", "accessKeyId", "accessKeySecret", "code", "verificationCode", "email", "phone", "mobile", "address", "address_detail", "address_user", "address_mobile", "card_password", "headers", "body", "config", "request", "response", "ctx", "content", "decoded", "user", "mysqlConf", "url", "webhook" ];
keys.forEach(key => {
  const value = {};
  value[key] = "SENSITIVE_MARKER";
  result = run("logger.info(" + JSON.stringify(value) + ', "[test] redaction"); logger.info({nested:' + JSON.stringify(value) + '}, "[test] nested redaction");');
  assert.strictEqual(result.status, 0);
  assert(!result.stdout.includes("SENSITIVE_MARKER"), key);
  assert(result.stdout.includes("[Redacted]"), key);
});
result = run(`
const error = new Error("SENSITIVE_MARKER");
error.name = "AxiosError";
error.code = "ECONNRESET";
error.status = 503;
error.config = {url: "https://example.test/?key=SENSITIVE_MARKER"};
error.sql = "SENSITIVE_MARKER";
error.response = {data: "SENSITIVE_MARKER"};
error.stack = "Error: SENSITIVE_MARKER\\n    at secret (" + require("path").resolve("src/app.js") + ":1:2)\\n    at /Users/SENSITIVE_MARKER/private.js:1:2";
logger.error({err: error}, "[test] operation failed");
logger.error({err: {name: "SENSITIVE_MARKER", code: "SENSITIVE_MARKER", status: "SENSITIVE_MARKER"}}, "[test] unknown error");
logger.error({err: "SENSITIVE_MARKER"}, "[test] string error");
Promise.reject(error).catch(error => { logger.error({err: error}, "[test] rejection handled"); }).then(value => {
  require("assert").strictEqual(value, undefined);
});
`);
assert.strictEqual(result.status, 0);
assert(!result.stderr.includes("SENSITIVE_MARKER"));
const failure = records(result.stderr)[0].err;
assert.strictEqual(failure.type, "AxiosError");
assert.strictEqual(failure.status, 503);
assert.strictEqual(failure.stack, "src/app.js:1:2");
assert.strictEqual(failure.message, undefined);
console.log("Logger output, levels, redaction, and rejection checks passed.");
