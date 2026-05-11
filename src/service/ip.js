// ip服务
const axios = require("axios");
const { saveIPInfo } = require("../model/visitor");
const WeatherApi = require("./weather/weather");
const { WeatherConf } = require("../config/index");
const weatherIns = new WeatherApi(WeatherConf.UID, WeatherConf.KEY);
const { format } = require("date-fns");

async function getCityInfo ({ ip, referrermz, hrefmz, titlemz, visitor_fingerprint }) {
  let ret = null;
  let ipResult = null;
  try {
    ipResult = await axios.get("http://saip.market.alicloudapi.com/ip", {
      params: {
        ip, // '114.88.250.156'
      },
      headers: {
        Authorization: "APPCODE #rabbit",
      },
    });
  } catch (error) {
    console.error("saip error:", error);
  }
  if (ipResult && ipResult.status && ipResult.status === 200) {
    ret = ipResult.data;
  }
  let showapi_res_body = {};
  if (ret) {
    showapi_res_body = ret.showapi_res_body || {};
  }
  const { isp = "", region = "", lnt = "", county = "1", en_name_short = "", lat = "", city = "", city_code = "", country = "", continents = "", en_name = "", ret_code } = showapi_res_body;
  console.log("_ lnt:", lnt);
  console.log("_ en_name_short:", en_name_short);
  console.log("_ lat:", lat);
  console.log("_ en_name:", en_name);
  console.log("_ ret_code:", ret_code);
  // 城市
  const location = county || city || region;
  let daily = [];
  if (ret) {
    try {
      ({
        results: [ { daily } ],
      } = await weatherIns.getWeatherDaily(location).then(function (data) {
        return data;
      }));
    } catch (error) {
      console.error("getWeatherDaily error:", error);
    }
  }
  const dailyDate = format(Date.now(), "yyyy-MM-dd");
  const dailyItems = daily.filter(v => v.date === dailyDate);
  const thatDailyW = (dailyItems.length && dailyItems[0]) || {};
  const { text_day: visitor_day_weather, high: visitor_temperature_high, low: visitor_temperature_low } = thatDailyW;
  // 存储访客 IP 信息
  saveIPInfo({
    $visitorIP: ip,
    $continent: continents,
    $country: country,
    $province: region,
    $city: city,
    $county: county,
    $operator: isp,
    $citycode: city_code,
    $referrerMz: referrermz,
    $hrefMz: hrefmz,
    $get: "api",
    $titleMz: titlemz,
    visitor_day_weather,
    visitor_temperature_high,
    visitor_temperature_low,
    visitor_fingerprint,
  });
  return Promise.resolve(ret);
}

/**
 * @method getClientIP
 * @desc 获取用户 ip 地址
 * @param {Object} req - 请求
 */
function getClientIP (req) {
  return (
    req.headers["x-forwarded-for"] || // 判断是否有反向代理 IP
    req.connection.remoteAddress || // 判断 connection 的远程 IP
    req.socket.remoteAddress || // 判断后端的 socket 的 IP
    req.connection.socket.remoteAddress
  );
}

module.exports = {
  getCityInfo,
  getClientIP,
};
