// const $mysql_server_name = 'localhost'; // Server
// const $mysql_username = 'localuser'; // User
// const $mysql_password = 'localpassword'; // Password
// const $mysql_database = 'mazey'; // Name
const $mysql_server_name = 'localhost'; // Server
const $mysql_username = 'root'; // User
const $mysql_password = 'wxt123'; // Password
const $mysql_database = 'mazey'; // Name
const mysqlConf = {
  $mysql_server_name,
  $mysql_username,
  $mysql_password,
  $mysql_database,
};
const pswSecret = 'mazey'; // 密码加密密钥
const UID = '#rabbit'; // User ID
const KEY = '#rabbit'; // Key
const WeatherConf = {
  UID,
  KEY,
};
const $email_name = '18756272368@163.com'; // Server
const $email_key = 'NKPJLZONGEDXSYVP'; // User
// Alias key集合
const alias2Key = new Map([
  // 小兔子 Rabbit Daily
  ['rabbitKey', '#rabbit'],
  // 小橘子 Orange Error 错误监控
  ['orangeKey', '#rabbit'],
  ['pigKey', '4e247f84-2d1e-4480-8bb5-915642d90cf0'],
  ['sendOutKey', 'e044c355-7bed-4814-9b0e-9710bcbefb89'],
  ['testCarKey', '#rabbit'],
  ['strongerKey', '#rabbit'],
  ['forumFEHelperKey', '#rabbit'],
  ['getOffKey', '#rabbit'],
  ['touchFish01Key', '#rabbit'],
  ['touchFish02Key', '#rabbit'],
  ['communityFEServerErrorUrl', '#rabbit'],
  ['communityFEServerTestUrl', '#rabbit'],
  ['feishuTest', '#rabbit'],
  ['feishuStronger', '#rabbit'],
  ['forHeart', '#rabbit'],
  ['strongerGroup', '#rabbit'],
  ['stronger001', '#rabbit'],
  ['TestUrl', '#rabbit'],
]);

module.exports = {
  mysqlConf,
  WeatherConf,
  alias2Key,
  $email_name,
  $email_key,
  pswSecret,
};
