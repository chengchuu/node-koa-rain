const { sqlIns } = require("../entities/orm");
const { DataTypes, Op } = require("sequelize");
const { rsp } = require("../entities/response");
const { err } = require("../entities/error");
const { isNumber } = require("mazey");

const MazeyCode = sqlIns.define(
  "MazeyCode",
  {
    code_id: {
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
    code_type: {
      // 验证码类型
      type: DataTypes.STRING(20),
    },
    user_email: {
      type: DataTypes.STRING(50),
    },
    verify_status: {
      // 校验状态-1, 0,1,2 0未校验 1校验完成 2校验中 -1已失效
      type: DataTypes.INTEGER,
    },
    code: {
      // code内容
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
// code数据
async function acquireNewCode ({ user_id, user_name, code_type, user_email, verify_status = 0, code }) {
  console.log("code", code);
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
    }).catch(console.error);
    if (ret && ret.dataValues) {
      return rsp({ data: ret.dataValues });
    }
    return err();
  }
  return rsp({ message: "该邮箱已绑定" });
}
// 验证码过期生产新code数据
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
    }).catch(console.error);
    if (ret && ret.dataValues) {
      return rsp({ data: ret.dataValues });
    }
    return err();
  }
  return rsp({ message: "该失效邮箱不存在" });
}
// 更新邮箱状态
async function updateCodeStatus ({ user_email, code }) {
  const cRes = await MazeyCode.findOne({
    where: {
      [Op.and]: [ { user_email: user_email }, { code: code }, { verify_status: 0 } ],
    },
  }).catch(console.error);
  console.log("cRes", cRes);
  if (!cRes) {
    return err({ message: "该邮箱已校验完成或未进行注册" });
  }
  console.log("cRes", cRes);
  // 判断code过期没
  let creat_time = Number(new Date(cRes.dataValues.create_at));
  let now_time = Number(new Date());
  if (now_time > creat_time + 15 * 60 * 1000) {
    const ret = await cRes
      .update({
        verify_status: -1,
      })
      .catch(console.error);
    return err({ message: "验证码已过期, 已重新发送验证码", data: { expire: true } });
  } else {
    const ret = await cRes
      .update({
        verify_status: 1,
      })
      .catch(console.error);
  }
  return err();
}
// 查看内容是否存在
async function mIsExistContent ({ user_email }) {
  const cRes = await MazeyCode.count({
    where: {
      user_email,
    },
  }).catch(console.error);
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
