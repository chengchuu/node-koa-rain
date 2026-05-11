const WeatherApi = require("./weather");
const { WeatherConf } = require("../../config/index");
const { err } = require("../../entities/error");
const { sReportErrorInfo } = require("../log");
const weatherIns = new WeatherApi(WeatherConf.UID, WeatherConf.KEY);
const { format } = require("date-fns");
const { rsp } = require("../../entities/response");

/**
 * @method sGetWeatherNow
 * @description 获取此时天气
 * */
async function sGetWeatherNow () {}

/**
 * @method sGetWeatherDaily
 * @description 获取当天天气
 * @param {String} location 地区 上海、北京等
 * @return {Object} 天气数据
 * */
async function sGetWeatherDaily ({ location = "shanghai" } = {}) {
  const weatherInsRes = await weatherIns
    .getWeatherDaily(location)
    .then(function (data) {
      // ctx.body = `getWeatherDaily(${JSON.stringify(data, null, 4)})`;
      return data;
    })
    .catch(function (err) {
      // ctx.body = `getError(${err.error.status})`;
      sReportErrorInfo({ logType: "weather_error", err });
    });
  if (!weatherInsRes) {
    return err({ message: "接口错误" });
  }
  const {
    results: [ { location: locationDetail, daily } ],
  } = weatherInsRes;
  const dailyDate = format(Date.now(), "yyyy-MM-dd");
  const dailyItems = daily.filter(v => v.date === dailyDate);
  if (!dailyItems.length) {
    return err({ message: "数据错误" });
  }
  const thatDailyW = (dailyItems.length && dailyItems[0]) || {};
  const { text_day: dayWeatherText, text_night: nightWeatherText, high: temperatureHigh, low: temperatureLow } = thatDailyW;
  return rsp({ data: { locationDetail, dayWeatherText, nightWeatherText, temperatureHigh, temperatureLow } });
}

module.exports = {
  sGetWeatherNow,
  sGetWeatherDaily,
};
