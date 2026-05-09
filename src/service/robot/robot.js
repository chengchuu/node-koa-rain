/* eslint-disable max-lines */
// 机器人 应用层
const schedule = require('node-schedule');
const axios = require('axios');
const { format, subDays, lastDayOfMonth, isWeekend, isSameDay, getDay, isSaturday, isTuesday, isWednesday, isThursday, isFriday, isMonday } = require('date-fns');
const { robotImages } = require('./imagesConf');
const { alias2Key } = require('./../../config/env.development');
const { err } = require('../../entities/error');
const { rsp } = require('../../entities/response');
const { floatToPercent } = require('mazey');
const { sIsExistContent, sAddLog } = require('../log');
const { sGenerateShortLink } = require('../tiny');
const { isDayOffDates, sRobotSendColorText, sRobotRemindForLowSugarFruits, sCommonRobotSend, sGetRobotKeyByAlias, repeatSend } = require('./index.js');
const { sGetWeatherDaily } = require('../weather');
const weComRobotUrl = 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send';

// 通用方法 - ↓↓↓
// 机器人发送常规消息，type: info/绿色 comment/灰色 warning/黄色
function sRobotSendText ({ message = '', duration = '', key = '', immediately = false, isSkipDayOffDates = false } = {}) {
  const fn = () => {
    // 判断是否在特殊休息日
    if (isSkipDayOffDates) {
      const isDayOffDatesRes = isDayOffDates();
      if (isDayOffDatesRes.info === 'yes') {
        return isDayOffDatesRes;
      }
    }
    return axios
      .post(`${weComRobotUrl}?key=${key}`, {
        msgtype: 'text',
        text: {
          content: message,
        },
      })
      .catch(console.error);
  };
  if (immediately) {
    return fn();
  } else if (duration) {
    // https://www.npmjs.com/package/node-schedule
    const job = schedule.scheduleJob(duration, fn);
    return job;
  }
}

// 机器人发送图片消息
function sRobotSendImage ({ image = null, duration = '', key = '', immediately = false, isSkipDayOffDates = false } = {}) {
  const fn = () => {
    // 判断是否在特殊休息日
    if (isSkipDayOffDates) {
      const isDayOffDatesRes = isDayOffDates();
      if (isDayOffDatesRes.info === 'yes') {
        return isDayOffDatesRes;
      }
    }
    let realImage = image;
    // 动态图片
    if (Object.prototype.toString.call(image) === '[object Function]') {
      realImage = image();
    }
    return axios
      .post(`${weComRobotUrl}?key=${key}`, {
        msgtype: 'image',
        image: realImage,
      })
      .catch(console.error);
  };
  if (immediately) {
    return fn();
  } else if (duration) {
    // https://www.npmjs.com/package/node-schedule
    const job = schedule.scheduleJob(duration, fn);
    return job;
  }
}

// 机器人发送图文消息
function sRobotSendNews ({ title = '', description = '', url = '', picurl = '', duration = '', key = '', immediately = false, isSkipDayOffDates = false } = {}) {
  const fn = () => {
    // 判断是否在特殊休息日
    if (isSkipDayOffDates) {
      const isDayOffDatesRes = isDayOffDates();
      if (isDayOffDatesRes.info === 'yes') {
        return isDayOffDatesRes;
      }
    }
    return axios
      .post(`${weComRobotUrl}?key=${key}`, {
        msgtype: 'news',
        news: {
          articles: [
            {
              title: title,
              description: description,
              url: url,
              picurl: picurl,
            },
          ],
        },
      })
      .catch(console.error);
  };
  if (immediately) {
    return fn();
  } else if (duration) {
    // https://www.npmjs.com/package/node-schedule
    const job = schedule.scheduleJob(duration, fn);
    return job;
  }
}

// 最后一个工作日生日快乐
function sRobotRemindLastWorkingDay ({
  target = '兔渡人',
  url = 'https://blog.mazey.net/happy-birthday-to-you?hide_sidebar=1',
  picurl = 'https://rabbit-cn-cdn.rabbitgames.com/asset/forum/com-last-working-day.jpg',
  duration = '',
  key = alias2Key.get('rabbitKey'),
  immediately = false,
  isSkipDayOffDates = false,
} = {}) {
  const fn = () => {
    // 判断是否在特殊休息日
    if (isSkipDayOffDates) {
      const isDayOffDatesRes = isDayOffDates();
      if (isDayOffDatesRes.info === 'yes') {
        return isDayOffDatesRes;
      }
    }
    const d = new Date();
    let lastWorkingDay = new Date('1994-04-13');
    const lastDay = lastDayOfMonth(d); // 本月最后一天
    const yesterdayOfLastDay = subDays(lastDay, 1); // 本月倒数第二天
    const theDayBeforeYesterday = subDays(lastDay, 2); // 本月倒数第三天
    // 是否是工作日 1 2 3 4 5
    if (!isWeekend(lastDay)) {
      lastWorkingDay = lastDay;
    } else if (!isWeekend(yesterdayOfLastDay)) {
      lastWorkingDay = yesterdayOfLastDay;
    } else if (!isWeekend(theDayBeforeYesterday)) {
      lastWorkingDay = theDayBeforeYesterday;
    }
    // 模拟
    // lastWorkingDay = d;
    // 今天是否是最后一个工作日
    if (isSameDay(d, lastWorkingDay)) {
      sRobotSendNews({
        title: `生日快乐 ${target}`,
        description: `${d.getMonth() + 1} 月辛苦了\n今天是本月最后一个工作日\n不管你过不过生日\n我都要祝你生日快乐`,
        url,
        picurl,
        immediately: true,
        key,
      });
    }
  };
  if (immediately) {
    return fn();
  } else if (duration) {
    // https://www.npmjs.com/package/node-schedule
    const job = schedule.scheduleJob(duration, fn);
    return job;
  }
}

