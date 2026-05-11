const { sqlIns } = require("../../entities/orm");
const { DataTypes, Op } = require("sequelize");
const { rsp } = require("../../entities/response");
const { err } = require("../../entities/error");
const { format, subDays } = require("date-fns");
const { isNumber } = require("mazey");

const NutReadCard = sqlIns.define(
  "NutReadCard",
  {
    read_card_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nick_name: {
      // 花名
      type: DataTypes.STRING(20),
    },
    real_name: {
      // 姓名
      type: DataTypes.STRING(20),
    },
    book_name: {
      // 书名
      type: DataTypes.STRING(100),
    },
    content: {
      // 内容
      type: DataTypes.STRING(500),
    },
    imgsStr: {
      // 图片 url,url,url
      type: DataTypes.STRING(1000),
    },
    read_card_type: {
      // 参与方式 person 个人 team 团队
      type: DataTypes.STRING(20),
    },
    read_card_date: {
      // 2021-05-26
      type: DataTypes.STRING(20),
    },
    read_card_status: {
      // 状态 1 正常 0 过期
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    accumulative_count: {
      // 累计分享次数 accumulativeCount
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    max_continuous_count: {
      // 连续分享天数 maxContinuousCount
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    integral: {
      // 每日积分
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    achievement: {
      // 成就
      type: DataTypes.STRING(20),
    },
    likes: {
      // 赞、喜欢
      type: DataTypes.STRING(500),
    },
  },
  {
    tableName: "nut_read_card",
    createdAt: "read_create_time",
    updatedAt: false,
  },
);

NutReadCard.sync();

// 新增
async function mAddCard ({ nick_name, real_name = "", book_name, content, imgs, read_card_type = "person", read_card_date, read_card_status = 0, status_0_tip = "" } = {}) {
  // 图片处理
  let imgsStr = "";
  if (Array.isArray(imgs) && imgs.length) {
    imgsStr = imgs.join(",");
  }
  // if 空白内容验证
  if (!content && !imgsStr) {
    // today
    const isBlankCountToday = await NutReadCard.count({
      where: {
        nick_name,
        book_name,
        read_card_date,
      },
    });
    if (isBlankCountToday !== 0) {
      return err({ message: "空内容一天只能提交一次，写下读后感或者上传图片后再提交吧！" });
    }
  }
  // if 凌晨分享 00 - 06
  const d = new Date();
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const d00 = new Date(`${year}-${month}-${day} 00:00:00`);
  const d06 = new Date(`${year}-${month}-${day} 06:00:00`);
  const n = new Date();
  // 昨天 yesterday
  const tomorrowDate = format(subDays(new Date(read_card_date), 1), "yyyy-MM-dd");
  const theDayBeforeYesterday = format(subDays(new Date(read_card_date), 2), "yyyy-MM-dd");
  const isWeeHours = n >= d00 && n <= d06;
  let isshareCountTomorrow;
  if (isWeeHours) {
    isshareCountTomorrow = await NutReadCard.count({
      where: {
        nick_name,
        read_card_date: tomorrowDate,
      },
    });
    if (isshareCountTomorrow === 0) {
      read_card_date = tomorrowDate;
    }
  }
  // must 统计累计分享
  let [ accumulativeCount, maxContinuousCount ] = [ 1, 1 ];
  // 获取上一次分享
  const lastRow = await NutReadCard.findOne({
    where: {
      nick_name,
    },
    order: [ [ "read_create_time", "DESC" ] ],
  });
  if (lastRow) {
    const { accumulative_count, max_continuous_count, read_card_date: lastRowReadCardDate } = lastRow;
    // 累计分享 + 1
    if (isNumber(accumulative_count) && isNumber(max_continuous_count) && lastRowReadCardDate) {
      accumulativeCount = accumulative_count + 1;
      // if 白天 0 - 24 上一条分享正好是昨日数据 + 1
      if (lastRowReadCardDate === tomorrowDate) {
        maxContinuousCount = max_continuous_count + 1;
      } else if (lastRowReadCardDate === read_card_date) {
        // 上一条分享是今日数据 =
        maxContinuousCount = max_continuous_count;
      }
      // if 凌晨 0 - 6 and 补白天分享
      if (isWeeHours && isshareCountTomorrow === 0) {
        if (lastRowReadCardDate === theDayBeforeYesterday) {
          maxContinuousCount = max_continuous_count + 1;
        }
      }
    }
  }
  // 计算积分
  let integral = 0;
  if (!content && !imgsStr) {
    integral = 5;
  } else if (content || imgsStr) {
    integral = 15;
  }
  // 计算成就 achievement maxContinuousCount
  // 修仙段位 https://zhuanlan.zhihu.com/p/374401281
  // 炼皮，炼肉，炼骨，炼脏，炼血，后天，先天，辟谷，引气，聚气，凝气，化气，炼气，聚元，凝元，筑元，旋照，筑基，灵动，灵虚，灵寂，开光，融合，心动，聚丹，凝丹，韵丹，结丹，金丹，聚婴凝婴结婴，元婴，婴变，出窍，元神，分神，化神，炼虛，洞虚，化虚，返虚，合体，合灵，合魂，空冥，寂灭，问鼎，闻道，大乘，渡劫，化羽，飞升，散仙，游仙人仙，地仙，天仙，真仙，玄仙，太乙玄仙，九天玄仙，大罗玄仙，金仙，太乙金仙，大罗金仙，罗天上仙，仙君，仙王，仙尊，仙帝，仙神，神人，地神，天神，真神，星神，玄神，神君，神王，神帝，神尊，准圣，圣人，天圣，圣君，圣王，圣帝，圣尊，天道，至尊，混沌，混沌神君，混沌神王，混沌神帝，混沌神尊，大道，道，虚无本源
  let achievement = "";
  switch (maxContinuousCount) {
    case 3:
      achievement = "开卷有益";
      break;
    case 5:
      achievement = "Give Me Five";
      break;
    case 10:
      achievement = "奋勇直前";
      break;
    case 21:
      achievement = "火力全开";
      break;
    case 30:
      achievement = "持之以恒";
      break;
    case 40:
      achievement = "梦在书中";
      break;
    case 50:
      achievement = "指弹专家";
      break;
    case 66:
      achievement = "热血人生";
      break;
    case 81:
      achievement = "初心";
      break;
    case 90:
      achievement = "傲骨寒梅";
      break;
    case 100:
      achievement = "追光者";
      break;
    case 110:
      achievement = "浴火重生";
      break;
    case 120:
      achievement = "闻道";
      break;
    case 130:
      achievement = "大乘";
      break;
    case 140:
      achievement = "渡劫";
      break;
    case 150:
      achievement = "化羽";
      break;
    case 160:
      achievement = "飞升";
      break;
    case 170:
      achievement = "散仙";
      break;
    case 180:
      achievement = "游仙";
      break;
    case 190:
      achievement = "地仙";
      break;
    case 200:
      achievement = "天仙";
      break;
    case 210:
      achievement = "真仙";
      break;
    case 220:
      achievement = "玄仙";
      break;
    case 230:
      achievement = "金仙";
      break;
    case 240:
      achievement = "上仙";
      break;
    case 250:
      achievement = "仙君";
      break;
    case 260:
      achievement = "仙王";
      break;
    case 270:
      achievement = "仙尊";
      break;
    case 280:
      achievement = "仙帝";
      break;
    case 290:
      achievement = "仙神";
      break;
    case 300:
      achievement = "地神";
      break;
    case 310:
      achievement = "天神";
      break;
    case 320:
      achievement = "真神";
      break;
    case 330:
      achievement = "星神";
      break;
    case 340:
      achievement = "玄神";
      break;
    default:
    // 傲骨寒梅 养精蓄锐 追光者 浴火重生 初心
      achievement = "";
  }
  if (achievement) {
    const isGetAchievement = await NutReadCard.count({
      where: {
        nick_name,
        achievement,
      },
    });
    if (isGetAchievement !== 0) {
      achievement = "";
    }
  }
  // 新增数据
  const ret = await NutReadCard.create({
    nick_name,
    real_name,
    book_name,
    content,
    imgsStr,
    read_card_type,
    read_card_date,
    accumulative_count: accumulativeCount,
    max_continuous_count: maxContinuousCount,
    integral,
    achievement,
    read_card_status,
  }).catch(console.error);
  if (ret && ret.dataValues) {
    let message = "发布成功";
    if (read_card_status === 0) {
      message = status_0_tip || "发布成功（审核中）";
    }
    return rsp({ message, data: ret.dataValues });
  }
  return err({ message: "发布失败" });
}

// 查询最近的成就
async function mGetRecentAchievement ({ nick_name }) {
  const lastAchRow = await NutReadCard.findOne({
    where: {
      nick_name,
      achievement: {
        [Op.and]: {
          [Op.ne]: "",
          [Op.not]: null,
        },
      },
    },
    order: [ [ "read_create_time", "DESC" ] ],
  });
  if (!lastAchRow) {
    return err({ message: "无数据" });
  }
  const { achievement } = lastAchRow;
  if (achievement && achievement.length) {
    return rsp({ data: { achievement } });
  }
  return err({ message: "成就不合法" });
}

// 计算积分
async function mGetCardIntegral ({ nick_name }) {
  const integralRow = await sqlIns.query(`
    SELECT
      nick_name,
      sum(maxIntegral) AS sumMaxIntegral
    FROM
      (
        SELECT
          nick_name,
          read_card_date,
          max(integral) AS maxIntegral
        FROM
          nut_read_card
        WHERE
          nick_name = '${nick_name}'
        AND read_card_status = 1
        GROUP BY
          read_card_date
      ) AS A;
  `);
  const [ results ] = integralRow;
  if (results.length && results[0].sumMaxIntegral) {
    return rsp({ message: "查询成功", data: { integral: results[0] } });
  }
  return err({ message: "查询失败" });
}

// 查询
async function mGetCards ({ currentPage = 1, pageSize = 20, startDate, endDate, simple = "close", isPrivacy = false } = {}) {
  const where = { read_card_status: 1 };
  if (startDate && endDate) {
    Object.assign(where, {
      read_create_time: {
        [Op.lt]: new Date(endDate),
        [Op.gt]: new Date(startDate),
      },
    });
  }
  const query = {
    where,
    order: [ [ "read_create_time", "DESC" ] ],
    offset: (currentPage - 1) * pageSize,
    limit: pageSize,
  };
  // if (limit) {
  //   Object.assign(query, { limit })
  // }
  const { count = undefined, rows = undefined } = (await NutReadCard.findAndCountAll(query).catch(console.error)) || {};
  if (!isNumber(count)) {
    return err({ message: "数据错误" });
  }
  if (rows && Array.isArray(rows)) {
    const rowsIncludeImgs = rows.map(v => {
      const { dataValues } = v;
      let imgs = [];
      if (dataValues.imgsStr && dataValues.imgsStr.length) {
        const imgsStr = dataValues.imgsStr;
        imgs = imgsStr.split(",");
        if (imgsStr.includes("rabbitimage.rabbitcdn.com")) {
          imgs = [];
        }
      }
      Object.assign(dataValues, { imgs, imgsStr: undefined });
      // 简化内容
      if (simple === "open") {
        if (dataValues.content && dataValues.content.length) {
          Object.assign(dataValues, { content: "#exist" });
        }
        const imgsLen = imgs.length;
        if (imgsLen) {
          imgs = imgs.map(() => "#exist");
          Object.assign(dataValues, { imgs, imgsLen });
        }
      }
      // 隐藏真实姓名
      if (isPrivacy) {
        if (dataValues.real_name) {
          Object.assign(dataValues, { real_name: "#exist" });
        }
      }
      return dataValues;
    });
    return rsp({
      message: "成功",
      data: {
        list: rowsIncludeImgs,
        currentPage,
        pageSize,
        total: count,
      },
    });
  }
  return err({ message: "失败" });
}

// 更新分享数据
async function mUpdateCard ({ read_card_id, accumulative_count, max_continuous_count }) {
  const updateRow = await NutReadCard.update(
    { accumulative_count, max_continuous_count },
    {
      where: {
        read_card_id,
      },
    },
  );
  if (!updateRow || !Array.isArray(updateRow)) {
    return err({ message: "更新失败" });
  }
  const [ row ] = updateRow;
  return rsp({ message: "更新成功", data: { row } });
}

// 查看最近的提交
async function mGetRecentCard ({ nick_name }) {
  const recentRow = await NutReadCard.findOne({
    where: {
      nick_name,
    },
    order: [ [ "read_create_time", "DESC" ] ],
  }).catch(console.error);
  if (!recentRow) {
    return err({ message: "查找失败" });
  }
  return rsp({ message: "查找成功", data: { card: recentRow } });
}

// 添加或取消赞
async function mToggleLikes ({ read_card_id, nick_name }) {
  const targetCard = await NutReadCard.findOne({
    where: {
      read_card_id,
    },
  }).catch(console.error);
  if (!targetCard) {
    return err({ message: "此记录不存在" });
  }
  let { likes } = targetCard;
  likes = likes || "";
  let likesArr = likes.split(",");
  likesArr = likesArr.filter(name => Boolean(name));
  if (likesArr.includes(nick_name)) {
    likesArr = likesArr.filter(name => nick_name !== name);
  } else {
    likesArr.push(nick_name);
  }
  const likesStr = likesArr.join(",");
  const updateRow = await NutReadCard.update(
    { likes: likesStr },
    {
      where: {
        read_card_id,
      },
    },
  );
  if (!updateRow || !Array.isArray(updateRow)) {
    return err({ message: "操作失败" });
  }
  const [ row ] = updateRow;
  return rsp({ message: "操作成功", data: { likeRow: row, likesArr } });
}

module.exports = {
  mAddCard,
  mGetCards,
  mUpdateCard,
  mGetRecentCard,
  mGetCardIntegral,
  mToggleLikes,
  mGetRecentAchievement,
};
