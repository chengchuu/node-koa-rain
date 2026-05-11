const { sqlIns } = require("../entities/orm");
const { DataTypes, Op } = require("sequelize");
const { mGetUserNameByPassword } = require("./user");
const { err } = require("../entities/error");
const { rsp } = require("../entities/response");

const MazeyOSS = sqlIns.define(
  "MazeyOSS",
  {
    oss_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    oss_name: {
      type: DataTypes.STRING(50),
    },
    region: {
      type: DataTypes.STRING(50),
    },
    access_key_id: {
      type: DataTypes.STRING(50),
    },
    access_key_secret: {
      type: DataTypes.STRING(50),
    },
    bucket: {
      type: DataTypes.STRING(50),
    },
    cdn_domain: {
      type: DataTypes.STRING(50),
    },
    oss_user_id: {
      type: DataTypes.STRING(50),
    },
    oss_is_public: {
      type: DataTypes.INTEGER,
    },
    access_token: {
      type: DataTypes.STRING(50),
    },
    user_name: {
      // 昵称
      type: DataTypes.STRING(20),
    },
  },
  {
    tableName: "mazey_oss",
    createdAt: "oss_create_time",
    updatedAt: false,
  },
);

MazeyOSS.sync();

// 获取 OSS 配置
async function getOSS ({ oss_user_id, oss_id }) {
  console.log("_ oss_user_id:", oss_user_id);
  return MazeyOSS.findOne({
    where: {
      oss_id,
    },
  }).catch(console.error);
}

// 获取 OSS 配置列表
async function mGetOSSConfs ({ oss_user_id, access_token }) {
  let where;
  if (!access_token) {
    where = {
      [Op.or]: [ { oss_user_id }, { oss_is_public: 1 } ],
    };
  } else {
    where = {
      // [Op.or]: [{ oss_user_id }, { access_token }]
      access_token,
    };
  }
  return MazeyOSS.findAll({
    where,
    order: [ [ "oss_id", "DESC" ] ],
  }).catch(console.error);
}

// [新]获取 OSS 配置列表
async function mNewGetOSSConfs ({ token }) {
  const GetUserNameByPasswordRes = await mGetUserNameByPassword({ user_password: token });
  if (GetUserNameByPasswordRes.ret !== 0) {
    return GetUserNameByPasswordRes;
  }
  const {
    data: { userName },
  } = GetUserNameByPasswordRes;
  const ret = await MazeyOSS.findAll({
    where: {
      user_name: userName,
    },
    order: [ [ "oss_id", "DESC" ] ],
  }).catch(console.error);
  if (!ret) {
    return err({ message: "无 OSS 配置" });
  }
  return rsp({ data: { OSSConfs: ret } });
}

// 创建新的 OSS 配置
async function mNewOSSConf ({ oss_name, region, access_key_id, access_key_secret, bucket, cdn_domain, oss_user_id, oss_is_public, access_token }) {
  return MazeyOSS.create({ oss_name, region, access_key_id, access_key_secret, bucket, cdn_domain, oss_user_id, oss_is_public, access_token });
}

// 创建新的 OSS 配置
async function mAddOSSConf ({ ossName, region, accessKeyId, accessKeySecret, bucket, cdnDomain = "https://example.com/", userName }) {
  const cRes = await MazeyOSS.create({ oss_name: ossName, region, access_key_id: accessKeyId, access_key_secret: accessKeySecret, bucket, cdn_domain: cdnDomain, user_name: userName });
  if (cRes) {
    return rsp();
  }
  return err();
}

module.exports = {
  getOSS,
  mGetOSSConfs,
  mNewOSSConf,
  mNewGetOSSConfs,
  mAddOSSConf,
};
