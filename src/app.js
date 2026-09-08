const logger = require("./entities/logger");
const Koa = require("koa");
const Router = require("koa-router");
const koaBody = require("koa-body");
const path = require("path");
const server = require("./router/server");
const tiny = require("./router/tiny");
const feperf = require("./router/feperf");
const mkdir = require("./utils/mkdir");
let schedule = require("node-schedule");
const { sReportErrorInfo, sAddLog } = require("./service/log");
const { authMiddleware } = require("./entities/jwt/index");
const { startFeperfSchedules } = require("./schedule/feperf");

const app = new Koa();
const router = new Router();

mkdir.mkdirs("temp", err => {
  if (err instanceof Error) logger.error({ err }, "[app] directory creation failed");
});
mkdir.mkdirs("video", err => {
  if (err instanceof Error) logger.error({ err }, "[app] directory creation failed");
});
// Persist request logs independently of the response.
app.use(async (ctx, next) => {
  const reqPath = ctx.path;
  if (reqPath !== "/server/log/add" && reqPath !== "/feperf/ping") {
    sAddLog({ ctx, logType: "request", content: `Rain ${ctx.method} ${reqPath}` });
  }
  await next();
});
app.use(authMiddleware);

app.use(
  koaBody({
    multipart: true,
    formidable: {
      uploadDir: path.join(__dirname, "./temp/"),
      keepExtensions: true,
      maxFileSize: 200 * 1024 * 1024,
    },
  }),
);
app.context.linkMap = new Map();
app.context.logContent = [];
const JOB = schedule.scheduleJob("*/60 * * * *", () => {
  app.context.linkMap = new Map();
});

router.use("/server", server.routes(), server.allowedMethods());
router.use("/t", tiny.routes(), tiny.allowedMethods());
router.use("/feperf", feperf.routes(), feperf.allowedMethods());
app.use(router.routes()).use(router.allowedMethods());
startFeperfSchedules();

app.on("error", async (err, ctx) => {
  logger.error({ err: err }, "[app] request handling failed");
  sReportErrorInfo({ ctx, logType: "server_error", err, url: "", alias: "pigKey" });
});

app.listen(3224, () => {
  logger.info({ port: 3224 }, "[app] server listening");
});
