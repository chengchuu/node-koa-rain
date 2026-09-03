function rsp({ ret = 0, info = "ok", message, data } = {}) {
  return {
    ret,
    info,
    message,
    data,
  };
}

function err({ ret = 413, info = "err_server_error", message = "" } = {}) {
  return {
    ret,
    info,
    message,
  };
}

module.exports = {
  rsp,
  err,
};
