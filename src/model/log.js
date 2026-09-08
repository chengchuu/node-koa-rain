const logger = require("../entities/logger");
const { sqlIns } = require("../entities/orm");
const { DataTypes } = require("sequelize");
const { rsp } = require("../entities/response");
const { err } = require("../entities/error");
const { isNumber } = require("mazey");

const MazeyLog = sqlIns.define(
  "MazeyLog",
  {
    log_id: {
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
      // Name
      type: DataTypes.STRING(20),
    },
    log_type: {
      // Log type
      type: DataTypes.STRING(20),
    },
    ip: {
      // IP
      type: DataTypes.STRING(20),
    },
    content: {
      // Log content
      type: DataTypes.STRING(500),
    },
  },
  {
    tableName: "mazey_log",
    createdAt: "create_at",
    updatedAt: false,
  },
);

MazeyLog.sync();

async function mAddLog ({ log_type, ip, content }) {
  const cRes = await MazeyLog.create({ log_type, ip, content }).catch(error => {
    logger.error({ err: error }, "[log] log creation failed");
  });
  if (cRes && cRes.dataValues) {
    return rsp({ message: "添加成功", data: cRes.dataValues });
  }
  return err({ message: "添加失败" });
}

async function mIsExistContent ({ content }) {
  const cRes = await MazeyLog.count({
    where: {
      content,
    },
  }).catch(error => {
    logger.error({ err: error }, "[log] content lookup failed");
  });
  if (!isNumber(cRes)) {
    return err();
  }
  if (cRes === 0) {
    return rsp({ message: "不存在", data: { isExist: false } });
  }
  return rsp({ message: "存在", data: { isExist: true } });
}

module.exports = {
  mAddLog,
  mIsExistContent,
};