// 提醒和白开水
function sRobotRemindForDrinkWater ({
  title = '下午好',
  picurl = 'https://i.mazey.net/asset/robot/STRDrinkWaterBanner-1000x426.jpg',
  duration = '',
  key = alias2Key.get('rabbitKey'),
  immediately = false,
  isSkipDayOffDates = false,
} = {}) {
  const fn = () => {
    // 判断是否在特殊休息日
    if (isSkipDayOffDates) {
      const isDayOffDatesRes = isDayOffDates();
      if (isDayOffDatesRes.info === 'yes') {
        return isDayOffDatesRes;
      }
    }
    return axios
      .post(`${weComRobotUrl}?key=${key}`, {
        msgtype: 'news',
        news: {
          articles: [
            {
              title,
              url: 'https://blog.mazey.net/2275.html?hide_sidebar=1',
              picurl,
            },
            {
              title: '喝可乐不能代替喝水',
              url: 'https://blog.mazey.net/2275.html?hide_sidebar=1#Drinking-coke-is-not-a-substitute-for-drinking-water',
              picurl: 'https://i.mazey.net/asset/robot/drink-water-300x300.jpg',
            },
            {
              title: '喝汤不能代替喝水',
              url: 'https://blog.mazey.net/2275.html?hide_sidebar=1#Drinking-soup-is-no-substitute-for-drinking-water',
              picurl: 'https://i.mazey.net/asset/robot/drink-water-300x300.jpg',
            },
            {
              title: '喝茶不能代替喝水',
              url: 'https://blog.mazey.net/2275.html?hide_sidebar=1#Drinking-tea-is-no-substitute-for-drinking-water',
              picurl: 'https://i.mazey.net/asset/robot/drink-water-300x300.jpg',
            },
            {
              title: '喝牛奶不能代替喝水',
              url: 'https://blog.mazey.net/2275.html?hide_sidebar=1#Drinking-milk-is-not-a-substitute-for-water',
              picurl: 'https://i.mazey.net/asset/robot/drink-water-300x300.jpg',
            },
          ],
        },
      })
      .catch(console.error);
  };
  if (immediately) {
    return fn();
  } else if (duration) {
    // https://www.npmjs.com/package/node-schedule
    const job = schedule.scheduleJob(duration, fn);
    return job;
  }
}

/**
 * @method sRobotRemindFeperf
 * @desc 前端性能提醒
 */
async function sRobotRemindFeperf (ctx) {
  const { perfDays } = ctx.request.body;
  if (!Array.isArray(perfDays) || perfDays.length === 0) {
    return err({ message: '数据为空' });
  }
  const now = new Date();
  if (![1, 2, 3, 4, 5].includes(now.getDay())) {
    return err({ message: '非工作日' });
  }
  const tomorrow = format(subDays(new Date(), 1), 'yyyy-MM-dd');
  const theDayBeforeYesterday = format(subDays(new Date(), 2), 'yyyy-MM-dd');
  const tomorrowIns = perfDays.find(({ report_day }) => report_day === tomorrow);
  const theDayBeforeYesterdayIns = perfDays.find(({ report_day }) => report_day === theDayBeforeYesterday);
  console.log('tomorrow', tomorrow);
  console.log('theDayBeforeYesterday', theDayBeforeYesterday);
  if (!tomorrowIns || !theDayBeforeYesterdayIns) {
    // message = '数据缺失';
    return err({ message: '数据缺失' });
  }
  // 日志
  sAddLog({
    ctx,
    log_type: 'feperf',
    content: tomorrowIns,
  });
  // 数据可视化链接
  const feDomain = '#rabbit';
  const topics = [
    { name: '#rabbit', id: '#rabbit', weekDay: 1 },
    { name: '#rabbit', id: '#rabbit', weekDay: 2 },
    { name: '#rabbit', id: '#rabbit', weekDay: 3 },
    { name: '#rabbit', id: '#rabbit', weekDay: 4 },
    { name: '#rabbit', id: '#rabbit', weekDay: 5 },
  ];
  const topic = topics.find(({ id, weekDay }) => id === tomorrowIns.topic && getDay(now) === weekDay);
  if (!topic) {
    return err({ message: 'topic 缺失' });
  }
  const feUrl = `${feDomain}${topic.id}`;
  let shortFeUrl = '';
  const GenerateShortLinkRes = await sGenerateShortLink({ ori_link: feUrl });
  if (GenerateShortLinkRes.ret !== 0) {
    return GenerateShortLinkRes;
  }
  ({
    data: { tiny_link: shortFeUrl },
  } = GenerateShortLinkRes);
  const compareFeperfData = ({ param, title }) => {
    const tomorrowData = tomorrowIns[param];
    const theDayBeforeYesterdayData = theDayBeforeYesterdayIns[param];
    const res = tomorrowData - theDayBeforeYesterdayData;
    let ret = `${title}：${tomorrowData}`;
    if (res > 0) {
      ret += `<font color="warning">（+${res.toFixed(2)} +${floatToPercent(res / theDayBeforeYesterdayData, 2)}）</font>`;
    } else if (res < 0) {
      ret += `<font color="info">（${res.toFixed(2)} ${floatToPercent(res / theDayBeforeYesterdayData, 2)}）</font>`;
    } else {
      ret += '';
    }
    ret += '';
    return ret;
  };
  let content = `【${topic.name}】前端性能数据（${tomorrow} 单位：ms）\n`;
  content += `${compareFeperfData({ param: 'onload_time_avg', title: '页面加载时间' })}\n`;
  content += `${compareFeperfData({ param: 'domready_time_avg', title: '可交互时间' })}\n`;
  content += `${compareFeperfData({ param: 'white_time_avg', title: '白屏时间' })}\n`;
  content += `${compareFeperfData({ param: 'response_time_avg', title: '服务器响应时间' })}\n`;
  content += `${compareFeperfData({ param: 'tcp_time_avg', title: '服务器连接时间' })}\n`;
  content += `${compareFeperfData({ param: 'dns_time_avg', title: 'DNS查询时间' })}\n`;
  content += `抽样数量/抽样率：${tomorrowIns.report_count}/${floatToPercent(tomorrowIns.report_rate_avg, 0)}\n`;
  content += `<font color="comment">查看更多请访问：[🔗${shortFeUrl}](${feUrl})</font>`;
  const res = await sCommonRobotSend({
    alias: 'rabbitKey',
    type: 'markdown',
    data: {
      content,
    },
    immediately: true,
  }).catch(console.error);
  if (!res) {
    return err({ message: '接口错误' });
  }
  return rsp({ message: '成功' });
}
/**
 * @method sRobotRemindForConfirmTag
 * @desc 增加标签人工企业微信人工审核
 */
