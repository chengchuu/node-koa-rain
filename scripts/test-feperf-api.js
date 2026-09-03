"use strict";

const assert = require("assert");
const http = require("http");
const querystring = require("querystring");

const host = process.env.FEPERF_TEST_APP_HOST || "127.0.0.1";
const port = Number(process.env.FEPERF_TEST_APP_PORT || 3224);
const mode = process.argv[2] || "core";
const topic = "codex_test";

function request(method, pathname, data) {
  return new Promise((resolve, reject) => {
    const body = method === "POST" ? querystring.stringify(data || {}) : "";
    const req = http.request(
      {
        host,
        port,
        method,
        path: pathname,
        headers: body
          ? {
            "content-type": "application/x-www-form-urlencoded",
            "content-length": Buffer.byteLength(body),
          }
          : {},
      },
      res => {
        let responseBody = "";
        res.setEncoding("utf8");
        res.on("data", chunk => {
          responseBody += chunk;
        });
        res.on("end", () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: responseBody,
          });
        });
      },
    );

    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

function parseJson(response) {
  assert.strictEqual(response.statusCode, 200, response.body);
  return JSON.parse(response.body);
}

function localDay() {
  const now = new Date();
  const pad = value => String(value).padStart(2, "0");
  return [ now.getFullYear(), pad(now.getMonth() + 1), pad(now.getDate()) ].join("-");
}

async function waitForAggregate(day) {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const result = parseJson(
      await request(
        "GET",
        "/feperf/monitor/perf/day?" +
          querystring.stringify({
            topic,
            limit: 10,
          }),
      ),
    );
    const row = result.data.perfDays.find(item => String(item.report_day).slice(0, 10) === day);
    if (row && Number(row.report_count) === 1) return row;
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  throw new Error("Timed out waiting for the synthetic aggregate");
}

async function waitForCachedTopic() {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const result = parseJson(await request("GET", "/feperf/report/get-topics"));
    const cachedTopic = result.data.topicsCache.find(item => item.topic === topic);
    if (cachedTopic) return cachedTopic;
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  throw new Error("Timed out waiting for the synthetic topic cache");
}

async function testCore() {
  const day = localDay();
  let result = parseJson(await request("GET", "/feperf/ping"));
  assert.strictEqual(result.ret, 0);

  result = parseJson(await request("GET", "/feperf/monitor/get/topic"));
  assert.strictEqual(result.ret, 0);
  assert.strictEqual(result.data.topics.length, 7);

  result = parseJson(
    await request(
      "GET",
      "/feperf/monitor/perf/day?" +
        querystring.stringify({
          topic: "mazey.net",
          limit: 2,
        }),
    ),
  );
  assert.strictEqual(result.ret, 0);
  assert.strictEqual(result.data.perfDays.length, 2);

  result = parseJson(await request("GET", "/feperf/monitor/get/count"));
  assert.strictEqual(result.data.count, 0);

  const unsampled = await request("GET", "/feperf/sdk/loader?topic=mazey.net&rate=0");
  assert.strictEqual(unsampled.statusCode, 200);
  assert(/javascript/.test(unsampled.headers["content-type"]));

  result = parseJson(
    await request("POST", "/feperf/monitor/add/topic", {
      topic,
      project_name: "Codex test",
      project_description: "Disposable FEPerf migration verification",
      userName: "codex",
    }),
  );
  assert.strictEqual(result.ret, 0);

  result = parseJson(
    await request(
      "GET",
      "/feperf/report?" +
        querystring.stringify({
          topic,
          app_name: "codex",
          app_version: "1.0.0",
          os: "test",
          browser: "node",
          dns_time: 10,
          tcp_time: 20,
          response_time: 30,
          white_time: 40,
          domready_time: 50,
          onload_time: 100,
          render_time: 80,
          report_rate: 1,
        }),
    ),
  );
  assert.strictEqual(result.ret, 0);

  result = parseJson(await request("GET", "/feperf/monitor/get/count"));
  assert.strictEqual(result.data.count, 1);

  const historyResponse = await request(
    "GET",
    "/feperf/monitor/get/history?" +
      querystring.stringify({
        topic,
        startDay: day + " 00:00:00",
        endDay: day + " 23:59:59.999",
      }),
  );
  assert.strictEqual(historyResponse.statusCode, 200, historyResponse.body);
  const history = JSON.parse(historyResponse.body)[0];
  assert.strictEqual(history.length, 1);
  assert.strictEqual(Number(history[0].report_count), 1);
  assert.strictEqual(Number(history[0].onload_time_avg), 100);

  result = parseJson(
    await request("POST", "/feperf/monitor/add/topic", {
      topic,
      project_name: "Duplicate",
      userName: "codex",
    }),
  );
  assert.strictEqual(result.ret, 413);
  assert.strictEqual(result.info, "err_topic_existed");

  result = parseJson(
    await request(
      "GET",
      "/feperf/monitor/run/perf-month?" +
        querystring.stringify({
          topic,
          start: day,
          duration: 1,
        }),
    ),
  );
  assert.strictEqual(result.ret, 0);

  const aggregate = await waitForAggregate(day);
  assert.strictEqual(Number(aggregate.onload_time_avg), 100);
  assert.strictEqual(String(aggregate.report_day).slice(0, 10), day);

  console.log("FEPerf core API integration verified.");
}

async function testCache() {
  const day = localDay();
  let cachedTopic = await waitForCachedTopic();
  assert.strictEqual(Number(cachedTopic[day]), 0);

  const sampled = await request("GET", "/feperf/sdk/loader?" + querystring.stringify({ topic, rate: 1 }));
  assert.strictEqual(sampled.statusCode, 302);
  assert.strictEqual(sampled.headers.location, "https://i.mazey.net/feperf/sdk/prd/report.js");

  const result = parseJson(await request("GET", "/feperf/report/get-topics"));
  cachedTopic = result.data.topicsCache.find(item => item.topic === topic);
  assert.strictEqual(Number(cachedTopic[day]), 1);

  console.log("FEPerf schedule cache integration verified.");
}

const test = mode === "core" ? testCore : mode === "cache" ? testCache : null;
if (!test) throw new Error("Unknown test mode: " + mode);

test().catch(error => {
  console.error(error.stack || error);
  process.exitCode = 1;
});
