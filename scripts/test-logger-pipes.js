const assert = require("assert");
const path = require("path");
const { spawn } = require("child_process");

const loggerPath = path.resolve(__dirname, "../src/entities/logger");

function run(stream, close) {
  const method = stream === "stdout" ? "info" : "error";
  const otherMethod = stream === "stdout" ? "error" : "info";
  const source = "const logger = require(" + JSON.stringify(loggerPath) + ");" +
    "for (let index = 0; index < 10000; index++) logger." + method + "({index}, '[test] record');" +
    "logger." + otherMethod + "('[test] continued');";
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [ "-e", source ], {
      env: Object.assign({}, process.env, { LOG_LEVEL: "info" }),
      stdio: [ "ignore", "pipe", "pipe" ],
    });
    const output = { stdout: [], stderr: [] };
    const otherStream = stream === "stdout" ? "stderr" : "stdout";
    child[otherStream].on("data", chunk => output[otherStream].push(chunk));
    let resume;
    if (close) {
      child[stream].destroy();
    } else {
      // Leave the collector paused long enough to exhaust the pipe buffer.
      resume = setTimeout(() => {
        child[stream].on("data", chunk => output[stream].push(chunk));
      }, 500);
    }
    const timeout = setTimeout(() => child.kill("SIGKILL"), 10000);
    child.on("error", reject);
    child.on("close", (code, signal) => {
      clearTimeout(timeout);
      clearTimeout(resume);
      resolve({ code, signal, output });
    });
  });
}

async function main() {
  for (const stream of [ "stdout", "stderr" ]) {
    for (const close of [ true, false ]) {
      const result = await run(stream, close);
      assert.strictEqual(result.code, 0, stream + ": " + result.signal);
      const otherStream = stream === "stdout" ? "stderr" : "stdout";
      const continued = JSON.parse(Buffer.concat(result.output[otherStream]).toString("utf8").trim());
      assert.strictEqual(continued.msg, "[test] continued");
      if (!close) {
        const records = Buffer.concat(result.output[stream]).toString("utf8").trim().split("\n").map(line => JSON.parse(line));
        assert.strictEqual(records.length, 10000);
        records.forEach((record, index) => assert.strictEqual(record.index, index));
      }
    }
  }
  console.log("Closed and paused stdout/stderr collector checks passed.");
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