async function sRobotRemindForConfirmTag ({ ctx, user_id, user_name, game_id, tags = [], tagList = [], contents = [], extra = {}, key = '', alias = '', repeat = true } = {}) {
  // Repeat - begin
  if (repeat) {
    repeatSend(() => {
      sRobotRemindForConfirmTag({ ctx, user_id, user_name, game_id, tags, tagList, contents, extra, key: '', alias: 'TestUrl', repeat: false });
    });
  }
  // Repeat - end
  let realKey;
  if (alias) {
    const sGetRobotKeyByAliasRes = sGetRobotKeyByAlias({ alias });
    if (sGetRobotKeyByAliasRes.ret !== 0) {
      return sGetRobotKeyByAliasRes;
    }
    ({
      data: { key: realKey },
    } = sGetRobotKeyByAliasRes);
  }
  if (!realKey && key) {
    realKey = key;
  }
  let ret = '';
  if (tags.length) {
    tags.forEach(tag => {
      ret += `\`#${tag}\` `;
    });
    ret += '\n';
  }
  // 日志内容
  let logContent = '';
  let link = '';
  if (contents.length) {
    if (contents[0]) {
      const name = contents[0].name;
      const value = contents[0].value;
      ret += `${name}：<font color="comment">${value}</font>\n`;
      logContent += `${name}|${value}`;
    }
    if (contents[1]) {
      const name = contents[1].name;
      const value = contents[1].value;
      ret += `${name}：<font color="warning">${value}</font>\n`;
      logContent += `||${name}|${value}`;
    }
    if (contents[2]) {
      const name = contents[2].name;
      const value = contents[2].value;
      ret += `${name}：<font color="info">${value}</font>\n`;
      logContent += `||${name}|${value}`;
      if (tagList.length) {
        let tagRet = `游戏${game_id}`;
        tagList.forEach(tag => {
          tagRet += `\`${tag}\` `;
        });
        tagRet += '\n';
        const name = '标签';
        ret += `${name}：<font color="comment">${tagRet}</font>`;
        logContent += `||${name}|${tagRet}`;
      }
      // 如果是域名加路径，可以附加链接点击一下
      if (contents[0].name === 'host' && contents[1].name === 'url') {
        let tag_name = tagList.join(',');
        if (tagList.length > 1) {
          tagList.forEach(item => {
            let linkStr = `${contents[0].value}${contents[1].value}?user_id=${user_id}&user_name=${user_name}&game_id=${game_id}&tag_name=${item}`;
            ret += `\nlink：${item}[🔗通过](${linkStr}&tag_status=1)  [🔗驳回](${linkStr}&tag_status=2)`;
          });
        }
        link = `${contents[0].value}${contents[1].value}?user_id=${user_id}&user_name=${user_name}&game_id=${game_id}&tag_name=${tag_name}`;
      }
    }
  }
  let IsExistContentRes = null;
  let isExist = false;
  if (logContent) {
    IsExistContentRes = await sIsExistContent({ content: logContent });
    ({
      data: { isExist },
    } = IsExistContentRes);
    sAddLog({ ctx, log_type: tags[0], content: logContent });
  }
  if (!isExist || (alias === 'TestUrl' && repeat === false)) {
    if (link) {
      ret += `\nlink：[🔗全部通过](${link}&tag_status=1)`;
      ret += `\nlink：[🔗全部驳回](${link}&tag_status=2)`;
    }
    const res = await axios
      .post(`${weComRobotUrl}?key=${realKey || alias2Key.get('rabbitKey')}`, {
        msgtype: 'markdown',
        markdown: {
          content: ret,
        },
      })
      .catch(console.error);
    if (!res) {
      return err({ message: '接口错误' });
    }
    return rsp({ message: '成功' });
  }
  return err({ message: '日志已存在' });
}
/**
 * @method sRobotRemindForCommonTag
 * @desc 通用带标签的前端提醒 CICD
 */
