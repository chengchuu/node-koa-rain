const WeatherApi = require("./weather");
const { WeatherConf } = require("../../config/index");
const { err } = require("../../entities/error");
const { sReportErrorInfo } = require("../log");
const weatherIns = new WeatherApi(WeatherConf.UID, WeatherConf.KEY);
const { format } = require("date-fns");
const { rsp } = require("../../entities/response");

async function sGetWeatherNow () {}

async function sGetWeatherDaily ({ location = "shanghai" } = {}) {
  const weatherInsRes = await weatherIns
    .getWeatherDaily(location)
    .then(function (data) {

      return data;
    })
    .catch(function (err) {

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
