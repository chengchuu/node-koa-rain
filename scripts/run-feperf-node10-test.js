"use strict";

process.env.NODE_ENV = "production";
process.env.FEPERF_SCHEDULE_ENABLED = process.env.FEPERF_SCHEDULE_ENABLED || "false";

const envConfig = require("../src/config/env.production");

envConfig.mysqlConf.$mysql_server_name = process.env.FEPERF_TEST_MYSQL_HOST || "127.0.0.1";

if (process.env.FEPERF_TEST_SILENT_LOGS !== "false") {
  console.log = () => {};
}

require("../src/app");