async function sRobotRemindForCommonTag ({ ctx, tags = [], contents = [], extra = {}, key = '', alias = '', repeat = true } = {}) {
  // Repeat - begin
  if (repeat) {
    repeatSend(() => {
      sRobotRemindForCommonTag({ ctx, tags, contents, extra, key: '', alias: 'TestUrl', repeat: false });
    });
  }
  // Repeat - end
  let realKey;
  if (alias) {
    const sGetRobotKeyByAliasRes = sGetRobotKeyByAlias({ alias });
    if (sGetRobotKeyByAliasRes.ret !== 0) {
      return sGetRobotKeyByAliasRes;
    }
    ({
      data: { key: realKey },
    } = sGetRobotKeyByAliasRes);
  }
  if (!realKey && key) {
    realKey = key;
  }
  let ret = '';
  if (tags.length) {
    tags.forEach(tag => {
      ret += `\`#${tag}\` `;
    });
    ret += '\n';
  }
  // 日志内容
  let logContent = '';
  let link = '';
  if (contents.length) {
    if (contents[0]) {
      const name = contents[0].name;
      const value = contents[0].value;
      ret += `${name}：<font color="comment">${value}</font>\n`;
      logContent += `${name}|${value}`;
    }
    if (contents[1]) {
      const name = contents[1].name;
      const value = contents[1].value;
      ret += `${name}：<font color="warning">${value}</font>\n`;
      logContent += `||${name}|${value}`;
    }
    if (contents[2]) {
      const name = contents[2].name;
      const value = contents[2].value;
      ret += `${name}：<font color="info">${value}</font>`;
      logContent += `||${name}|${value}`;
      // 如果是域名加路径，可以附加链接点击一下
      if (contents[0].name === 'host' && contents[1].name === 'url') {
        link = `${contents[0].value}${contents[1].value}`;
      }
    }
  }
  let IsExistContentRes = null;
  let isExist = false;
  if (logContent) {
    IsExistContentRes = await sIsExistContent({ content: logContent });
    ({
      data: { isExist },
    } = IsExistContentRes);
    sAddLog({ ctx, log_type: tags[0], content: logContent });
  }
  if (!isExist || (alias === 'TestUrl' && repeat === false)) {
    if (link) {
      ret += `\nlink：[🔗链接](${link})<font color="comment">*（企业微信浏览器打开后，需要再次点击右上角↗系统默认浏览器）*</font>`;
    }
    const res = await axios
      .post(`${weComRobotUrl}?key=${realKey || alias2Key.get('rabbitKey')}`, {
        msgtype: 'markdown',
        markdown: {
          content: ret,
        },
      })
      .catch(console.error);
    if (!res) {
      return err({ message: '接口错误' });
    }
    return rsp({ message: '成功' });
  }
  return err({ message: '日志已存在' });
}
// 通用方法 - ↑↑↑

/**
 * @method sRobotRemindForCommunity
 * @desc Community Bot
 */
function sRobotRemindForCommunity (repeatKey = '', repeat = true) {
  // Repeat - begin
  if (repeat) {
    repeatSend(() => {
      sRobotRemindForCommunity(alias2Key.get('TestUrl'), false);
    });
  }
  // Repeat - end
  const key = repeatKey || alias2Key.get('forumFEHelperKey');
  return [
    // 每月生日
    sRobotRemindLastWorkingDay({
      duration: '0 5 15 * * 1-5', // 15:05
      key,
      isSkipDayOffDates: true,
    }),
  ];
}

/**
 * @method sRobotRemindForGetOff
 * @desc 提醒下班
 */
function sRobotRemindForGetOff (repeatKey = '', repeat = true) {
  // Repeat - begin
  if (repeat) {
    repeatSend(() => {
      sRobotRemindForGetOff('TestUrl', false);
    });
  }
  // Repeat - end
  const alias = repeatKey || 'getOffKey';
  return [
    // 提醒下班
    sCommonRobotSend({
      alias,
      type: 'markdown',
      data: {
        content: `<font color=comment>咳咳</font>\n \n<font color=info>咳咳</font>\n \n<font color=warning>咳咳</font>\n \n咳咳`,
      },
      duration: '0 55 18 * * 1-5', // 18:55
      isSkipDayOffDates: true,
    }),
  ];
}

/**
 * @method sRobotRemindForTouchFish01
 * @desc 提醒摸鱼 01
 */
