const { err } = require("../entities/err");
const { rsp } = require("../entities/response");
const { updateCodeStatus, acquireNotExpireCode } = require("../model/code");
const axios = require("axios");
const nodemailer = require("nodemailer");
const { $email_name, $email_key } = require("../config/env.development");
const Joi = require("joi");
// 校验邮箱
async function sUpdateCodeStatus (ctx, user_email, code) {
  const schema = Joi.object({
    user_email: Joi.string()
      .required()
      .error(new Error("请输入邮箱")),
    code: Joi.string()
      .required()
      .error(new Error("请输入验证码")),
  });
  const { error } = schema.validate({
    user_email,
    code,
  });
  if (error) {
    return err({ message: error.message });
  }
  const updateCodeStatusRes = await updateCodeStatus({
    user_email,
    code,
  });
  console.log("updateCodeStatusRes", updateCodeStatusRes);
  if (updateCodeStatusRes.ret !== 0) {
    return updateCodeStatusRes;
  }
  if (updateCodeStatusRes.data.expire) {
    // 已经过期
    let sendMailCode = await sendMail(user_email);
    let acquireNotExpireCodeRes = await acquireNotExpireCode({
      user_email: user_email,
      old_code: code,
      new_code: sendMailCode,
    });
    return acquireNotExpireCodeRes;
  }
  return rsp({ data: {} });
}
// 给邮箱发送验证码
async function sendMail (sendMail) {
  console.log("sendMail", sendMail);
  const config = {
    service: "163",
    secure: true,
    auth: {
      // 发件人邮箱账号
      user: $email_name, // 发件人邮箱的授权码 这里可以通过qq邮箱获取 并且不唯一
      pass: $email_key, // 授权码生成之后，要等一会才能使用，否则验证的时候会报错
    },
  };
  const transporter = nodemailer.createTransport(config);
  let code = Array.from(new Array(6), () => Math.floor(Math.random() * 9)).join(""); // 先随便生成一个6位数字
  // 创建一个收件人对象
  const mail = {
    // 发件人 邮箱 '昵称<发件人邮箱>'
    from: $email_name,
    // 主题
    subject: "邮箱校验通知",
    // 收件人 的邮箱
    to: sendMail,
    // 这里可以添加html标签
    html: code,
  };
  transporter.sendMail(mail, function (error, info) {
    if (error) {
      return false;
    }
    transporter.close();
    console.log("mail sent:", info.response);
    return code;
  });
  return code;
}
module.exports = {
  sendMail,
  sUpdateCodeStatus,
};
