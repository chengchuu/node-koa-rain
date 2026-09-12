const { err } = require("../entities/error");
const { rsp } = require("../entities/response");
const { mAddLog, mIsExistContent } = require("../model/log");
const { sRobotSendColorText, sGetRobotKeyByAlias } = require("./robot/index.js");
const { sGetIP } = require("./user");

// Prefer logType while retaining the legacy log_type fallback.
async function sAddLog({ ctx, logType, content, log_type, isEncode = false }) {
  const tempType = logType || log_type;
  if (typeof content === "object") {
    content = JSON.stringify(content);
  }
  if (isEncode) {

    let buff = Buffer.from(content, "base64");
    content = buff.toString("utf-8");
  }
  if (content && content.length >= 500) {
    return err({ message: "内容长度不能超过 500" });
  }
  let ip = "";
  if (ctx) {
    ({
      data: { ip },
    } = await sGetIP(ctx));
  }
  const AddLogRes = await mAddLog({ log_type: tempType, ip, content });
  if (AddLogRes.ret === 0) {
    if (isEncode) {
      return rsp({ message: "success", data: { content: "success" } });
    }
    return AddLogRes;
  }
  return AddLogRes;
}

async function sIsExistContent({ ctx, content }) {
  // Check the process-local duplicate buffer before querying MySQL.
  let { logContent = [] } = ctx;
  let index = logContent.findIndex(item => item === content);
  if (index > -1) {
    return rsp({ message: "存在", data: { isExist: true } });
  } else {
    let len = logContent.length;
    if (len >= 10) {
      logContent.shift();
      logContent.push(content);
    } else {
      logContent.push(content);
    }
  }
  return mIsExistContent({ content });
}

/**
 * @description Send a robot error notification and persist the existing business log.
 * @param {object} options - Context, error, log type, page title, URL, and robot alias.
 * @returns {Promise<object>} Existing reporting response envelope.
 */
async function sReportErrorInfo({ ctx, logType = "unknown_error", err = {}, pageTitle = "", url = "", alias = "orangeKey" } = {}) {
  let requestUrl = "";
  if (ctx.request && ctx.request.url && ctx.request.header) {
    url = `${ctx.request.header.host}${ctx.request.url}`;
  }
  url = url || requestUrl;

  let { message = "", stack = "" } = err;
  let errContent = `\`#错误日志\` \`#${logType}\``;
  if (pageTitle) {
    errContent += `\n标题：${pageTitle}`;
  }
  if (url) {
    errContent += `\n链接：[${url}](${url})`;
  }
  if (ctx) {
    const {
      data: { ip },
    } = await sGetIP(ctx);
    errContent += `\nIP：${ip}`;
  }
  if (message) {
    errContent += `\n概要：<font color=warning>${message}</font>`;
  }
  if (stack) {
    errContent += `\n堆栈：<font color=comment>${stack}</font>`;
  }
  if (errContent.length >= 4000) {
    errContent = errContent.substring(0, 4000);
  }

  const GetRobotKeyByAliasRes = sGetRobotKeyByAlias({ alias });
  if (GetRobotKeyByAliasRes.ret === 0) {
    const {
      data: { key },
    } = GetRobotKeyByAliasRes;
    sRobotSendColorText({
      message: errContent,
      key,
      immediately: true,
    });
  } else {
    return GetRobotKeyByAliasRes;
  }

  sAddLog({ logType, content: errContent });
  return rsp();
}

module.exports = {
  sAddLog,
  sIsExistContent,
  sReportErrorInfo,
};
