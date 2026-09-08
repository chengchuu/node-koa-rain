const logger = require("../entities/logger");

const { err } = require("../entities/err");
const { rsp } = require("../entities/response");
const { getUid, acquireNewUser, mLogin, mGenToken } = require("../model/user");
const { acquireNewCode } = require("../model/code");
const { sendMail } = require("./code");
const { emailRegExp } = require("../utils/utils");
const WeatherApi = require("./weather/weather");
const { WeatherConf } = require("../config/index");
const weatherIns = new WeatherApi(WeatherConf.UID, WeatherConf.KEY);
const axios = require("axios");
const { format } = require("date-fns");
const md5 = require("md5");

const Joi = require("joi");

async function sGetUid(ctx) {
  if (ctx.query.uid) return rsp({ data: { uid: Number(ctx.query.uid) } });
  const uidRes = await getUid(ctx.query);
  if (uidRes === false) {
    return err({ info: "err_uid_params_error", data: { uid: 0 } });
  }
  if (uidRes === null) {
    return err({ info: "err_not_find", data: { uid: 0 } });
  }
  const { user_id: uid } = uidRes;
  return rsp({ data: { uid } });
}

async function sGetUserInfo(ctx) {
  // IP
  const headers = ctx.request.headers;
  const XForwardedFor = headers["x-forwarded-for"] || "";
  const ip = (XForwardedFor.split(", ") && XForwardedFor.split(", ")[0]) || "114.88.250.157";

  let ret = null;
  let ipResult = null;
  try {
    ipResult = await axios
      .get("http://saip.market.alicloudapi.com/ip", {
        params: {
          ip,
        },
        headers: {
          Authorization: "APPCODE #rabbit",
        },
      })
      .catch(error => {
        logger.error({ err: error }, "[user] user information lookup failed");
      });
  } catch (error) {
    return err({ message: "saip error" });
  }
  if (ipResult && ipResult.status && ipResult.status === 200) {
    ret = ipResult.data;
  }
  let showapi_res_body = {};
  if (ret) {
    showapi_res_body = ret.showapi_res_body || {};
  }
  const {
    isp: operator = "", // Network operator
    continents: continent = "", // Continent
    country = "", // Country
    region: province = "", // Province
    city = "", // City
    county = "", // County
    lnt = "", // Longitude
    lat = "", // Latitude
  } = showapi_res_body;
  const location = { operator, continent, country, province, city, county, lnt, lat };

  const weatherLocation = county || city || province;
  let daily = [];
  if (ret) {
    try {
      ({
        results: [ { daily } ],
      } = await weatherIns
        .getWeatherDaily(weatherLocation)
        .then(function(data) {
          return data;
        })
        .catch(error => {
          logger.error({ err: error }, "[user] user information lookup failed");
        }));
    } catch (error) {
      return err({ message: "getWeatherDaily error" });
    }
  }
  const dailyDate = format(Date.now(), "yyyy-MM-dd");
  const dailyItems = daily.filter(v => v.date === dailyDate);
  const thatDailyW = (dailyItems.length && dailyItems[0]) || {};
  const { text_day: dayWeather, high: temperatureHigh, low: temperatureLow } = thatDailyW;
  const weather = { dayWeather, temperatureHigh, temperatureLow };
  return rsp({ data: { ip, location, weather } });
}

async function sAddNewUser(ctx, nick_name, real_name = "", user_password = "", user_email = "") {
  const schema = Joi.object({
    nick_name: Joi.string()
      .pattern(new RegExp("^[a-zA-Z\u4e00-\u9fa5][a-zA-Z0-9\u4e00-\u9fa5]*$"))
      .min(1)
      .max(20)
      .required()
      .error(errors => {
        for (let valErr of errors) {
          switch (valErr.code) {
            case "string.max":
              return new Error("用户名长度不能超过20");
            case "string.empty":
            case "any.required":
              return new Error("用户名必填");
            default:
              return new Error("用户名格式错误");
          }
        }
      }),
  });
  const { error } = schema.validate({
    nick_name: nick_name,
  });
  if (error) {
    return err({ message: error.message });
  }
  if (user_email && !emailRegExp(user_email)) {
    return err({ message: "邮箱输入错误,请重新输入" });
  }
  const GetUserInfoRes = await sGetUserInfo(ctx);
  if (GetUserInfoRes.ret !== 0) {
    return GetUserInfoRes;
  }
  const {
    data: {
      ip,
      location: { city },
    },
  } = GetUserInfoRes;

  const {
    data: { token: requestPassword },
  } = user_password ? mGenToken({ str: user_password }) : { data: { token: "" } };
  const acquireNewUserRes = await acquireNewUser({
    user_name: nick_name,
    user_email,
    real_name,
    user_signup_ip: ip,
    user_fingerprint: md5(nick_name),
    user_password: requestPassword,
    user_signup_city: city,
  });
  if (acquireNewUserRes.ret !== 0) {
    return acquireNewUserRes;
  }
  let sendMailCode = await sendMail(user_email);
  let user_id = acquireNewUserRes.data.user_id;
  acquireNewCode({
    user_id,
    user_name: nick_name,
    code_type: "email",
    user_email,
    verify_status: 0,
    code: sendMailCode,
  });
  // Store the verification code with the new user ID.
  return acquireNewUserRes;
}

async function sGetIP(ctx) {
  const headers = ctx.request.headers;
  const XForwardedFor = headers["x-forwarded-for"] || "";
  const ip = (XForwardedFor.split(", ") && XForwardedFor.split(", ")[0]) || "0.0.0.0";
  return rsp({ data: { ip } });
}

async function sLogin({ ctx, user_name, user_password }) {
  if (!user_name) {
    return err({ message: "请输入用户名" });
  }
  if (!user_password) {
    return err({ message: "请输入密码" });
  }
  return mLogin({ user_name, user_password });
}

function sGenToken({ str }) {
  return mGenToken({ str });
}

module.exports = {
  sGetUid,
  sGetUserInfo,
  sAddNewUser,
  sGetIP,
  sLogin,
  sGenToken,
};
