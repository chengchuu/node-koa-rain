const { err } = require('../../entities/err');
const { rsp } = require('../../entities/response');
const { mAddNewTags, mQueryOldTags } = require('../../model/game/tag');
const { mAddNewGameTags } = require('../../model/game/game');
const { sRobotRemindForConfirmTag } = require('../robot/robot');
const Joi = require('joi');
const { url } = require('koa-router');
async function sIsAddNewTags (ctx, { user_id, user_name, game_id, tag_name }) {
  const jwtToken = ctx.state.user;
  let id = user_id || (jwtToken && jwtToken.data ? jwtToken.data.user_id : '');
  let name = user_name || (jwtToken && jwtToken.data ? jwtToken.data.user_name : '');
  // 先进行已有标签插入,没有确认的标签进行确认
  let mQueryOldTagsRes = await mQueryOldTags({ tag_name });
  let oldTags = [];
  let newTags = [];
  tag_name.forEach(item => {
    let index = mQueryOldTagsRes.data.findIndex(v => v.dataValues.tag_name === item);
    if (index > -1) {
      oldTags.push(item);
    } else {
      newTags.push(item);
    }
  });
  if (oldTags.length > 0) {
    let sAddNewTagsRes = await sAddNewTags(ctx, { user_id: id, user_name: name, game_id, tag_name: oldTags });
    // 只需要给游戏增加标签即可
    if (newTags.length === 0) {
      return sAddNewTagsRes;
    }
  }
  console.log('oldTags', oldTags, 'newTags', newTags);
  let url = 'localhost:3224';
  if (ctx.request && ctx.request.header) {
    url = `${ctx.request.header.host}`;
  }
  console.log('url', url);
  if (newTags.length > 0) {
    let params = {
      ctx,
      key: '',
      alias: 'pigKey',
      tags: ['标签添加'],
      tagList: newTags,
      user_id: id,
      user_name: name,
      game_id,
      contents: [
        {
          name: 'host',
          value: url,
        },
        {
          name: 'url',
          value: '/server/tag/add',
        },
        {
          name: 'env',
          value: process.env.NODE_ENV,
        },
      ],
    };
    const robotRemindForConfirmTagRes = await sRobotRemindForConfirmTag({ ...params });
    return robotRemindForConfirmTagRes;
  }
}
// 批量增加标签,主要判重
async function sAddNewTags (ctx, { user_id, user_name, game_id, tag_name, tag_status = 1 }) {
  const schema = Joi.object({
    game_id: Joi.number()
      .integer()
      .required()
      .error(new Error('请选择游戏')),
  });
  const { error } = schema.validate({
    game_id,
  });
  if (typeof tag_name === 'string') {
    tag_name = tag_name.split(',');
  }
  if (error) {
    return err({ message: error.message });
  }
  const jwtToken = ctx.state.user;
  const mAddNewTagsRes = await mAddNewTags({
    user_id: user_id || (jwtToken && jwtToken.data ? jwtToken.data.user_id : ''),
    user_name: user_name || (jwtToken && jwtToken.data ? jwtToken.data.user_name : ''),
    game_id,
    tag_name,
    tag_status,
  });
  let tagData = mAddNewTagsRes.data;
  console.log('tagData', tagData, mAddNewTagsRes);
  if (mAddNewTagsRes.data) {
    const mAddNewGameTagsRes = await mAddNewGameTags({
      game_id,
      data: tagData,
    });
  }
  return mAddNewTagsRes;
}
module.exports = {
  sIsAddNewTags,
  sAddNewTags,
};
