// 短链接服务
const md5 = require('md5');
const { rsp } = require('../entities/response');
const { convert26 } = require('../utils/utils');
const { queryOriLink, saveOriLink, queryTinyLink, saveTinyLink, mUpdateTinyLink } = require('../model/tiny');
const { tinyBaseUrl } = require('../config/index');

// 生成短链接
async function sGenerateShortLink ({ ori_link }) {
  // 是否已存在
  const ori_md5 = md5(ori_link);
  const queryOriLinkResult = await queryOriLink({ ori_md5 });
  const domain = tinyBaseUrl; // 'https://mazey.cn';
  let tiny_link = '';
  if (!queryOriLinkResult) {
    // 新增长链接
    const saveOriLinkResult = await saveOriLink({ ori_link, ori_md5 });
    const { tiny_id } = saveOriLinkResult;
    const tiny_key = convert26(tiny_id);
    tiny_link = `${domain}/t/${tiny_key}`;
    await saveTinyLink({ tiny_id, tiny_link, tiny_key });
  } else {
    // 查询短链接
    ({ tiny_link } = queryOriLinkResult);
  }
  return rsp({
    data: {
      tiny_link,
    },
  });
}

// 查询短链接
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

// 长链接
async function queryOriLinkByKey (ctx, { tiny_key }) {
  let ori_link;
  let { linkMap } = ctx;
  const specialLink = new Map([
    ['ca', 'https://i.mazey.net/x/nut-read/#/home'], // 小兔读书会首页
    ['cs', 'https://i.mazey.net/x/nut-read/?from=robot#/home'], // 小兔读书会首页（机器人导流）
    ['cp', 'https://i.mazey.net/x/nut-read/#/note'], // 小兔读书会笔记
    ['cr', 'https://i.mazey.net/x/nut-read/#/statistic'], // 小兔读书会数据统计
    ['aa', 'https://rabbitimage.rabbitcdn.com/asset/read/#rabbit.png'], // test
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
      ({ ori_link = 'https://blog.mazey.net/tiny' } = (await queryTinyLink({ tiny_key })) || {});
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
  queryShortLink,
  queryOriLinkByKey,
};
