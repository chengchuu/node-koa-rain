const { sqlIns } = require("../../entities/orm");
const { DataTypes, Op } = require("sequelize");
const { rsp } = require("../../entities/response");
const { err } = require("../../entities/error");
const MazeyScore = sqlIns.define(
  "MazeyScore",
  {
    score_id: {
      // 自增 ID
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      // 用户 ID
      type: DataTypes.INTEGER,
    },
    user_name: {
      type: DataTypes.STRING(20),
    },
    game_id: {
      // 游戏id
      type: DataTypes.INTEGER,
    },
    game_name: {
      type: DataTypes.STRING(50),
    },
    start: {
      // 1-5星支持小数0.5的倍数
      type: DataTypes.FLOAT,
    },
    score: {
      // 评分1-10分保留一位小数
      type: DataTypes.FLOAT,
    },
    remark: {
      // 备注
      type: DataTypes.STRING(300),
    },
    content: {
      type: DataTypes.STRING(50),
    },
  },
  {
    tableName: "mazey_score",
    createdAt: "create_at",
    updatedAt: "update_at",
  },
);

MazeyScore.sync();
async function addNewScore ({ game_id, game_name, score, start, remark, user_id, user_name }) {
  const ret = await MazeyScore.create({
    game_id,
    game_name,
    score,
    start,
    remark,
    user_id,
    user_name,
  }).catch(console.error);
  if (ret && ret.dataValues) {
    return rsp({ data: ret.dataValues });
  }
  return err();
}
// 根据游戏查询游戏下的所有评分
async function queryAllScore ({ game_id }) {
  const ret = await MazeyScore.findAll({
    where: {
      game_id,
    },
  }).catch(console.error);
  return rsp({ data: ret });
}
module.exports = {
  addNewScore,
  queryAllScore,
};
