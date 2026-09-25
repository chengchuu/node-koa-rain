const { refreshTopicsCache, aggregateCurrentTopics } = require("../service/feperf");

const INTERVAL = 30 * 60 * 1000;
let started = false;
let aggregationRunning = false;

function reportScheduleError(error) {
  console.error("FEPerf schedule error:", error);
}

async function runAggregation() {
  if (aggregationRunning) {
    return;
  }
  aggregationRunning = true;
  try {
    await aggregateCurrentTopics();
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

  refreshTopicsCache().catch(reportScheduleError);

  const topicsTimer = setInterval(() => {
    refreshTopicsCache().catch(reportScheduleError);
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
