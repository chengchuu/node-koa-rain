const fs = require("fs");
const path = require("path");
const pino = require("pino");

const root = path.resolve(__dirname, "../..");
const errorTypes = new Set([
  "Error", "TypeError", "RangeError", "SyntaxError", "ReferenceError",
  "SequelizeDatabaseError", "SequelizeConnectionError", "SequelizeValidationError",
  "SequelizeUniqueConstraintError", "JsonWebTokenError", "TokenExpiredError", "AxiosError",
]);
const errorCodes = new Set([
  "ENOENT", "EACCES", "EPERM", "EEXIST", "ENOSPC", "EIO", "ECONNREFUSED",
  "ECONNRESET", "ETIMEDOUT", "ENOTFOUND", "EAI_AGAIN", "EPIPE", "ECONNABORTED",
  "ER_DUP_ENTRY", "ER_ACCESS_DENIED_ERROR", "ER_BAD_DB_ERROR", "ER_NO_SUCH_TABLE",
]);

// Never copy arbitrary error properties, messages, or stack headers into telemetry.
function serializeError(error) {
  const safe = { type: "Error" };
  if (!error || typeof error !== "object") return safe;
  if (errorTypes.has(error.name)) safe.type = error.name;
  if (errorCodes.has(error.code)) safe.errorCode = error.code;
  if (Number.isInteger(error.status) && error.status >= 100 && error.status <= 599) safe.status = error.status;
  if (typeof error.stack === "string") {
    const frames = error.stack.split("\n").slice(1).reduce((result, line) => {
      const match = line.match(/^\s+at (?:[^()\n]+ \()?(.+):(\d+):(\d+)\)?$/);
      if (!match) return result;
      const relative = path.relative(root, match[1]);
      // Only retain locations in existing application files, without function names.
      if (/^src\/[a-zA-Z0-9_/-]+\.js$/.test(relative) && fs.existsSync(path.join(root, relative))) {
        result.push(relative + ":" + match[2] + ":" + match[3]);
      }
      return result;
    }, []);
    if (frames.length) safe.stack = frames.join("\n");
  }
  return safe;
}

const sensitiveKeys = [
  "password", "user_password", "passwordHash", "authorization", "Authorization", "cookie", "Cookie",
  "token", "accessToken", "access_token", "secret", "key", "accessKeyId", "accessKeySecret",
  "code", "verificationCode", "email", "phone", "mobile", "address", "address_detail", "address_user",
  "address_mobile", "card_password", "headers", "body", "config", "request", "response", "ctx",
  "content", "decoded", "user", "mysqlConf", "url", "webhook",
  "user_email", "user_name", "nick_name", "real_name", "user_id", "asset_operator_id", "oss_user_id", "card_number", "address_date", "envConfig", "$mysql_password", "$mysql_username", "$email_key", "$email_name", "secretKey", "jwtToken",
];
const redact = sensitiveKeys.reduce((paths, key) => paths.concat(key, "*." + key), []);
redact.push("req.headers.authorization", "req.headers.cookie", "request.headers.authorization", "request.headers.cookie");

module.exports = pino({
  level: process.env.LOG_LEVEL === undefined ? "info" : process.env.LOG_LEVEL,
  serializers: { err: serializeError },
  redact: { paths: redact, censor: "[Redacted]" },
}, {
  // Synchronous writes retain final records on exit and let PM2 collect both streams.
  write(line) {
    fs.writeSync(JSON.parse(line).level >= 50 ? 2 : 1, line);
  },
});
