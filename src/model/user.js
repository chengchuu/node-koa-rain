const { sqlIns } = require("../entities/orm");
const { DataTypes, Op } = require("sequelize");
const { err } = require("../entities/error");
const { rsp } = require("../entities/response");
const md5 = require("md5");
const { jwtCreate } = require("../entities/jwt");
const { pswSecret } = require("../config/index");
const MazeyUser = sqlIns.define(
  "MazeyUser",
  {
    user_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_name: {
      // 昵称
      type: DataTypes.STRING(20),
    },
    real_name: {
      // 真实姓名
      type: DataTypes.STRING(20),
    },
    user_password: {
      // 密码
      type: DataTypes.STRING(40),
    },
    user_sex: {
      type: DataTypes.INTEGER,
    },
    user_portrait: {
      type: DataTypes.STRING(50),
    },
    user_email: {
      type: DataTypes.STRING(50),
    },
    user_signup_ip: {
      type: DataTypes.STRING(20),
    },
    user_signup_city: {
      type: DataTypes.STRING(20),
    },
    user_encryption: {
      type: DataTypes.STRING(50),
    },
    user_fingerprint: {
      type: DataTypes.STRING(50),
      primaryKey: true,
    },
  },
  {
    tableName: "mazey_user",
    createdAt: "user_signup_time",
    updatedAt: false,
  },
);

MazeyUser.sync();
// 新增用户
async function acquireNewUser ({ user_signup_ip, user_signup_city, user_fingerprint, user_name, real_name, user_password = "", user_email = "" }) {
  const amount = await MazeyUser.count({
    where: {
      [Op.or]: [ { user_fingerprint: user_fingerprint }, { user_email: user_email } ],
    },
  });
  if (amount === 0) {
    const ret = await MazeyUser.create({
      user_signup_ip,
      user_name,
      real_name,
      user_email,
      user_fingerprint,
      user_signup_city,
      user_password,
    }).catch(console.error);
    if (ret && ret.dataValues) {
      return rsp({ data: ret.dataValues });
    }
    return err();
  }
  return rsp({ message: "用户已存在或邮箱已注册" });
}

// 查询用户 uid
async function getUid ({ user_name, user_email, user_fingerprint }) {
  let where;
  if (user_name) {
    where = { user_name };
  } else if (user_email) {
    where = { user_email };
  } else if (user_fingerprint) {
    where = { user_fingerprint };
  }
  if (!where) return false;
  return MazeyUser.findOne({
    where,
  }).catch(console.error);
}

// 用户登录
async function mLogin ({ user_name, user_password }) {
  const ret = await MazeyUser.findOne({
    where: {
      user_name,
      user_password: {
        [Op.and]: {
          [Op.ne]: "",
          [Op.not]: null,
        },
      },
    },
  }).catch(console.error);
  if (!ret) {
    return err({ message: "用户不存在" });
  }
  console.log("ret", ret);
  const { user_password: realPassword } = ret;
  const {
    data: { token: requestPassword },
  } = mGenToken({ str: user_password });
  if (realPassword === requestPassword) {
    let jwtToken = jwtCreate(ret.dataValues);
    return rsp({ data: { token: realPassword, jwtToken: jwtToken } });
  }
  return err({ message: "密码错误" });
}

// 生成 Token
function mGenToken ({ str }) {
  return rsp({ data: { token: md5(`${str}+${pswSecret}`) } });
}
// 获取用户Id（根据token密码）
async function mGetUserIdByPassword ({ user_password }) {
  const ret = await MazeyUser.findOne({
    where: {
      user_password,
      user_id: {
        [Op.and]: {
          [Op.ne]: "",
          [Op.not]: null,
        },
      },
    },
  }).catch(console.error);
  if (!ret) {
    return err({ message: "用户不存在" });
  }
  const { user_id: userId } = ret;
  return rsp({ data: { userId } });
}

// 获取用户名和id（根据密码）2023319 弃用
async function mGetUserNameByPassword ({ user_password }) {
  const ret = await MazeyUser.findOne({
    where: {
      user_password,
      user_name: {
        [Op.and]: {
          [Op.ne]: "",
          [Op.not]: null,
        },
      },
      user_id: {
        [Op.and]: {
          [Op.ne]: "",
          [Op.not]: null,
        },
      },
    },
  }).catch(console.error);
  if (!ret) {
    return err({ message: "用户不存在" });
  }
  const { user_name: userName, user_id: userId } = ret;
  return rsp({ data: { userName, userId } });
}

module.exports = {
  acquireNewUser,
  getUid,
  mLogin,
  mGenToken,
  mGetUserIdByPassword,
  mGetUserNameByPassword,
};
