const Router = require("koa-router");
const { format } = require("date-fns");
const { inRate } = require("mazey");
const { rsp, err } = require("../entities/feperf/response");
const state = require("../service/feperf/state");
const { PerfReportLog, addTopic, getTopics, queryPerfStatistics, getPerf, getCount, runPerfRange } = require("../service/feperf");

const feperf = new Router();

async function errorHandler(ctx, next) {
  try {
    await next();
  } catch (error) {
    ctx.app.emit("error", error, ctx);
    const status = error.status || 500;
    let info = "";
    let message = status === 500 && process.env.NODE_ENV === "production" ? "Internal Server Error" : error.message;

    if (status === 422 && Array.isArray(error.errors) && error.errors.length) {
      const validationError = error.errors[0];
      info = validationError.message || "";
      message = message + ": " + info;
      info = (validationError.field || "") + "_" + info.replace(/\s/g, "_");
    }

    ctx.status = status === 500 ? 500 : 200;
    ctx.body = {
      ret: status,
      info,
      message,
      ...ctx.body,
    };
  }
}

feperf
  .get("/ping", errorHandler, ctx => {
    ctx.body = rsp({ message: "success" });
  })
  .get("/report", errorHandler, async ctx => {
    const saveResult = await PerfReportLog.create(ctx.query);
    ctx.body = saveResult ? rsp() : err();
  })
  .get("/report/get-topics", errorHandler, ctx => {
    ctx.body = rsp({
      data: {
        topicsCache: state.topicsCache,
      },
    });
  })
  .get("/sdk/loader", errorHandler, ctx => {
    let { topic, rate } = ctx.query;
    rate = Number(rate);
    const rateResult = inRate(rate);
    const data = {
      topic,
      rate,
      rateResult,
    };

    if (rateResult) {
      const today = format(new Date(), "yyyy-MM-dd");
      const cachedTopic = state.topicsCache.find(item => item.topic === topic);
      if (cachedTopic) {
        cachedTopic[today] = (cachedTopic[today] || 0) + 1;
      }
      ctx.redirect("https://i.mazey.net/feperf/sdk/prd/report.js");
      return;
    }

    ctx.type = "application/javascript";
    ctx.body = "console.log(" + JSON.stringify(data) + ");";
  })
  .get("/monitor/perf/day", async ctx => {
    const { limit, topic } = ctx.query;
    ctx.body = rsp({
      data: {
        perfDays: await queryPerfStatistics({ topic, limit }),
      },
    });
  })
  .get("/monitor/run/perf-month", ctx => {
    const { start, duration, topic } = ctx.query;
    runPerfRange({ start, duration, topic }).catch(error => ctx.app.emit("error", error, ctx));
    ctx.body = rsp();
  })
  .post("/monitor/add/topic", async ctx => {
    ctx.body = await addTopic(ctx.request.body);
  })
  .get("/monitor/get/topic", async ctx => {
    const { userName } = ctx.query;
    const topics = await getTopics({ userName });
    ctx.body = rsp({ data: { topics } });
  })
  .get("/monitor/get/count", async ctx => {
    const count = await getCount();
    ctx.body = rsp({ data: { count } });
  })
  .get("/monitor/get/history", async ctx => {
    ctx.body = await getPerf(ctx.query);
  });

module.exports = feperf;