function sRobotRemindForTouchFish01 (repeatKey = '', repeat = true) {
  // Repeat - begin
  if (repeat) {
    repeatSend(() => {
      sRobotRemindForTouchFish01('TestUrl', false);
    });
  }
  // Repeat - end
  const {
    data: { key },
  } = sGetRobotKeyByAlias({ alias: repeatKey || 'touchFish01Key' });
  return [
    // 提醒摸鱼
    sRobotSendNews({
      title: '休息一会儿吧！',
      description:
        '过劳对个人的身体健康带来损害，长期处于高负荷的工作状态，未能让身体得到有效的休息，就像一台高速运转的机器般会出现各种症状，除了总量越来越大的亚健康患者群体，还有数量越来越多的猝死案例。\n另外，超长工作并不利于工作效率的提高，而是走向事态的反面。实践证明，通过改善员工的心理健康状况，能给企业带来巨大的经济效益。',
      url: 'https://blog.mazey.net/take-a-rest?hide_sidebar=1',
      picurl: 'https://blog.mazey.net/wp-content/uploads/2021/12/TouchFishBanner-520x222-1.jpg',
      duration: '0 0 17 * * 1-5', // 17:00
      key,
      isSkipDayOffDates: true,
    }),
  ];
}

/**
 * @method sRobotRemindForTouchFish02
 * @desc 提醒摸鱼 02
 */
function sRobotRemindForTouchFish02 (repeatKey = '', repeat = true) {
  // Repeat - begin
  if (repeat) {
    repeatSend(() => {
      sRobotRemindForTouchFish02('TestUrl', false);
    });
  }
  // Repeat - end
  const {
    data: { key },
  } = sGetRobotKeyByAlias({ alias: repeatKey || 'touchFish02Key' });
  return [
    // 提醒摸鱼
    sRobotSendNews({
      title: '休息一会儿吧！',
      description:
        '过劳对个人的身体健康带来损害，长期处于高负荷的工作状态，未能让身体得到有效的休息，就像一台高速运转的机器般会出现各种症状，除了总量越来越大的亚健康患者群体，还有数量越来越多的猝死案例。\n另外，超长工作并不利于工作效率的提高，而是走向事态的反面。实践证明，通过改善员工的心理健康状况，能给企业带来巨大的经济效益。',
      url: 'https://blog.mazey.net/take-a-rest?hide_sidebar=1',
      picurl: 'https://blog.mazey.net/wp-content/uploads/2021/12/TouchFishBanner-520x222-1.jpg',
      duration: '0 0 17 * * 1-5', // 17:00
      key,
      isSkipDayOffDates: true,
    }),
  ];
}

/**
 * @method sRobotRemindForStronger
 * @desc Stronger Bot
 */
