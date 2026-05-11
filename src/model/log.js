const { sqlIns } = require("../entities/orm");
const { DataTypes } = require("sequelize");
const { rsp } = require("../entities/response");
const { err } = require("../entities/error");
const { isNumber } = require("mazey");

const MazeyLog = sqlIns.define(
  "MazeyLog",
  {
    log_id: {
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
      // 姓名
      type: DataTypes.STRING(20),
    },
    log_type: {
      // 日志类型
      type: DataTypes.STRING(20),
    },
    ip: {
      // ip
      type: DataTypes.STRING(20),
    },
    content: {
      // 日志内容
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

// 新增日志
async function mAddLog ({ log_type, ip, content }) {
  const cRes = await MazeyLog.create({ log_type, ip, content }).catch(console.error);
  if (cRes && cRes.dataValues) {
    return rsp({ message: "添加成功", data: cRes.dataValues });
  }
  return err({ message: "添加失败" });
}

// 查看内容是否存在
async function mIsExistContent ({ content }) {
  const cRes = await MazeyLog.count({
    where: {
      content,
    },
  }).catch(console.error);
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
