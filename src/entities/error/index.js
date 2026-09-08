const errCodeMessageMap = require("./errCodeMessageMap");

function err ({ ctx, ret = 413, info = "server_error", message = "服务器错误", stack = undefined } = {}) {
  message = parseErrInfo({ info, message });
  const rspBody = {
    ret,
    info,
    message,
    data: { stack },
  };
  if (ctx) ctx.body = rspBody;
  return rspBody;
}

function parseErrInfo ({ info, message }) {

  if (errCodeMessageMap.has(info)) {
    message = errCodeMessageMap.get(info);
  }
  return message;
}

module.exports = {
  err,
};
