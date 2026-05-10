const { err } = require('../entities/error');
const { rsp } = require('../entities/response');
const { mAddLog, mIsExistContent } = require('../model/log');
const { sRobotSendColorText, sGetRobotKeyByAlias } = require('./robot/index.js');
const { sGetIP } = require('./user');

// 新增日志 - 使用驼峰，遗弃下划线 log_type
async function sAddLog ({ ctx, logType, content, log_type, isEncode }) {
  const tempType = logType || log_type;
  if (typeof content === 'object') {
    content = JSON.stringify(content);
  }
  if (isEncode) {
    // 对base64的数据进行解码
    let buff = Buffer.from(content, 'base64');
    content = buff.toString('utf-8');
    // content = buff.toString('base64');
  }
  if (content && content.length >= 500) {
    return err({ message: '内容长度不能超过 500' });
  }
  let ip = '';
  if (ctx) {
    ({
      data: { ip },
    } = await sGetIP(ctx));
  }
  console.log('sAddLog, 新增日志:', { tempType, content, ip, isEncode });
  const AddLogRes = await mAddLog({ log_type: tempType, ip, content });
  if (AddLogRes.ret === 0) {
    if (isEncode) {
      return rsp({ message: 'success', data: { content } });
    }
    return AddLogRes;
  }
  return AddLogRes;
}

// 内容是否存在
async function sIsExistContent ({ content }) {
  return mIsExistContent({ content });
}

/**
 * @method sReportErrorInfo
 * @description 发送通用报错日志
 * @param {Object} ctx 上下文
 * @param {String} logType 日志类型 unknown_error server_error js_error request_error
 * @param {Object} err 错误对象
 * @param {String} pageTitle 页面标题 Title
 * @param {String} url 链接
 * @param {String} alias KEY别名 orangeKey 小橘子
 * @return {Object} 是否正确上报
 * */
async function sReportErrorInfo ({ ctx, logType = 'unknown_error', err = {}, pageTitle = '', url = '', alias = 'orangeKey' } = {}) {
  let requestUrl = '';
  if (ctx.request && ctx.request.url && ctx.request.header) {
    url = `${ctx.request.header.host}${ctx.request.url}`;
  }
  url = url || requestUrl;
  // 要旨 摘要 栈
  let { message = '', stack = '' } = err;
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
  // 机器人提醒
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
  // 存日志
  sAddLog({ logType, content: errContent });
  return rsp();
}

module.exports = {
  sAddLog,
  sIsExistContent,
  sReportErrorInfo,
};
