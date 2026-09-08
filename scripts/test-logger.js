const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");
const loggerPath = path.resolve(__dirname, "../src/entities/logger");
function run(source, level, options = {}) {
  const env = Object.assign({}, process.env);
  delete env.LOG_LEVEL;
  if (level !== undefined) env.LOG_LEVEL = level;
  return spawnSync(process.execPath, [ "-e", "const logger = require(" + JSON.stringify(loggerPath) + ");\n" + source ], Object.assign({ env, encoding: "utf8" }, options));
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
// Exercise short OS writes, including splits within multibyte UTF-8 characters.
result = run(`
const fs = require("fs");
const writeSync = fs.writeSync;
let writes = 0;
fs.writeSync = function(fd, data, offset, length, position) {
  writes++;
  if (writes === 2) throw Object.assign(new Error("Collector paused"), {code: "EAGAIN"});
  if (Buffer.isBuffer(data)) return writeSync(fd, data, offset, Math.min(length, 7), position);
  const bytes = Buffer.from(data);
  return writeSync(fd, bytes, 0, Math.min(bytes.length, 7));
};
logger.info({label: "猫😀"}, "[test] first record");
logger.info("[test] second record");
logger.error("[test] final record");
process.exit(0);
`);
assert.strictEqual(result.status, 0);
assert.deepStrictEqual(records(result.stdout).map(row => row.msg), [ "[test] first record", "[test] second record" ]);
assert.strictEqual(records(result.stdout)[0].label, "猫😀");
assert.strictEqual(records(result.stderr)[0].msg, "[test] final record");
result = run(`
const fs = require("fs");
const writeSync = fs.writeSync;
const failure = Object.assign(new Error("Output device failure"), {code: "EIO"});
fs.writeSync = () => { throw failure; };
require("assert").throws(() => logger.info("[test] failed write"), error => error === failure);
fs.writeSync = writeSync;
logger.info("[test] recovered device");
`);
assert.strictEqual(result.status, 0, result.stderr);
assert.strictEqual(records(result.stdout)[0].msg, "[test] recovered device");
const directory = fs.mkdtempSync(path.join(os.tmpdir(), "rain-logger-"));
const outputPath = path.join(directory, "output.log");
const outputFd = fs.openSync(outputPath, "w");
try {
  fs.writeSync(outputFd, "previous output\n");
  result = run("logger.info(\"[test] first record\"); logger.info(\"[test] second record\");", undefined, { stdio: [ "ignore", outputFd, "pipe" ] });
  assert.strictEqual(result.status, 0, result.stderr);
  const output = fs.readFileSync(outputPath, "utf8");
  assert(output.startsWith("previous output\n"));
  assert.deepStrictEqual(records(output.slice("previous output\n".length)).map(row => row.msg), [ "[test] first record", "[test] second record" ]);
} finally {
  fs.closeSync(outputFd);
  fs.unlinkSync(outputPath);
  fs.rmdirSync(directory);
}
const keys = [ "password", "user_password", "passwordHash", "authorization", "Authorization", "cookie", "Cookie", "token", "accessToken", "access_token", "secret", "key", "accessKeyId", "accessKeySecret", "code", "verificationCode", "email", "phone", "mobile", "address", "address_detail", "address_user", "address_mobile", "card_password", "headers", "body", "config", "request", "response", "ctx", "content", "decoded", "user", "mysqlConf", "url", "webhook", "user_email", "user_name", "nick_name", "real_name", "user_id", "asset_operator_id", "oss_user_id", "card_number", "address_date", "envConfig", "$mysql_password", "$mysql_username", "$email_key", "$email_name", "secretKey", "jwtToken" ];
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
assert.strictEqual(failure.errorCode, "ECONNRESET");
assert.strictEqual(failure.stack, "src/app.js:1:2");
assert.strictEqual(failure.message, undefined);
console.log("Logger output, levels, redaction, and rejection checks passed.");
