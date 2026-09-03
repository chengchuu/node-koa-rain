const assert = require("assert");
const fs = require("fs");
const path = require("path");

const expectedRoutes = [
  "GET /ping",
  "GET /report",
  "GET /report/get-topics",
  "GET /sdk/loader",
  "GET /monitor/perf/day",
  "GET /monitor/run/perf-month",
  "POST /monitor/add/topic",
  "GET /monitor/get/topic",
  "GET /monitor/get/count",
  "GET /monitor/get/history",
];

const originalLog = console.log;
console.log = () => {};
const router = require("../src/router/feperf");
console.log = originalLog;

const actualRoutes = router.stack
  .filter(layer => layer.path)
  .reduce((routes, layer) => {
    layer.methods.filter(method => method !== "HEAD").forEach(method => routes.push(method + " " + layer.path));
    return routes;
  }, []);

assert.deepStrictEqual(actualRoutes.sort(), expectedRoutes.sort());

const { rsp, err } = require("../src/entities/feperf/response");
assert.deepStrictEqual(rsp(), {
  ret: 0,
  info: "ok",
  message: undefined,
  data: undefined,
});
assert.deepStrictEqual(err(), {
  ret: 413,
  info: "err_server_error",
  message: "",
});

const { runPerfRange } = require("../src/service/feperf");
[ undefined, -1, 1.5, "invalid" ].forEach(duration => {
  assert.throws(() => runPerfRange({ start: "2026-09-01", duration, topic: "test" }), RangeError);
});

const modelChecks = [ [ "reportLog.js", "perf_report_log" ], [ "statistics.js", "perf_statistics" ], [ "topics.js", "perf_topics" ] ];

modelChecks.forEach(([ file, tableName ]) => {
  const source = fs.readFileSync(path.join(__dirname, "../src/model/feperf", file), "utf8");
  assert(source.indexOf("tableName: \"" + tableName + "\"") !== -1);
  assert(source.indexOf(".sync(") === -1);
});

console.log("FEPerf compatibility contract verified.");
