// 卡号 密码 状态(0, 1)
const { sqlIns } = require("../../entities/orm");
const { DataTypes } = require("sequelize");
const { rsp } = require("../../entities/response");
const { err } = require("../../entities/error");
const { MazeyCrab } = require("./crab");
const { MazeyAddress } = require("./address");
const MazeyCard = sqlIns.define(
  "MazeyCard",
  {
    card_id: {
      // 自增 ID
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    card_number: {
      type: DataTypes.STRING(200),
      unique: true,
    },
    card_password: {
      type: DataTypes.STRING(50),
    },
    card_type: {
      // 1激活 2已使用 3已失效
      type: DataTypes.INTEGER,
    },
    card_status: {
      type: DataTypes.INTEGER,
    },
    card_content: {
      type: DataTypes.STRING(500),
    },
    address_id: {
      type: DataTypes.INTEGER,
    },
    crab_id: {
      type: DataTypes.INTEGER,
    },
  },
  {
    tableName: "mazey_card",
    createdAt: "create_at",
    updatedAt: "update_at",
    indexes: [ { fields: [ "card_number" ] } ],
  },
);
async function mCheckCardByNumber ({ card_number, card_password }) {
  const ret = await MazeyCard.findOne({
    where: {
      card_number,
      card_password: card_password,
    },
    through: { attributes: [] },
  }).catch(console.error);
  if (!ret) {
    return err({ message: "该卡号不存在或者密码错误" });
  }
  return rsp({ data: ret.dataValues });
}
async function mGetCardByNumber ({ card_number }) {
  const ret = await MazeyCard.findOne({
    where: {
      card_number,
    },
    include: [
      {
        model: MazeyAddress,
      },
      {
        model: MazeyCrab,
      },
    ],
    through: { attributes: [] },
  }).catch(console.error);
  if (!ret) {
    return err({ message: "该卡号不存在或者密码错误" });
  }
  return rsp({ data: ret.dataValues });
}
async function mUpdateCard ({ address_id, card_number }) {
  const ret = await MazeyCard.update(
    {
      address_id,
    },
    {
      where: {
        card_number,
      },
    },
  ).catch(console.error);
  if (!Array.isArray(ret) || ret[0] === 0) {
    return err({ message: "该卡号不存在" });
  }
  return rsp({ data: { affectedRows: ret[0] } });
}
async function mUpdateCardByAddress ({ address_id }) {
  const ret = await MazeyCard.update(
    {
      card_type: 2,
    },
    {
      where: {
        address_id,
      },
    },
  ).catch(console.error);
  if (!Array.isArray(ret) || ret[0] === 0) {
    return err({ message: "该卡号不存在" });
  }
  return rsp({ data: { affectedRows: ret[0] } });
}
async function mBatchAddCard (data) {
  const ret = await MazeyCard.bulkCreate(data);
  if (!ret) {
    return err({ message: "失败" });
  }
  return rsp({ data: ret });
}
// 两个外键
MazeyCard.belongsTo(MazeyCrab, { foreignKey: "crab_id" });
MazeyCard.belongsTo(MazeyAddress, { foreignKey: "address_id" });
MazeyCard.sync();
module.exports = {
  mCheckCardByNumber,
  mGetCardByNumber,
  mUpdateCard,
  mUpdateCardByAddress,
  mBatchAddCard,
};
