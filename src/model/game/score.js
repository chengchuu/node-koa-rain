const logger = require("../../entities/logger");
const { sqlIns } = require("../../entities/orm");
const { DataTypes, Op } = require("sequelize");
const { rsp } = require("../../entities/response");
const { err } = require("../../entities/error");
const MazeyScore = sqlIns.define(
  "MazeyScore",
  {
    score_id: {
      // Auto-increment ID
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      // User ID
      type: DataTypes.INTEGER,
    },
    user_name: {
      type: DataTypes.STRING(20),
    },
    game_id: {
      // Game ID
      type: DataTypes.INTEGER,
    },
    game_name: {
      type: DataTypes.STRING(50),
    },
    start: {
      // Stars: 1-5 in increments of 0.5
      type: DataTypes.FLOAT,
    },
    score: {
      // Score: 1-10 with one decimal place
      type: DataTypes.FLOAT,
    },
    remark: {
      // Notes
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
  }).catch(error => {
    logger.error({ err: error }, "[game] rating creation failed");
  });
  if (ret && ret.dataValues) {
    return rsp({ data: ret.dataValues });
  }
  return err();
}

async function queryAllScore ({ game_id }) {
  const ret = await MazeyScore.findAll({
    where: {
      game_id,
    },
  }).catch(error => {
    logger.error({ err: error }, "[game] rating lookup failed");
  });
  return rsp({ data: ret });
}
module.exports = {
  addNewScore,
  queryAllScore,
};
