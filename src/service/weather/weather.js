let crypto = require("crypto");
let querystring = require("querystring");
let request = require("request-promise");
let URL = "https://api.seniverse.com/v3/";
let LOCATION = "shanghai"; // Locations also accept v3 IDs and Chinese names.
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
  params.ts = Math.floor(new Date().getTime() / 1000); // Unix timestamp in seconds
  params.ttl = 300; // Signature lifetime in seconds
  params.uid = this.uid;
  let str = querystring.encode(params);
  // Sign the encoded parameters with HMAC-SHA1 and the API secret.
  params.sig = crypto
    .createHmac("sha1", this.secretKey)
    .update(str)
    .digest("base64"); // Encode the signature as Base64; the request library encodes query parameters.
  return params;
};

Api.prototype.getWeatherNow = function (location) {
  let params = this.getSignatureParams();
  params.location = formLocation(location) || argv.l;

  return request({
    url: URL + "weather/now.json",
    qs: params,
    json: true,
  });
};

Api.prototype.getWeatherDaily = function (location) {
  let params = this.getSignatureParams();
  params.location = formLocation(location) || argv.l;

  return request({
    url: URL + "weather/daily.json",
    qs: params,
    json: true,
  });
};

module.exports = Api;
