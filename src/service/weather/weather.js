// 天气
let crypto = require("crypto");
let querystring = require("querystring");
let request = require("request-promise");
let URL = "https://api.seniverse.com/v3/";
let LOCATION = "shanghai"; // 除拼音外，还可以使用 v3 id、汉语等形式
let argv = require("optimist").default("l", LOCATION).argv;

function formLocation (location) {
  let argv = require("optimist").default("l", location).argv;
  return argv.l;
}

function Api (uid, secretKey) {
  this.uid = uid;
  this.secretKey = secretKey;
}

Api.prototype.getSignatureParams = function () {
  let params = {};
  params.ts = Math.floor(new Date().getTime() / 1000); // 当前时间戳（秒）
  params.ttl = 300; // 过期时间
  params.uid = this.uid; // 用户ID
  let str = querystring.encode(params); // 构造请求字符串
  // 使用 HMAC-SHA1 方式，以 API 密钥（key）对上一步生成的参数字符串进行加密
  params.sig = crypto
    .createHmac("sha1", this.secretKey)
    .update(str)
    .digest("base64"); // 将加密结果用 base64 编码，并做一个 urlencode，得到签名 sig
  return params;
};

Api.prototype.getWeatherNow = function (location) {
  let params = this.getSignatureParams();
  params.location = formLocation(location) || argv.l;
  // 将构造的 URL 直接在后端 server 内调用
  return request({
    url: URL + "weather/now.json",
    qs: params,
    json: true,
  });
};

Api.prototype.getWeatherDaily = function (location) {
  let params = this.getSignatureParams();
  params.location = formLocation(location) || argv.l;
  // 将构造的 URL 直接在后端 server 内调用
  return request({
    url: URL + "weather/daily.json",
    qs: params,
    json: true,
  });
};

module.exports = Api;
