const logger = require("../entities/logger");

const { saveIPInfo } = require("../model/visitor");
const WeatherApi = require("./weather/weather");
const { WeatherConf } = require("../config/index");
const weatherIns = new WeatherApi(WeatherConf.UID, WeatherConf.KEY);
const { format } = require("date-fns");

async function getCityInfo({ ip, referrermz, hrefmz, titlemz, visitor_fingerprint }) {
  const ret = null;
  let showapi_res_body = {};
  if (ret) {
    showapi_res_body = ret.showapi_res_body || {};
  }
  const { isp = "", region = "", lnt = "", county = "1", en_name_short = "", lat = "", city = "", city_code = "", country = "", continents = "", en_name = "", ret_code } = showapi_res_body;

  const location = county || city || region;
  let daily = [];
  if (ret) {
    try {
      ({
        results: [ { daily } ],
      } = await weatherIns.getWeatherDaily(location).then(function(data) {
        return data;
      }));
    } catch (error) {
      logger.error({ err: error }, "[ip] weather lookup failed");
    }
  }
  const dailyDate = format(Date.now(), "yyyy-MM-dd");
  const dailyItems = daily.filter(v => v.date === dailyDate);
  const thatDailyW = (dailyItems.length && dailyItems[0]) || {};
  const { text_day: visitor_day_weather, high: visitor_temperature_high, low: visitor_temperature_low } = thatDailyW;

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
 * @description Read the forwarded address before falling back to connection addresses.
 * @param {object} req - Request with headers and connection details.
 * @returns {string} Forwarded header or connection address.
 */
function getClientIP(req) {
  return (
    req.headers["x-forwarded-for"] || // Prefer the forwarded address when a reverse proxy supplies it.
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket.remoteAddress
  );
}

module.exports = {
  getCityInfo,
  getClientIP,
};