function sRobotRemindForStronger (repeatKey = '', repeat = true) {
  // Repeat - begin
  if (repeat) {
    repeatSend(() => {
      sRobotRemindForStronger(alias2Key.get('TestUrl'), false);
    });
  }
  // Repeat - end
  const key = repeatKey || alias2Key.get('strongerKey');
  return [
    // 天气预报
    sRobotSendColorText({
      messageFn: async () => {
        const GetWeatherDailyResSH = await sGetWeatherDaily({ location: 'shanghai' });
        const {
          data: {
            locationDetail: { name: nameSH },
            dayWeatherText: dayWeatherTextSH,
            temperatureLow: temperatureLowSH,
            temperatureHigh: temperatureHighSH,
          },
        } = GetWeatherDailyResSH;
        const msgSH = `${nameSH}${dayWeatherTextSH}，温度 ${temperatureLowSH}~${temperatureHighSH}°C`;
        const GetWeatherDailyResBJ = await sGetWeatherDaily({ location: 'beijing' });
        const {
          data: {
            locationDetail: { name: nameBJ },
            dayWeatherText: dayWeatherTextBJ,
            temperatureLow: temperatureLowBJ,
            temperatureHigh: temperatureHighBJ,
          },
        } = GetWeatherDailyResBJ;
        const msgBJ = `${nameBJ}${dayWeatherTextBJ}，温度 ${temperatureLowBJ}~${temperatureHighBJ}°C`;
        return `${msgSH}\n \n${msgBJ}`;
      },
      key,
      duration: '0 0 9 * * 1-5', // 09:00
      isSkipDayOffDates: true,
    }),
    // 提醒今天是周几[1-5]
    sRobotSendImage({
      image: () => robotImages[`today-${new Date().getDay()}`],
      duration: '0 0 10 * * 1-5', // 10:00
      key,
      isSkipDayOffDates: true,
    }),
    // 提醒点外卖
    sRobotSendNews({
      title: '外卖 Time !!!',
      description: '《中国居民膳食指南》建议：\n1. 食物多样，谷类为主\n2. 吃动平衡，健康体重\n3. 多吃蔬果、奶类、大豆\n4. 适量吃鱼、禽、蛋、瘦肉\n5. 少盐少油，控糖限酒\n6. 杜绝浪费，兴新食尚',
      url: 'https://docs.qq.com/sheet/rabbit?tab=rabbit',
      picurl: 'https://i.mazey.net/asset/robot/BannerTakeOutTime-20211120-520x222.jpg',
      duration: '0 0 11 * * 1-5', // 11:00
      key,
      isSkipDayOffDates: true,
    }),
    // 提醒拿外卖
    sRobotSendNews({
      title: '[错峰出行]拿外卖 or 热饭',
      description: '作为新时代的兔渡人：\n-- 早上要吃好（九点前）\n-> 中午要吃饱（十二点）\n-- 晚上要吃少（八点前）\n \n长时间饮食的不规律\n就慢~慢~慢~变胖了！',
      url: 'https://blog.mazey.net/2324.html?hide_sidebar=1',
      picurl: 'https://i.mazey.net/asset/robot/STRBannerEatTime-520x211.jpg',
      duration: '0 55 11 * * 1-5', // 11:55
      key,
      isSkipDayOffDates: true,
    }),
    // duration: '0 0 15 * * 2,4-5', // 15:00
    // 提醒不要翘二郎腿
    sRobotSendNews({
      title: '翘二郎腿的危害有哪些',
      description: '这个姿势也许能让你一时舒爽，却给全身埋下了“健康炸弹”！！！\n1. 损伤腰背肌肉和脊椎\n2. 导致 O 型腿\n3. 导致膝关节疼痛\n4. 加重静脉曲张\n5. 造成下肢血栓\n6. 导致不孕不育',
      url: 'https://blog.mazey.net/2321.html?hide_sidebar=1',
      picurl: 'https://i.mazey.net/asset/robot/StrLegDown-520x221.jpg',
      duration: '0 0 15 * * 1', // 15:00
      key,
      isSkipDayOffDates: true,
    }),
    // 提醒不要久坐
    sRobotSendNews({
      title: '久坐的危害有哪些',
      description:
        '久坐会导致脂肪囤积在腰腹部，从而导致身体肥胖；若体内脂肪囤积过多，会诱发高血压、糖尿病、心脏病等疾病。同时，长期坐着对颈椎的发育不好，还会引起头痛、头晕、四肢麻木的症状，甚至会诱发坐骨神经痛。',
      url: 'https://blog.mazey.net/2273.html?hide_sidebar=1',
      picurl: 'https://i.mazey.net/asset/robot/StrStandUp-520x222.jpg',
      duration: '0 0 15 * * 2,4', // 15:00
      key,
      isSkipDayOffDates: true,
    }),
    // 提醒情绪稳定
    sRobotSendNews({
      title: '每天演好一个情绪稳定的成年人',
      description: '情绪不稳定，经常发火，可能是因为没有计划，生活一团乱，事情一多，就烦躁不已。\n平时坚持锻炼，规律作息，让生活有条理，过滤掉生活中无意义的事，直面问题，对于稳定个人情绪有很大帮助。',
      url: 'https://blog.mazey.net/2489.html?hide_sidebar=1',
      picurl: 'https://blog.mazey.net/wp-content/uploads/2021/12/EmotionormalBanner-534x228-1.jpg',
      duration: '0 0 15 * * 3', // 15:00
      key,
      isSkipDayOffDates: true,
    }),
    // 提醒健康吃水果
    sRobotRemindForLowSugarFruits({
      alias: 'strongerKey',
      duration: '0 0 15 * * 5', // 15:00
      isSkipDayOffDates: true,
    }),
    // 每月生日
    sRobotRemindLastWorkingDay({
      target: '斯壮格尔',
      picurl: 'https://rabbit-cn-cdn.rabbitgames.com/asset/forum/str-last-working-day.jpg',
      duration: '0 5 15 * * 1-5', // 15:05
      key,
      isSkipDayOffDates: true,
    }),
    // 提醒喝白开水
    sRobotRemindForDrinkWater({
      title: '下午好 让我们共饮一杯白开水',
      picurl: 'https://i.mazey.net/asset/robot/STRDrinkWaterBanner-1000x426.jpg',
      duration: '0 0 16 * * 1-5', // 16:00
      key,
      isSkipDayOffDates: true,
    }),
    // 提醒下班
    sRobotSendImage({
      image: robotImages['cat-offline'],
      duration: '0 0 19 * * 1', // 19:00
      key,
      isSkipDayOffDates: true,
    }),
    sRobotSendImage({
      image: robotImages['robot-offline'],
      duration: '0 0 19 * * 2', // 19:00
      key,
      isSkipDayOffDates: true,
    }),
    sRobotSendImage({
      image: robotImages['get-off-work-bye'],
      duration: '0 0 19 * * 3', // 19:00
      key,
      isSkipDayOffDates: true,
    }),
    sRobotSendImage({
      image: robotImages['get-off-work-xiaban'],
      duration: '0 0 19 * * 4', // 19:00
      key,
      isSkipDayOffDates: true,
    }),
    sRobotSendImage({
      image: robotImages['el-offline'],
      duration: '0 0 19 * * 5', // 19:00
      key,
      isSkipDayOffDates: true,
    }),
  ];
}

/**
 * @method sRobotRemindForFeishuStronger
 * @desc Stronger Bot in Feishu
 */
