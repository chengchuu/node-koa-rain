// Read
const { err } = require("../../entities/err");
const { mAddCard, mGetCards, mUpdateCard, mGetRecentCard, mGetCardIntegral, mToggleLikes, mGetRecentAchievement } = require("../../model/nut/read");
const { mAddWiki, mGetWikis, mGetAllWikis, mGetWikiIntegral } = require("../../model/nut/wiki");
const { format, isSameDay } = require("date-fns");
const { genBookName } = require("../../utils/utils");
const { isNumber } = require("mazey");
const { alias2Key } = require("../../config/env.development");
const { sRobotSendNews } = require("../robot/robot");
const { sAddNewUser } = require("../user");
const { sRobotSendColorText } = require("../robot");

// Punchs
async function sPunchCard (ctx) {
  const { book_name, nick_name, real_name, content, imgs, read_card_type, read_card_status, status_0_tip } = ctx.request.body;
  // Add user(Async).
  sAddNewUser(ctx, nick_name, real_name);
  // Add data.
  const read_card_date = format(Date.now(), "yyyy-MM-dd");
  // Check failed images.
  if (imgs.length) {
    const blankImgs = imgs.filter(img => img === "");
    const blankCount = blankImgs.length;
    if (blankCount) {
      return err({ message: `有 ${blankCount} 张图片上传失败，请先删除上传失败的图片然后重新上传` });
    }
  }
  const mAddCardRes = await mAddCard({ nick_name, real_name, book_name, content, imgs, read_card_type, read_card_date, read_card_status, status_0_tip });
  if (mAddCardRes.ret !== 0) {
    return mAddCardRes;
  }
  const {
    data: { read_card_date: realDate, accumulative_count, max_continuous_count, achievement },
  } = mAddCardRes;
  // Notification
  let img = "";
  if (imgs.length) {
    img = imgs[0];
  }
  sRobotSend({ read_card_date: realDate, nick_name, book_name, content, img, accumulative_count, max_continuous_count })
    .then(() => {
      // Welcome new user.
      if (accumulative_count === 1) {
        sRobotSendColorText({
          message: `〈😃ノ 欢迎 ${nick_name} 加入小兔读书会 🎉🎉🎉`,
          key: alias2Key.get("readKey"),
          immediately: true,
        });
      }
      // Achievement
      if (achievement) {
        const emojiGroups = [ "💪💪💪", "👏👏👏", "💃💃🎊🕺🕺", "💗💗💗", "💛💛💛", "💙💙💙", "💜💜💜", "💚💚💚", "💓💓💓", "💘💘💘", "✨✨✨", "🌟🌟🌟", "🌞🌞🌞", "🌝🌝", "🌚🌚" ];
        const showIndex = Math.floor(Math.random() * emojiGroups.length);
        const emojiGroup = emojiGroups[showIndex];
        let contentSuffix = "";
        if (max_continuous_count === 3) {
          contentSuffix = "\n \n一个人可以走得很快\n \n但在小兔读书会\n \n可以走得更远";
        } else if (max_continuous_count === 5) {
          contentSuffix = "\n \n偶尔放慢脚步\n \n为自己鼓掌\n \n这是一次达成\n \n也是一次新的开始";
        } else if (max_continuous_count === 10) {
          // Winter
          contentSuffix = "\n \n在冬日里积蓄能量\n \n静待春的绽放\n \n在小兔读书会\n \n守候梦想发芽🌱";
        } else if (max_continuous_count === 21) {
          contentSuffix = "\n \n世界上有两种最耀眼的光芒\n \n一种是太阳\n \n一种是你坚持的模样";
        } else if (max_continuous_count === 110) {
          contentSuffix = "\n \n逆风的方向\n \n更适合飞翔\n \n被火烧过\n \n才能出现凤凰";
        } else if (isSameDay(new Date(), new Date("2021-11-11"))) {
          contentSuffix = "\n \n购物狂欢夜\n \n亦作读书时";
        }
        sRobotSendColorText({
          message: `${nick_name} 已经连续读书 ${max_continuous_count} 天啦！获得成就【${achievement}】${emojiGroup}${contentSuffix}`,
          key: alias2Key.get("readKey"),
          immediately: true,
        });
      }
    })
    .catch(console.error);
  return mAddCardRes;
}

// Acquire achievement.
async function sGetRecentAchievement ({ nickName }) {
  const GetRecentAchievementRes = await mGetRecentAchievement({ nick_name: nickName });
  if (GetRecentAchievementRes && GetRecentAchievementRes.ret === 0) {
    return GetRecentAchievementRes;
  }
  return GetRecentAchievementRes;
}

