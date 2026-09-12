const logger = require("../entities/logger");
const { refreshTopicsCache, aggregateCurrentTopics } = require("../service/feperf");

const INTERVAL = 30 * 60 * 1000;
let started = false;
let aggregationRunning = false;

function reportScheduleError(error) {
  logger.error({ err: error }, "[feperf] scheduled job failed");
}

async function runAggregation() {
  if (aggregationRunning) {
    return;
  }
  aggregationRunning = true;
  try {
    await aggregateCurrentTopics();
    logger.info("[feperf] aggregation completed");
  } catch (error) {
    reportScheduleError(error);
  } finally {
    aggregationRunning = false;
  }
}

function startFeperfSchedules() {
  if (started || process.env.FEPERF_SCHEDULE_ENABLED === "false") {
    return;
  }
  started = true;

  refreshTopicsCache().then(() => {
    logger.info("[feperf] topic cache refreshed");
  }).catch(reportScheduleError);

  const topicsTimer = setInterval(() => {
    refreshTopicsCache().then(() => {
      logger.info("[feperf] topic cache refreshed");
    }).catch(reportScheduleError);
  }, INTERVAL);
  const aggregationTimer = setInterval(() => {
    runAggregation();
  }, INTERVAL);

  topicsTimer.unref();
  aggregationTimer.unref();
}

module.exports = {
  startFeperfSchedules,
};
