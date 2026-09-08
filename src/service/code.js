const logger = require("../entities/logger");
const { err } = require("../entities/err");
const { rsp } = require("../entities/response");
const { updateCodeStatus, acquireNotExpireCode } = require("../model/code");
const axios = require("axios");
const nodemailer = require("nodemailer");
const { $email_name, $email_key } = require("../config/env.development");
const Joi = require("joi");

async function sUpdateCodeStatus(ctx, user_email, code) {
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
  if (updateCodeStatusRes.ret !== 0) {
    return updateCodeStatusRes;
  }
  if (updateCodeStatusRes.data.expire) {

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

async function sendMail(sendMail) {
  const config = {
    service: "163",
    secure: true,
    auth: {

      user: $email_name,
      pass: $email_key, // A newly generated mail authorization code may take time to become usable.
    },
  };
  const transporter = nodemailer.createTransport(config);
  let code = Array.from(new Array(6), () => Math.floor(Math.random() * 9)).join("");

  const mail = {

    from: $email_name,

    subject: "邮箱校验通知",

    to: sendMail,

    html: code,
  };
  transporter.sendMail(mail, function(error, info) {
    if (error) {
      return false;
    }
    transporter.close();
    logger.info("[code] verification email sent");
    return code;
  });
  return code;
}
module.exports = {
  sendMail,
  sUpdateCodeStatus,
};
