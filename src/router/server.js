const { getCityInfo } = require("./../service/ip");
const { getLatestVisitors, sAgentGet, sAgentPut, sAgentAny, sShowRequestInfo } = require("./../service/visitor");
const { upload, getAssets, sGetOSSConfs, sNewOSSConf, sRemoveAsset, sNewGetOSSConfs, sAddOSSConf, sSynthesize } = require("./../service/upload");
const { report } = require("./../model/report");
const { sGetUserInfo, sLogin, sGenToken, sAddNewUser } = require("./../service/user");
const { sUpdateCodeStatus } = require("./../service/code");
const { sGenerateShortLink, sGetLinkMap, queryShortLink } = require("./../service/tiny");
const {
  sPunchCard,
  sGetFeeds,
  sAddWiki,
  sGetWikis,
  sGetAllWikis,
  sUpdateCard,
  sGetRecentCard,
  sGetCardIntegral,
  sGetWikiIntegral,
  sToggleLikes,
  sGetRecentAchievement,
} = require("./../service/nut/read");
const { sRobotRemindFeperf, sRobotSendText, sRobotRemindForCommonTag } = require("./../service/robot/robot");
const { alias2Key } = require("./../config/env.development");
const { rsp } = require("./../entities/response");
const { sAddLog, sReportErrorInfo } = require("./../service/log");
const Router = require("koa-router");
const server = new Router();
const WeatherApi = require("../service/weather/weather");
const { WeatherConf } = require("./../config/index");
const { sGetRobotKeyByAlias } = require("../service/robot");
const { sGetWeatherDaily } = require("../service/weather");
const { sGetToken, sGetTicket } = require("../service/weixin");
const { sAddNewGame, sQueryAllGame, sQueryGame } = require("../service/game/game");
const { sAddNewScore, sQueryAllScore } = require("../service/game/score");
const { sAddNewTags, sIsAddNewTags } = require("../service/game/tag");
const { sGetChatInfo } = require("../service/chat");
const { sUploadCard, sBatchAddCrab, sGetCardByNumber, sAddAddressByNumber, sUpdateCardByAddressNumber, sGetAddressByNumber, sGetCrabByNumber, sGetAddressInfo } = require("../service/card/card");
const weatherIns = new WeatherApi(WeatherConf.UID, WeatherConf.KEY);
// 校验
server
  // Ping (非登录接口)
  .get("/ping", async ctx => {
    ctx.body = "ok";
  })
  // User
  .post("/user/login", async ctx => {
    const { user_name, user_password } = ctx.request.body;
    ctx.body = await sLogin({ user_name, user_password });
  })
  .post("/user/register", async ctx => {
    const { nick_name, real_name, user_password, user_email } = ctx.request.body;
    ctx.body = await sAddNewUser(ctx, nick_name, real_name, user_password, user_email);
  })
  .post("/user/gen-token", async ctx => {
    const { str } = ctx.request.body;
    ctx.body = await sGenToken({ str });
  })
  .get("/user/info", async ctx => {
    ctx.body = await sGetUserInfo(ctx);
  })
  // code
  .post("/code/check-code", async ctx => {
    const { user_email, code } = ctx.request.body;
    ctx.body = await sUpdateCodeStatus(ctx, user_email, code);
  })
  // Robot
  .post("/robot/feperf", async ctx => {
    ctx.body = await sRobotRemindFeperf(ctx);
  })
  .post("/robot/send-text", async ctx => {
    const { message } = ctx.request.body;
    await sRobotSendText({ message, key: alias2Key.get("rabbitKey"), immediately: true });
    ctx.body = rsp();
  })
  .post("/robot/tags", async ctx => {
    const { tags = [], contents = [], extra = {}, key = "", alias = "" } = ctx.request.body;
    const RobotRemindForCommonTagRes = await sRobotRemindForCommonTag({ ctx, tags, contents, extra, key, alias });
    ctx.body = RobotRemindForCommonTagRes;
  })
  .get("/robot/sGetRobotKeyByAlias", async ctx => {
    const { alias } = ctx.query;
    ctx.body = await sGetRobotKeyByAlias({ alias });
  })
  // Log
  .post("/log/add", async ctx => {
    const { log_type, content } = ctx.request.body;
    ctx.body = await sAddLog({ ctx, log_type, content });
  })
  .post("/log/bsixtyfour", async ctx => {
    const { log_type, content } = ctx.request.body;
    ctx.body = await sAddLog({ ctx, log_type, content, isEncode: true });
  })
  .post("/log/report-error-info", async ctx => {
    const { logType, err, pageTitle, url, alias } = ctx.request.body;
    ctx.body = await sReportErrorInfo({ ctx, logType, err, pageTitle, url, alias });
  })
  // Tiny
  .post("/generate/short-link", async ctx => {
    const { ori_link } = ctx.request.body;
    ctx.body = await sGenerateShortLink({ ori_link });
  })
  // Query
  .get("/query/short-link", async ctx => {
    const { tiny_key } = ctx.query;
    ctx.body = await queryShortLink(ctx, { tiny_key });
  })
  .get("/get/link-map", async ctx => {
    ctx.body = await sGetLinkMap(ctx);
  })
  // Weather
  .get("/weather/now", async ctx => {
    await weatherIns
      .getWeatherNow()
      .then(function (data) {
        ctx.body = `getWeatherNow(${JSON.stringify(data, null, 4)})`;
      })
      .catch(function (err) {
        ctx.body = `getError(${err.error.status})`;
      });
  })
  .get("/weather/daily", async ctx => {
    await weatherIns
      .getWeatherDaily()
      .then(function (data) {
        ctx.body = `getWeatherDaily(${JSON.stringify(data, null, 4)})`;
      })
      .catch(function (err) {
        ctx.body = `getError(${err.error.status})`;
      });
  })
  .get("/weather/new-daily", async ctx => {
    const { location } = ctx.query;
    ctx.body = await sGetWeatherDaily({ location });
  })
  // Visitor IP
  .get("/ip", async ctx => {
    const ctxQuery = ctx.query;
    const { callback = "console.log", referrermz = "", hrefmz = "", titlemz = "", visitor_fingerprint = "" } = ctxQuery;
    const headers = ctx.request.headers;
    const XForwardedFor = headers["x-forwarded-for"] || "";
    const realIP = (XForwardedFor.split(", ") && XForwardedFor.split(", ")[0]) || "114.88.250.157";
    const ipRet = await getCityInfo({ ip: realIP, referrermz, hrefmz, titlemz, visitor_fingerprint });
    ctx.body = `${callback}(${JSON.stringify(ipRet)})`;
  })
  .get("/query-visitors", async ctx => {
    ctx.body = await getLatestVisitors();
  })
  // Upload (需登录接口)
  .post("/upload", async ctx => {
    ctx.body = await upload(ctx);
  })
  .get("/upload/query", async ctx => {
    ctx.body = await getAssets({ ctx, asset_operator_id: Number(ctx.query.uid) });
  })
  .post("/upload/remove", async ctx => {
    ctx.body = await sRemoveAsset(ctx);
  })
  .get("/upload/confs", async ctx => {
    ctx.body = await sGetOSSConfs(ctx);
  })
  .get("/upload/get-oss-confs", async ctx => {
    const { token } = ctx.query;
    ctx.body = await sNewGetOSSConfs({ token });
  })
  .get("/upload/new-conf", async ctx => {
    ctx.body = await sNewOSSConf(ctx);
  })
  .post("/upload/add-oss-conf", async ctx => {
    const { ossName, region, accessKeyId, accessKeySecret, bucket, cdnDomain, userName } = ctx.request.body;
    ctx.body = await sAddOSSConf({ ossName, region, accessKeyId, accessKeySecret, bucket, cdnDomain, userName });
  })
  // Agent
  .get("/agent/get", async ctx => {
    ctx.body = await sAgentGet(ctx);
  })
  .post("/agent/put", async ctx => {
    ctx.body = await sAgentPut(ctx);
  })
  .post("/agent", async ctx => {
    ctx.body = await sAgentAny(ctx);
  })
  .get("/show-request-info", async ctx => {
    ctx.body = await sShowRequestInfo(ctx);
  })
  // Report
  .get("/report", async ctx => {
    let ret = await report(ctx.query);
    if (ret !== "success") ret = "fail";
    ctx.body = ret;
  })
  // Rabbit Read Club
  .post("/nut/punch-card", async ctx => {
    ctx.body = await sPunchCard(ctx);
  })
  .get("/nut/feeds", async ctx => {
    ctx.body = await sGetFeeds(ctx);
  })
  .post("/nut/update-card", async ctx => {
    ctx.body = await sUpdateCard(ctx);
  })
  .post("/nut/read-note", async ctx => {
    ctx.body = await sAddWiki(ctx);
  })
  .get("/nut/get-note", async ctx => {
    ctx.body = await sGetWikis(ctx);
  })
  .get("/nut/get-all-note", async ctx => {
    ctx.body = await sGetAllWikis();
  })
  .get("/nut/get-recent-card", async ctx => {
    ctx.body = await sGetRecentCard(ctx);
  })
  .get("/nut/get-card-integral", async ctx => {
    ctx.body = await sGetCardIntegral(ctx);
  })
  .get("/nut/get-wiki-integral", async ctx => {
    ctx.body = await sGetWikiIntegral(ctx);
  })
  .post("/nut/toggle-likes", async ctx => {
    ctx.body = await sToggleLikes(ctx);
  })
  .get("/nut/get-achivement", async ctx => {
    ctx.body = await sGetRecentAchievement({ nickName: ctx.query.nick_name });
  })
  // Wechat
  .get("/weixin/get-token", async ctx => {
    ctx.body = await sGetToken();
  })
  .get("/weixin/get-ticket", async ctx => {
    ctx.body = await sGetTicket();
  })
  // score
  .post("/game/add", async ctx => {
    const obj = ctx.request.body;
    ctx.body = await sAddNewGame(ctx, { ...obj });
  })
  .post("/game/get-list", async ctx => {
    const { currentPage, pageSize } = ctx.request.body;
    ctx.body = await sQueryAllGame(ctx, { currentPage, pageSize });
  })
  .get("/game/query", async ctx => {
    ctx.body = await sQueryGame(ctx, { game_id: ctx.query.id });
  })
  .post("/score/add", async ctx => {
    const obj = ctx.request.body;
    ctx.body = await sAddNewScore(ctx, { ...obj });
  })
  .post("/score/query", async ctx => {
    const { game_id } = ctx.request.body;
    ctx.body = await sQueryAllScore(ctx, { game_id });
  })
  .post("/tag/add", async ctx => {
    const { game_id, tag_name } = ctx.request.body;
    ctx.body = await sIsAddNewTags(ctx, { game_id, tag_name });
  })
  .get("/tag/save", async ctx => {
    const { user_id, user_name, game_id, tag_name, tag_status } = ctx.query;
    ctx.body = await sAddNewTags(ctx, { user_id, user_name, game_id, tag_name, tag_status });
  })
  // 测试gpt
  .post("/chat", async ctx => {
    const { messages } = ctx.request.body;
    ctx.body = await sGetChatInfo(ctx, { messages });
  })
  // 文字转语音
  .post("/synthesize", async ctx => {
    const { content } = ctx.request.body;
    ctx.body = await sSynthesize(ctx, { content });
  })
  // 批量增加提货卡数据(表格导入)
  .post("/card/batch-add", async ctx => {
    ctx.body = await sUploadCard(ctx);
  })
  // 批量增加货物信息(表格导入)
  .post("/card/batch-add-crab", async ctx => {
    ctx.body = await sBatchAddCrab(ctx);
  })
  // 通过卡号和密码判断有没有该提货卡
  .post("/card/get-number", async ctx => {
    const { card_number, card_password } = ctx.request.body;
    ctx.body = await sGetCardByNumber({ card_number, card_password });
  })
  // 给某个卡号增加发货地址
  .post("/card/add-address", async ctx => {
    const { card_number, card_password, address_detail, address_user, address_mobile, address_date } = ctx.request.body;
    ctx.body = await sAddAddressByNumber({ card_number, card_password, address_detail, address_user, address_mobile, address_date });
  })
  // 获取某卡号的收货地址
  .post("/card/get-address", async ctx => {
    const { card_number, card_password } = ctx.request.body;
    ctx.body = await sGetAddressByNumber({ card_number, card_password });
  })
  // 给某卡号地址增加快递单号
  .post("/card/update-address", async ctx => {
    const { address_id, address_category, address_number } = ctx.request.body;
    ctx.body = await sUpdateCardByAddressNumber({ address_id, address_category, address_number });
  })
  // 获取卡的详情
  .post("/card/get-crab", async ctx => {
    const { card_number, card_password } = ctx.request.body;
    ctx.body = await sGetCrabByNumber({ card_number, card_password });
  })
  // 获取物流信息
  .post("/card/get-logistics", async ctx => {
    const { order_number } = ctx.request.body;
    ctx.body = await sGetAddressInfo({ order_number });
  });
module.exports = server;
