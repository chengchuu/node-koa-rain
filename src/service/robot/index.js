// 机器人 通用方法
const schedule = require("node-schedule");
const axios = require("axios");
const { isSameDay } = require("date-fns");
const { alias2Key } = require("./../../config/env.development");
const { err } = require("../../entities/error");
const { rsp } = require("../../entities/response");
const { dayOffDates } = require("./dayOffConf");
const { generateRndNum } = require("mazey");
const { shuffle } = require("lodash");
const weComRobotUrl = "https://qyapi.weixin.qq.com/cgi-bin/webhook/send";
const feishuRobotUrl = "https://open.feishu.cn/open-apis/bot/v2/hook";

// 机器人发送常规消息，type: info/绿色 comment/灰色 warning/黄色
function sRobotSendColorText ({ type = "", message = "", messageFn = undefined, duration = "", key = "", immediately = false, isSkipDayOffDates = false } = {}) {
  const fn = async () => {
    // 判断消息是否由函数生成
    if (messageFn) {
      message = await messageFn();
    }
    // 判断是否在特殊休息日
    if (isSkipDayOffDates) {
      const isDayOffDatesRes = isDayOffDates();
      if (isDayOffDatesRes.info === "yes") {
        return isDayOffDatesRes;
      }
    }
    let content = `<font color="${type}">${message}</font>`;
    if (!type) {
      content = message;
    }
    return axios
      .post(`${weComRobotUrl}?key=${key}`, {
        msgtype: "markdown",
        markdown: {
          content,
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
 * @method isDayOffDates
 * @desc 判断是否在特殊休息日
 */
function isDayOffDates () {
  const n = new Date();
  if (dayOffDates.some(dateStr => isSameDay(new Date(dateStr), n))) {
    return rsp({ info: "yes", message: "今日休息" });
  }
  return rsp({ info: "no" });
}

/**
 * @method sGetRobotKeyByAlias
 * @desc 根据别名查找企业微信机器人的 Key 值
 */
function sGetRobotKeyByAlias ({ alias = "" } = {}) {
  if (!alias) {
    return err({ message: "别名不能为空" });
  }
  if (!alias2Key.has(alias)) {
    return err({ message: "别名不存在" });
  }
  const key = alias2Key.get(alias);
  return rsp({
    data: { key },
  });
}

/**
 * @method sCommonRobotSend
 * @desc 通用的机器人发送接口
 * @param {String} target 软件类型
 * workweixin 企业微信
 * feishu 飞书
 * @param {String} alias Key 对应的别名
 * @param {String} type 消息类型
 * 企业微信 text/markdown/image/news/file
 * 飞书 text/post
 * @param {Object} data 消息内容
 * @param {Function} dataFn 生成消息内容的方法
 * @param {String} duration Crontab 定时规则
 * @param {Boolean} immediately 是否立即发送
 * @param {Boolean} isSkipDayOffDates 是否跳过特殊休息日，例如：节假日、调休
 * @return {Promise/Object} 结果
 */
function sCommonRobotSend ({ target = "workweixin", alias = "", type = "", data = {}, dataFn = undefined, duration = "", immediately = false, isSkipDayOffDates = false } = {}) {
  // `[飞书消息去重防吞: ${}]`
  const feishuNot = () => {
    const r = generateRndNum(7);
    const iii = generateRndNum(1);
    const prefixs = shuffle([
      "斗智斗勇去重消息",
      "飞书我只是机器人",
      "让我发发消息鸭",
      "ROBOT FOREVER",
      "I AM HAPPY",
      "我和飞书战斗到底",
      "机器人是无辜的",
      "每天发消息很开心",
      "健康工作",
      "快乐生活",
      "飞书消息去重防吞",
      "我爱工作可是工作爱我吗",
      // 'TODAY IS PRESENT',
      "消息重复飞书就拦截",
      "虚虚实实就是工作",
      "人生是死亡预备期工作是过程",
      "过去和现在都热爱工作",
      "无论多么贫乏仍要爱工作",
      "不仅要随机数字还要随机文字",
      "人在工作时有许多无力改变的事",
      "工作对我而言是个疑难它既不象征秩序也不代表安全",
      "可以工作的话你为什么要快乐呢",
      "剩下的只有飞书和因为重复被拦截的消息",
      "我喜欢工作",
      "我喜欢飞书",
      "我没去看医生因为我想工作",
      "我与飞书达成了某种和解",
      "架子上有书银行里有钱我心里只有工作",
      "千金难买一笑",
      "朋友是我们送给自己的礼物",
      "放手过去才能拥抱更好的未来",
      "敷衍人生人生也会敷衍你",
      "万事万物自有其道",
      "没人能被简单定义",
      "希望我们友谊依然",
      "爱是最美好的事",
      "有时感情犹如含羞的花需要时间缓缓绽放",
      "工作无止境",
      "忠于自我顺心而为",
    ]);
    const prefix = prefixs[Number(iii)];
    return `[${prefix}: ${r}]`;
  };
  const fn = async () => {
    // 判断消息是否由函数生成
    if (dataFn) {
      data = await dataFn();
    }
    // 判断是否在特殊休息日
    if (isSkipDayOffDates) {
      const isDayOffDatesRes = isDayOffDates();
      if (isDayOffDatesRes.info === "yes") {
        return isDayOffDatesRes;
      }
    }
    // 查询 Key
    const GetRobotKeyByAliasRes = sGetRobotKeyByAlias({ alias });
    if (GetRobotKeyByAliasRes.ret !== 0) {
      return GetRobotKeyByAliasRes;
    }
    const {
      data: { key },
    } = GetRobotKeyByAliasRes;
    let url, postData;
    switch (target) {
      case "workweixin":
        url = `${weComRobotUrl}?key=${key}`;
        postData = {
          msgtype: type,
          [type]: data,
        // text: {},
        // markdown: {},
        // image: {},
        // news: {},
        // file: {},
        };
        break;
      case "feishu":
        url = `${feishuRobotUrl}/${key}`;
        if (type === "text") {
          if (typeof data === "string" && data.length) {
            data += `\n${feishuNot()}`;
          }
          data = { text: data };
          data = JSON.stringify(data);
        } else if (type === "post") {
          if (data && data.content && Array.isArray(data.content) && data.content.length) {
            data.content.push([
              {
                tag: "text",
                text: feishuNot(),
              },
            ]);
          }
          data = {
            post: {
              zh_cn: data,
            },
          };
        }
        postData = {
          msg_type: type,
          content: data,
        };
        break;
      default:
        url = "";
    }
    console.log("sCommonRobotSend postData", postData);
    console.log("sCommonRobotSend url", url);
    console.log("sCommonRobotSend key", key);
    return axios.post(url, postData).catch(console.error);
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
function sRobotRemindForLowSugarFruits ({ duration = "", alias = "", immediately = false, isSkipDayOffDates = false } = {}) {
  return sCommonRobotSend({
    alias,
    type: "news",
    data: {
      articles: [
        {
          title: "多吃水果会发胖吗？",
          url: "https://blog.mazey.net/2337.html?hide_sidebar=1",
          picUrl: "https://blog.mazey.net/wp-content/uploads/2021/12/12_Low_Sugar_Fruits_You_Can_Eat_Every_Day-600x256-1.jpg",
        },
        {
          title: "水果甜度与热量的关系",
          url: "https://blog.mazey.net/2337.html?hide_sidebar=1#the-relationship-between-fruit-sweetness-and-calories",
          picUrl: "https://blog.mazey.net/wp-content/uploads/2021/12/strawberry-300x300-1.jpg",
        },
        {
          title: "每天摄入 300 克水果",
          url: "https://blog.mazey.net/2337.html?hide_sidebar=1#the-recommended-daily-intake-of-fruit-is-300-grams",
          picUrl: "https://blog.mazey.net/wp-content/uploads/2021/12/kiwi-300x300-1.jpg",
        },
        {
          title: "何时吃水果最好",
          url: "https://blog.mazey.net/2337.html?hide_sidebar=1#when-is-the-best-time-to-eat-fruit",
          picUrl: "https://blog.mazey.net/wp-content/uploads/2021/12/apple-300x300-1.jpg",
        },
        {
          title: "果汁不能替代鲜果",
          url: "https://blog.mazey.net/2337.html?hide_sidebar=1#fruit-juice-is-no-substitute-for-fresh-fruit",
          picUrl: "https://blog.mazey.net/wp-content/uploads/2021/12/orange-300x300-1.jpg",
        },
      ],
    },
    duration,
    immediately,
    isSkipDayOffDates,
  });
}

function repeatSend (fn, timeout = 3000) {
  setTimeout(() => {
    fn();
  }, timeout);
}

module.exports = {
  sRobotSendColorText,
  isDayOffDates,
  sGetRobotKeyByAlias,
  sRobotRemindForLowSugarFruits,
  sCommonRobotSend,
  repeatSend,
};
