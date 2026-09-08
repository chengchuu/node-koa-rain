const logger = require("../entities/logger");
const { sqlIns } = require("../entities/orm");
const { DataTypes, Op } = require("sequelize");
const { rsp } = require("../entities/response");
const { err } = require("../entities/error");
const { isNumber } = require("mazey");

const MazeyCode = sqlIns.define(
  "MazeyCode",
  {
    code_id: {
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
    code_type: {
      // Verification code type
      type: DataTypes.STRING(20),
    },
    user_email: {
      type: DataTypes.STRING(50),
    },
    verify_status: {
      // Verification status: 0 unchecked, 1 complete, 2 in progress, -1 expired
      type: DataTypes.INTEGER,
    },
    code: {
      // Verification code
      type: DataTypes.STRING(10),
    },
  },
  {
    tableName: "mazey_code",
    createdAt: "create_at",
    updatedAt: false,
  },
);

MazeyCode.sync();

async function acquireNewCode ({ user_id, user_name, code_type, user_email, verify_status = 0, code }) {
  const amount = await MazeyCode.count({
    where: {
      user_email,
    },
  });
  if (amount === 0) {
    const ret = await MazeyCode.create({
      user_id,
      user_name,
      code_type,
      user_email,
      verify_status,
      code,
    }).catch(error => {
      logger.error({ err: error }, "[code] verification code creation failed");
    });
    if (ret && ret.dataValues) {
      return rsp({ data: ret.dataValues });
    }
    return err();
  }
  return rsp({ message: "该邮箱已绑定" });
}
// Replace an expired verification code.
async function acquireNotExpireCode ({ user_email, old_code, new_code }) {
  const cRes = await MazeyCode.findOne({
    where: {
      [Op.and]: [ { user_email: user_email }, { code: old_code } ],
    },
  });
  if (cRes.dataValues) {
    const ret = await MazeyCode.create({
      user_id: cRes.dataValues.user_id,
      user_name: cRes.dataValues.user_name,
      code_type: cRes.dataValues.code_type,
      user_email: user_email,
      verify_status: 0,
      code: new_code,
    }).catch(error => {
      logger.error({ err: error }, "[code] verification code renewal failed");
    });
    if (ret && ret.dataValues) {
      return rsp({ data: ret.dataValues });
    }
    return err();
  }
  return rsp({ message: "该失效邮箱不存在" });
}

async function updateCodeStatus ({ user_email, code }) {
  const cRes = await MazeyCode.findOne({
    where: {
      [Op.and]: [ { user_email: user_email }, { code: code }, { verify_status: 0 } ],
    },
  }).catch(error => {
    logger.error({ err: error }, "[code] verification status update failed");
  });
  if (!cRes) {
    return err({ message: "该邮箱已校验完成或未进行注册" });
  }

  let creat_time = Number(new Date(cRes.dataValues.create_at));
  let now_time = Number(new Date());
  if (now_time > creat_time + 15 * 60 * 1000) {
    const ret = await cRes
      .update({
        verify_status: -1,
      })
      .catch(error => {
        logger.error({ err: error }, "[code] verification status update failed");
      });
    return err({ message: "验证码已过期, 已重新发送验证码", data: { expire: true } });
  } else {
    const ret = await cRes
      .update({
        verify_status: 1,
      })
      .catch(error => {
        logger.error({ err: error }, "[code] verification status update failed");
      });
  }
  return err();
}

async function mIsExistContent ({ user_email }) {
  const cRes = await MazeyCode.count({
    where: {
      user_email,
    },
  }).catch(error => {
    logger.error({ err: error }, "[code] content lookup failed");
  });
  if (!isNumber(cRes)) {
    return err();
  }
  if (cRes === 0) {
    return err({ message: "不存在", data: { isExist: false } });
  }
  return rsp({ message: "该邮箱已绑定", data: { isExist: true } });
}

module.exports = {
  acquireNewCode,
  mIsExistContent,
  updateCodeStatus,
  acquireNotExpireCode,
};
