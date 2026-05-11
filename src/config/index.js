const path = require("path");
const _resolve = _path => path.resolve(__dirname, _path);
const ENV = process.env.NODE_ENV;
const envConfig = require(`./env.${ENV}`);

Object.assign(envConfig, {
  tinyBaseUrl: "https://i.mazey.net",
  assetsBaseUrl: "https://i.mazey.net",
});

console.log("envConfig", envConfig);

module.exports = envConfig;
