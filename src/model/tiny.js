const { sqlIns } = require("../entities/orm");
const { DataTypes } = require("sequelize");

const MazeyTiny = sqlIns.define(
  "MazeyTiny",
  {
    tiny_id: {
      // 自增 ID
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    ori_link: {
      // 长链接
      type: DataTypes.STRING(350),
    },
    ori_md5: {
      // 长链接 MD5 HASH
      type: DataTypes.STRING(40),
    },
    tiny_link: {
      // 短链接 https://mazey.cn/t/abcdef
      type: DataTypes.STRING(30),
    },
    tiny_key: {
      // Key abcdef
      type: DataTypes.STRING(20),
    },
    tiny_count: {
      type: DataTypes.INTEGER,
    },
  },
  {
    tableName: "mazey_tiny",
    createdAt: "create_at",
    updatedAt: false,
  },
);

MazeyTiny.sync();

// 查询长链接 / 是否已生成过短链接
async function queryOriLink ({ ori_md5 }) {
  let queryOriLinkRes = MazeyTiny.findOne({
    where: {
      ori_md5,
    },
  }).catch(console.error);
  return queryOriLinkRes;
}

// 保存长链接 / 返回 ID 用于生成短链接
async function saveOriLink ({ ori_link, ori_md5 }) {
  return MazeyTiny.create({ ori_link, ori_md5 }).catch(console.error);
}

// 保存短链接
async function saveTinyLink ({ tiny_id, tiny_link, tiny_key }) {
  return MazeyTiny.update(
    {
      tiny_link,
      tiny_key,
    },
    {
      where: {
        tiny_id,
      },
    },
  ).catch(console.error);
}

// 查询短链接映射的长链接
async function queryTinyLink ({ tiny_key }) {
  return MazeyTiny.findOne({
    attributes: [ "ori_link" ],
    where: {
      tiny_key,
    },
  }).catch(console.error);
}
// 更新短链接访问次数
async function mUpdateTinyLink ({ tiny_key }) {
  console.log("wozhixinglewa", tiny_key);
  return MazeyTiny.increment("tiny_count", {
    where: {
      tiny_key,
    },
  }).catch(console.error);
}

module.exports = {
  queryOriLink,
  saveOriLink,
  saveTinyLink,
  queryTinyLink,
  mUpdateTinyLink,
};
