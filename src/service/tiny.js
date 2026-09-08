const md5 = require("md5");
const { rsp } = require("../entities/response");
const { convert26 } = require("../utils/utils");
const { queryOriLink, saveOriLink, queryTinyLink, saveTinyLink, mUpdateTinyLink } = require("../model/tiny");
const { tinyBaseUrl } = require("../config/index");

async function sGenerateShortLink ({ ori_link }) {

  const ori_md5 = md5(ori_link);
  const queryOriLinkResult = await queryOriLink({ ori_md5 });
  const domain = tinyBaseUrl;
  let tiny_link = "";
  if (!queryOriLinkResult) {

    const saveOriLinkResult = await saveOriLink({ ori_link, ori_md5 });
    const { tiny_id } = saveOriLinkResult;
    const tiny_key = convert26(tiny_id);
    tiny_link = `${domain}/t/${tiny_key}`;
    await saveTinyLink({ tiny_id, tiny_link, tiny_key });
  } else {

    ({ tiny_link } = queryOriLinkResult);
  }
  return rsp({
    data: {
      tiny_link,
    },
  });
}

async function queryShortLink (ctx, { tiny_key }) {
  let { linkMap } = ctx;
  if (linkMap.has(tiny_key)) {
    mUpdateTinyLink({ tiny_key });
    return rsp({
      data: {
        queryTinyLinkResut: {
          ori_link: linkMap.get(tiny_key),
        },
      },
    });
  }
  const queryTinyLinkResut = await queryTinyLink({ tiny_key });
  if (queryTinyLinkResut) {
    linkMap.set(tiny_key, queryTinyLinkResut.ori_link);
    mUpdateTinyLink({ tiny_key });
  }
  return rsp({
    data: {
      queryTinyLinkResut,
    },
  });
}

function sGetLinkMap (ctx) {
  const { linkMap } = ctx;
  if (!(linkMap instanceof Map)) {
    return rsp({
      data: {
        size: 0,
        linkMap: [],
      },
    });
  }
  return rsp({
    data: {
      size: linkMap.size,
      linkMap: Array.from(linkMap.entries()).map(([ tiny_key, ori_link ]) => ({
        tiny_key,
        ori_link,
      })),
    },
  });
}

// Original URL
async function queryOriLinkByKey (ctx, { tiny_key }) {
  let ori_link;
  let { linkMap } = ctx;
  const specialLink = new Map([
    [ "ca", "https://i.mazey.net/x/nut-read/#/home" ], // Rabbit Read Club home
    [ "cs", "https://i.mazey.net/x/nut-read/?from=robot#/home" ], // Rabbit Read Club home for robot referrals
    [ "cp", "https://i.mazey.net/x/nut-read/#/note" ], // Rabbit Read Club notes
    [ "cr", "https://i.mazey.net/x/nut-read/#/statistic" ], // Rabbit Read Club statistics
    [ "aa", "https://rabbitimage.rabbitcdn.com/asset/read/#rabbit.png" ],
  ]);
  if (specialLink.has(tiny_key)) {
    ori_link = specialLink.get(tiny_key);
  } else {
    if (linkMap.has(tiny_key)) {
      mUpdateTinyLink({ tiny_key });
      return rsp({
        data: {
          ori_link: linkMap.get(tiny_key),
        },
      });
    } else {
      ({ ori_link = "https://blog.mazey.net/tiny" } = (await queryTinyLink({ tiny_key })) || {});
      if (ori_link) {
        mUpdateTinyLink({ tiny_key });
        linkMap.set(tiny_key, ori_link);
      }
    }
  }
  return rsp({
    data: {
      ori_link,
    },
  });
}

module.exports = {
  sGenerateShortLink,
  sGetLinkMap,
  queryShortLink,
  queryOriLinkByKey,
};