function sRobotRemindForFeishuStronger ({ alias = 'feishuStronger' } = {}) {
  const isSkipDayOffDates = true;
  const immediately = false;
  const target = 'feishu';
  return [
    // 天气预报
    sCommonRobotSend({
      target,
      alias,
      type: 'text',
      dataFn: async () => {
        const GetWeatherDailyResSH = await sGetWeatherDaily({ location: 'shanghai' });
        const {
          data: {
            locationDetail: { name: nameSH },
            dayWeatherText: dayWeatherTextSH,
            temperatureLow: temperatureLowSH,
            temperatureHigh: temperatureHighSH,
          },
        } = GetWeatherDailyResSH;
        const msgSH = `${nameSH}${dayWeatherTextSH}，温度 ${temperatureLowSH}~${temperatureHighSH}°C`;
        let umbrellaStr = '';
        if (dayWeatherTextSH.includes('雨')) {
          umbrellaStr = '\n\n记得带伞哦！';
        }
        return `${msgSH}${umbrellaStr}`;
      },
      immediately,
      isSkipDayOffDates,
      duration: '0 0 9 * * 1-5', // 09:00
    }),
    // 提醒今天是周几[1-5]
    sCommonRobotSend({
      target,
      alias,
      type: 'text',
      dataFn: async () => {
        let ret = '今天';
        const d = new Date();
        if (isMonday(d)) {
          ret += '星期一';
          ret += '\n\n早上好，我的朋友';
          ret += '\n周末的快乐已变成';
          ret += '\n美好的回忆';
          ret += '\n醒一醒，笑一笑';
          ret += '\n新的一周又来到';
        } else if (isTuesday(d)) {
          ret += '星期二';
        } else if (isWednesday(d)) {
          ret += '星期三';
        } else if (isThursday(d)) {
          ret += '星期四';
        } else if (isFriday(d)) {
          ret += '星期五';
        } else if (isSaturday(d)) {
          ret += '星期六';
        }
        return ret;
      },
      immediately,
      isSkipDayOffDates,
      duration: '0 0 10 * * 1-5', // 10:00
    }),
    // 提醒点外卖
    sCommonRobotSend({
      target,
      alias,
      type: 'post',
      data: {
        title: '外卖 Time !!!',
        content: [
          [
            {
              tag: 'text',
              text: '《中国居民膳食指南》建议：',
            },
          ],
          [
            {
              tag: 'text',
              text: '1. 食物多样，谷类为主',
            },
          ],
          [
            {
              tag: 'text',
              text: '2. 吃动平衡，健康体重',
            },
          ],
          [
            {
              tag: 'text',
              text: '3. 多吃蔬果、奶类、大豆',
            },
          ],
          [
            {
              tag: 'text',
              text: '4. 适量吃鱼、禽、蛋、瘦肉',
            },
          ],
          [
            {
              tag: 'text',
              text: '5. 少盐少油，控糖限酒',
            },
          ],
          [
            {
              tag: 'text',
              text: '6. 杜绝浪费，兴新食尚',
            },
          ],
          [
            {
              tag: 'a',
              text: '此表格，永远吃不胖~.xlsx',
              href: 'https://docs.qq.com/sheet/rabbit?tab=rabbit',
            },
          ],
        ],
      },
      immediately,
      isSkipDayOffDates,
      duration: '0 0 11 * * 1-5', // 11:00
    }),
    // 提醒拿外卖
    sCommonRobotSend({
      target,
      alias,
      type: 'post',
      data: {
        title: '[错峰出行]拿外卖 or 热饭',
        content: [
          [
            {
              tag: 'text',
              text: '作为新时代的兔渡人：',
            },
          ],
          [
            {
              tag: 'text',
              text: '-- 早上要吃好（九点前）',
            },
          ],
          [
            {
              tag: 'text',
              text: '-> 中午要吃饱（十二点）',
            },
          ],
          [
            {
              tag: 'text',
              text: '-- 晚上要吃少（八点前）',
            },
          ],
          [
            {
              tag: 'text',
              text: '长时间饮食的不规律',
            },
          ],
          [
            {
              tag: 'text',
              text: '就慢~慢~慢~变胖了！',
            },
          ],
          [
            {
              tag: 'a',
              text: '-> 规律饮食的重要性',
              href: 'https://blog.mazey.net/2324.html?hide_sidebar=1',
            },
          ],
        ],
      },
      immediately,
      isSkipDayOffDates,
      duration: '0 55 11 * * 1-5', // 11:55
    }),
    // 提醒不要翘二郎腿
    sCommonRobotSend({
      target,
      alias,
      type: 'post',
      data: {
        title: '翘二郎腿的危害有哪些',
        content: [
          [
            {
              tag: 'text',
              text: '这个姿势也许能让你一时舒爽，却给全身埋下了“健康炸弹”！！！',
            },
          ],
          [
            {
              tag: 'text',
              text: '1. 损伤腰背肌肉和脊椎',
            },
          ],
          [
            {
              tag: 'text',
              text: '2. 导致 O 型腿',
            },
          ],
          [
            {
              tag: 'text',
              text: '3. 导致膝关节疼痛',
            },
          ],
          [
            {
              tag: 'text',
              text: '4. 加重静脉曲张',
            },
          ],
          [
            {
              tag: 'text',
              text: '5. 造成下肢血栓',
            },
          ],
          [
            {
              tag: 'text',
              text: '6. 导致不孕不育',
            },
          ],
          [
            {
              tag: 'a',
              text: '-> 正确坐姿',
              href: 'https://blog.mazey.net/2321.html?hide_sidebar=1',
            },
          ],
        ],
      },
      immediately,
      isSkipDayOffDates,
      duration: '0 0 15 * * 1', // 15:00
    }),
    // 提醒不要久坐
    sCommonRobotSend({
      target,
      alias,
      type: 'post',
      data: {
        title: '久坐的危害有哪些',
        content: [
          [
            {
              tag: 'text',
              text:
                '久坐会导致脂肪囤积在腰腹部，从而导致身体肥胖；若体内脂肪囤积过多，会诱发高血压、糖尿病、心脏病等疾病。同时，长期坐着对颈椎的发育不好，还会引起头痛、头晕、四肢麻木的症状，甚至会诱发坐骨神经痛。',
            },
          ],
          [
            {
              tag: 'a',
              text: '...',
              href: 'https://blog.mazey.net/2273.html?hide_sidebar=1',
            },
          ],
        ],
      },
      immediately,
      isSkipDayOffDates,
      duration: '0 0 15 * * 2,4', // 15:00
    }),
    // 提醒情绪稳定
    sCommonRobotSend({
      target,
      alias,
      type: 'post',
      data: {
        title: '每天演好一个情绪稳定的成年人',
        content: [
          [
            {
              tag: 'text',
              text:
                '情绪不稳定，经常发火，可能是因为没有计划，生活一团乱，事情一多，就烦躁不已。\n平时坚持锻炼，规律作息，让生活有条理，过滤掉生活中无意义的事，直面问题，对于稳定个人情绪有很大帮助。',
            },
          ],
          [
            {
              tag: 'a',
              text: '...',
              href: 'https://blog.mazey.net/2489.html?hide_sidebar=1',
            },
          ],
        ],
      },
      immediately,
      isSkipDayOffDates,
      duration: '0 0 15 * * 3', // 15:00
    }),
    // 提醒健康吃水果
    sCommonRobotSend({
      target,
      alias,
      type: 'post',
      data: {
        title: '多吃水果会发胖吗？',
        content: [
          [
            {
              tag: 'text',
              text:
                '水果摄入量每天增加 100 克，体重会增加 70 克。其中：柑橘类水果(橘、柑、橙等)摄入量每增加 100 克，体重增长 55 克；柑橘类以外的水果(苹果、梨、桃、草莓、葡萄、猕猴桃、菠萝、香蕉、西瓜、甜瓜、木瓜等)摄入量每增加 100 克，体重增长 82 克。超重或肥胖体质、减肥者、糖尿病患者等应少吃水果。而体质瘦弱、营养不良、低血糖等人群应增加水果摄入。',
            },
          ],
          [
            {
              tag: 'a',
              text: '...',
              href: 'https://blog.mazey.net/2337.html?hide_sidebar=1',
            },
          ],
        ],
      },
      immediately,
      isSkipDayOffDates,
      duration: '0 0 15 * * 5', // 15:00
    }),
    // 每月生日
    // 提醒喝白开水
    sCommonRobotSend({
      target,
      alias,
      type: 'post',
      data: {
        title: '下午好 让我们共饮一杯白开水',
        content: [
          [
            {
              tag: 'text',
              text: '无论是哪一种饮料都不能完全替代白开水，生活中我们应选择白开水作为主要的补水来源。成年人每天要饮水1500-1700mL（即7-8杯）。',
            },
          ],
          [
            {
              tag: 'a',
              text: '...',
              href: 'https://blog.mazey.net/2275.html?hide_sidebar=1',
            },
          ],
        ],
      },
      immediately,
      isSkipDayOffDates,
      duration: '0 0 16 * * 1-5', // 16:00
    }),
    // 提醒下班
    sCommonRobotSend({
      target,
      alias,
      type: 'text',
      data: '下线了，再见！',
      immediately,
      isSkipDayOffDates,
      duration: '0 0 19 * * 1-5', // 19:00
    }),
  ];
}

/**
 * @method sRobotFeishuGroup
 * @desc Bots in Feishu
 */
function sRobotFeishuGroup () {
  sRobotRemindForFeishuStronger({ alias: 'feishuStronger' });
  sRobotRemindForFeishuStronger({ alias: 'forHeart' });
  sRobotRemindForFeishuStronger({ alias: 'strongerGroup' });
  sRobotRemindForFeishuStronger({ alias: 'stronger001' });
  // 知问兔 斯壮格尔Beta
  sRobotRemindForFeishuStronger({ alias: 'feishuTest' });
}

// 测试
async function testSend () {}

module.exports = {
  sRobotRemindForStronger,
  testSend,
  sRobotSendNews,
  sRobotRemindFeperf,
  sRobotSendText,
  sRobotRemindLastWorkingDay,
  sRobotRemindForCommunity,
  sRobotRemindForCommonTag,
  sRobotRemindForDrinkWater,
  sRobotRemindForGetOff,
  sRobotRemindForTouchFish01,
  sRobotRemindForTouchFish02,
  sRobotRemindForFeishuStronger,
  sRobotFeishuGroup,
  sRobotRemindForConfirmTag,
};
