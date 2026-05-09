const { err } = require('../../entities/err');
const { rsp } = require('../../entities/response');
const { addNewScore, queryAllScore } = require('../../model/game/score');
const { queryUpdateGame, mUpdateGame } = require('../../model/game/game');
const Joi = require('joi');
// 增加游戏评分 (评分的时候需要对游戏表的分数进行处理)
async function sAddNewScore (ctx, { game_id, score, start, remark }) {
  const schema = Joi.object({
    game_id: Joi.number()
      .integer()
      .required()
      .error(new Error('请输入游戏名称')),
    score: Joi.number()
      .required()
      .error(new Error('请输入游戏评分')),
  });
  const { error } = schema.validate({
    game_id,
    score,
  });
  if (error) {
    return err({ message: error.message });
  }
  const jwtToken = ctx.state.user;
  const queryGameRes = await queryUpdateGame({ game_id });
  if (queryGameRes.data) {
    const addNewScoreRes = await addNewScore({
      game_id,
      game_name: queryGameRes.data.game_name,
      score,
      start,
      remark,
      user_id: jwtToken.data.user_id,
      user_name: jwtToken.data.user_name,
    });
    if (addNewScoreRes.data) {
      let mUpdateGameRes = await mUpdateGame(queryGameRes, addNewScoreRes);
      console.log('mUpdateGameRes', mUpdateGameRes);
    }
    return addNewScoreRes;
  } else {
    return queryGameRes;
  }
}
// 查询所有游戏
async function sQueryAllScore (ctx, { game_id }) {
  const queryAllScoreRes = await queryAllScore({ game_id });
  return queryAllScoreRes;
}
module.exports = {
  sAddNewScore,
  sQueryAllScore,
};