// Feeds
async function sGetFeeds (ctx) {
  let { currentPage, pageSize, startDate, endDate, simple, isPrivacy } = ctx.query;
  pageSize = Number(pageSize);
  const mGetCardsRes = await mGetCards({ currentPage, pageSize, startDate, endDate, simple, isPrivacy });
  if (mGetCardsRes.ret !== 0) {
    return mGetCardsRes;
  }
  return mGetCardsRes;
}

// Update
async function sUpdateCard (ctx) {
  const { read_card_id, accumulative_count, max_continuous_count } = ctx.request.body;
  return mUpdateCard({ read_card_id, accumulative_count, max_continuous_count });
}

// Add a read note.
async function sAddWiki (ctx) {
  const { nick_name, book_name, content } = ctx.request.body;
  const mAddWikiRes = await mAddWiki({ nick_name, book_name, content });
  if (mAddWikiRes.ret !== 0) {
    return mAddWikiRes;
  }
  return mAddWikiRes;
}

// Get notes by nickname.
async function sGetWikis (ctx) {
  const { nick_name } = ctx.query;
  const mGetWikisRes = await mGetWikis({ nick_name });
  if (mGetWikisRes.ret !== 0) {
    return mGetWikisRes;
  }
  return mGetWikisRes;
}

// Get all notes.
async function sGetAllWikis (ctx) {
  console.log("_ ctx", ctx);
  const mGetWikisRes = await mGetAllWikis();
  if (mGetWikisRes.ret !== 0) {
    return mGetWikisRes;
  }
  return mGetWikisRes;
}

// Send notifications by the robot.
async function sRobotSend ({ read_card_date, nick_name, book_name, content, img, accumulative_count, max_continuous_count }) {
  const date = format(new Date(read_card_date), "M.d");
  let continuousText = "";
  if (isNumber(accumulative_count) && isNumber(max_continuous_count)) {
    continuousText = `累计分享 ${accumulative_count} 次 连续读书 ${max_continuous_count} 天`;
    if (content) {
      continuousText = `${continuousText}\n`;
    }
  }
  if (content) {
    content = continuousText + content;
  } else {
    content = continuousText;
  }
  const GetRecentAchievementRes = await sGetRecentAchievement({ nickName: nick_name });
  let achievementTitle = " ";
  if (GetRecentAchievementRes.ret === 0) {
    const {
      data: { achievement },
    } = GetRecentAchievementRes;
    achievementTitle = `【${achievement}】`;
  }
  return sRobotSendNews({
    title: `${date}${achievementTitle}${nick_name} ${genBookName(book_name)}`,
    description: content || "",
    url: "https://i.mazey.net/x/nut-read/?from=robot#/home",
    picurl: img || "https://i.mazey.net/asset/read/rabbitReadBanner-534x228.jpg",
    key: alias2Key.get("readKey"),
    immediately: true,
  });
}

// Get recent records.
async function sGetRecentCard (ctx) {
  const { nick_name } = ctx.query;
  const RecentCardRes = await mGetRecentCard({ nick_name });
  if (RecentCardRes.ret !== 0) {
    return RecentCardRes;
  }
  return RecentCardRes;
}

// Calculate the integral of cards.
async function sGetCardIntegral (ctx) {
  const { nick_name } = ctx.query;
  const CardIntegralRes = await mGetCardIntegral({ nick_name });
  if (CardIntegralRes.ret !== 0) {
    return CardIntegralRes;
  }
  return CardIntegralRes;
}

// Calculate the integral of notes.
async function sGetWikiIntegral (ctx) {
  const { nick_name } = ctx.query;
  const WikiIntegralRes = await mGetWikiIntegral({ nick_name });
  if (WikiIntegralRes.ret !== 0) {
    return WikiIntegralRes;
  }
  return WikiIntegralRes;
}

// Like
async function sToggleLikes (ctx) {
  const { read_card_id, nick_name } = ctx.request.body;
  const ToggleLikesRes = await mToggleLikes({ read_card_id, nick_name });
  if (ToggleLikesRes.ret !== 0) {
    return ToggleLikesRes;
  }
  return ToggleLikesRes;
}

module.exports = {
  sPunchCard,
  sGetFeeds,
  sAddWiki,
  sGetWikis,
  sGetAllWikis,
  sUpdateCard,
  sGetRecentCard,
  sGetCardIntegral,
  sGetWikiIntegral,
  sToggleLikes,
  sGetRecentAchievement,
};
