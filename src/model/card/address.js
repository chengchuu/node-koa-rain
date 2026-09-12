const logger = require("../../entities/logger");

const { sqlIns } = require("../../entities/orm");
const { DataTypes } = require("sequelize");
const { rsp } = require("../../entities/response");
const { err } = require("../../entities/error");
const MazeyAddress = sqlIns.define(
  "MazeyAddress",
  {
    address_id: {
      // Auto-increment ID
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    address_province: {
      type: DataTypes.INTEGER,
    },
    address_city: {
      type: DataTypes.INTEGER,
    },
    address_district: {
      type: DataTypes.INTEGER,
    },
    address_detail: {
      type: DataTypes.STRING(200),
    },
    address_content: {
      type: DataTypes.STRING(500),
    },
    address_user: {
      type: DataTypes.STRING(50),
    },
    address_mobile: {
      type: DataTypes.STRING(50),
    },
    address_number: {
      // Tracking number
      type: DataTypes.STRING(50),
    },
    // Carrier: JD or SF Express
    address_category: {
      type: DataTypes.STRING(50),
    },
    address_date: {
      type: DataTypes.STRING(50),
    },
    // Card number
    card_number: {
      type: DataTypes.STRING(50),
    },
  },
  {
    tableName: "mazey_address",
    createdAt: "create_at",
    updatedAt: "update_at",
  },
);
async function mGetAddressByNumber({ card_number }) {
  const ret = await MazeyAddress.findOne({
    where: {
      card_number,
    },
    through: { attributes: [] },
  }).catch(error => {
    logger.error({ err: error }, "[card] address lookup failed");
  });
  if (!ret) {
    return err({ message: "该卡号没有地址" });
  }
  return rsp({ data: ret.dataValues });
}
async function mAddAddressByNumber({ card_number, address_detail, address_user, address_mobile, address_date }) {
  const ret = await MazeyAddress.create({
    card_number,
    address_detail,
    address_user,
    address_mobile,
    address_date,
  }).catch(error => {
    logger.error({ err: error }, "[card] address creation failed");
  });
  if (ret && ret.dataValues) {
    return rsp({ data: ret.dataValues });
  }
  return err();
}

async function mUpdateAddress({ card_number, address_id, address_detail, address_user, address_mobile, address_date, address_category, address_number }) {
  let ret = "";
  if (address_number) {
    ret = await MazeyAddress.update(
      {
        address_number,
        address_category,
      },
      {
        where: {
          address_id,
        },
      },
    ).catch(error => {
      logger.error({ err: error }, "[card] address update failed");
    });
    if (!Array.isArray(ret) || ret[0] === 0) {
      return err({ message: "该卡号不存在" });
    }
    return rsp({ data: { affectedRows: ret[0] } });
  } else {
    const ret = await MazeyAddress.update(
      {
        address_detail,
        address_user,
        address_mobile,
        address_date,
      },
      {
        where: {
          address_id,
        },
      },
    ).catch(error => {
      logger.error({ err: error }, "[card] address update failed");
    });
    if (Array.isArray(ret) && ret[0] > 0) {
      return rsp({ data: { affectedRows: ret[0] } });
    }
    return err({ message: "该卡号不存在" });
  }
}
module.exports = {
  MazeyAddress,
  mGetAddressByNumber,
  mAddAddressByNumber,
  mUpdateAddress,
};
