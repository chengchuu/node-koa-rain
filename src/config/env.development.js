const $mysql_server_name = "localhost"; // Server
const $mysql_username = "#rabbit"; // User
const $mysql_password = "#rabbit"; // Password
const $mysql_database = "#rabbit"; // Name
const mysqlConf = {
  $mysql_server_name,
  $mysql_username,
  $mysql_password,
  $mysql_database,
};
const pswSecret = "#rabbit"; // 密码加密密钥
const UID = "#rabbit"; // User ID
const KEY = "#rabbit"; // Key
const WeatherConf = {
  UID,
  KEY,
};
const $email_name = "#rabbit"; // Server
const $email_key = "#rabbit"; // User
// Alias key集合
const alias2Key = new Map([
  // 小兔子 Rabbit Daily
  [ "rabbitKey", "#rabbit" ],
  // 小橘子 Orange Error 错误监控
  [ "orangeKey", "#rabbit" ],
  [ "pigKey", "#rabbit" ],
  [ "sendOutKey", "#rabbit" ],
  [ "testCarKey", "#rabbit" ],
  [ "strongerKey", "#rabbit" ],
  [ "forumFEHelperKey", "#rabbit" ],
  [ "getOffKey", "#rabbit" ],
  [ "touchFish01Key", "#rabbit" ],
  [ "touchFish02Key", "#rabbit" ],
  [ "communityFEServerErrorUrl", "#rabbit" ],
  [ "communityFEServerTestUrl", "#rabbit" ],
  [ "feishuTest", "#rabbit" ],
  [ "feishuStronger", "#rabbit" ],
  [ "forHeart", "#rabbit" ],
  [ "strongerGroup", "#rabbit" ],
  [ "stronger001", "#rabbit" ],
  [ "TestUrl", "#rabbit" ],
]);

module.exports = {
  mysqlConf,
  WeatherConf,
  alias2Key,
  $email_name,
  $email_key,
  pswSecret,
};
