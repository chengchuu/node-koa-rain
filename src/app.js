const Koa = require("koa");
const Router = require("koa-router");
const koaBody = require("koa-body");
const path = require("path");
const server = require("./router/server");
const tiny = require("./router/tiny");
const mkdir = require("./utils/mkdir");
let schedule = require("node-schedule");
const { sReportErrorInfo, sAddLog } = require("./service/log");
const { authMiddleware } = require("./entities/jwt/index");
// 实例
const app = new Koa();
const router = new Router();
// 创建 temp
mkdir.mkdirs("temp", err => {
  console.log("mkdirs temp err", err); // 错误的话，直接打印如果地址跟
});
mkdir.mkdirs("video", err => {
  console.log("mkdirs video err", err); // 错误的话，直接打印如果地址跟
});
// 请求日志
app.use(async (ctx, next) => {
  const reqPath = ctx.path;
  if (reqPath !== "/server/log/add") {
    sAddLog({ ctx, logType: "request", content: `Rain ${ctx.method} ${reqPath}` });
  }
  await next();
});
app.use(authMiddleware);
// 上传文件
app.use(
  koaBody({
    multipart: true,
    formidable: {
      uploadDir: path.join(__dirname, "./temp/"), // temp
      keepExtensions: true,
      maxFileSize: 200 * 1024 * 1024, // 设置上传文件大小最大限制，200M
    },
  }),
);
app.context.linkMap = new Map();
app.context.logContent = [];
const JOB = schedule.scheduleJob("*/60 * * * *", () => {
  app.context.linkMap = new Map();
});
// 装载所有路由并且分类
router.use("/server", server.routes(), server.allowedMethods());
router.use("/t", tiny.routes(), tiny.allowedMethods());
app.use(router.routes()).use(router.allowedMethods());
// 错误监控
app.on("error", async (err, ctx) => {
  console.error("Server Error:", err);
  sReportErrorInfo({ ctx, logType: "server_error", err, url: "", alias: "pigKey" });
});
// 监听端口
app.listen(3224);
