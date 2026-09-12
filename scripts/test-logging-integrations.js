const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { spawnSync } = require("child_process");

if (process.argv[2] !== "child") {
  const result = spawnSync(process.execPath, [ __filename, "child" ], { encoding: "utf8", env: Object.assign({}, process.env, { LOG_LEVEL: "info" }) });
  assert.strictEqual(result.status, 0, result.stderr);
  assert(!result.stdout.includes("PRIVATE_MARKER"));
  assert(!result.stderr.includes("PRIVATE_MARKER"));
  const logs = result.stderr.trim().split("\n").map(line => JSON.parse(line));
  [ "[auth] request handling failed", "[upload] oss put failed", "[robot] message delivery failed", "[feperf] scheduled job failed" ].forEach(message => assert(logs.some(log => log.msg === message), message));
  console.log("Mocked authentication, upload, robot, and scheduler logging checks passed.");
} else {
  const logger = require("../src/entities/logger");
  const failure = new Error("PRIVATE_MARKER");
  failure.config = { url: "https://example.test/?key=PRIVATE_MARKER" };
  const load = function(file, stubs, globals) {
    const module = { exports: {} };
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, "..", file), "utf8"), Object.assign({
      module, exports: module.exports, process, Error,
      require(name) {
        if (/entities\/logger$/.test(name) || name === "../logger") return logger;
        if (Object.prototype.hasOwnProperty.call(stubs, name)) return stubs[name];
        throw new Error("Unexpected dependency: " + name);
      },
    }, globals), { filename: file });
    return module.exports;
  };
  const test = async function() {
    const jwt = load("src/entities/jwt/index.js", {
      jsonwebtoken: { verify: (token, secret, callback) => callback(null, { user_id: 1 }) },
      "../err": { err: value => value }, "../response": {},
    });
    let thrown = false;
    const ctx = { headers: { authorization: "PRIVATE_MARKER" }, request: { url: "/server/upload" }, state: {}, throw(status, message) { thrown = true; assert.strictEqual(status, 500); assert.strictEqual(message, "Internal server error"); } };
    await jwt.authMiddleware(ctx, () => Promise.reject(failure));
    assert(thrown);
    const upload = load("src/service/upload/alioss.js", { "ali-oss": function OSS() { this.put = () => Promise.reject(failure); } });
    assert.strictEqual(await upload.ossPut({ source: "PRIVATE_MARKER" }), false);
    const robot = load("src/service/robot/index.js", {
      "node-schedule": {}, axios: { post: () => Promise.reject(failure) }, "date-fns": {},
      "./../../config/env.development": { alias2Key: new Map([ [ "test", "PRIVATE_MARKER" ] ]) },
      "../../entities/error": { err: value => value }, "../../entities/response": { rsp: value => Object.assign({ ret: 0 }, value) },
      "./dayOffConf": { dayOffDates: [] }, mazey: {}, lodash: {},
    });
    assert.strictEqual(await robot.sCommonRobotSend({ alias: "test", immediately: true, type: "text", data: "PRIVATE_MARKER" }), undefined);
    const timers = [];
    let aggregateCalls = 0;
    let rejectAggregation;
    const scheduler = load("src/schedule/feperf.js", {
      "../service/feperf": {
        refreshTopicsCache: () => Promise.reject(failure),
        aggregateCurrentTopics: () => { aggregateCalls++; return new Promise((resolve, reject) => { rejectAggregation = reject; }); },
      },
    }, { process: { env: {} }, setInterval(fn, duration) { assert.strictEqual(duration, 30 * 60 * 1000); timers.push(fn); return { unref() {} }; } });
    scheduler.startFeperfSchedules();
    scheduler.startFeperfSchedules();
    assert.strictEqual(timers.length, 2);
    timers[1](); timers[1]();
    assert.strictEqual(aggregateCalls, 1);
    rejectAggregation(failure);
    await new Promise(resolve => setImmediate(resolve));
    timers[1]();
    assert.strictEqual(aggregateCalls, 2);
    rejectAggregation(failure);
    await new Promise(resolve => setImmediate(resolve));
  };
  test().catch(() => { process.exitCode = 1; });
}
