const { format, addDays } = require("date-fns");
const { sqlIns } = require("../../entities/orm");
const { PerfReportLog } = require("../../model/feperf/reportLog");
const { PerfStatistics } = require("../../model/feperf/statistics");
const { PerfTopics } = require("../../model/feperf/topics");
const { rsp, err } = require("../../entities/feperf/response");
const state = require("./state");

async function addTopic({ topic, project_name, project_description, owner, department, contact, userName = "" } = {}) {
  const exist = await PerfTopics.findOne({
    where: {
      topic,
    },
  });

  if (exist) {
    return err({
      info: "err_topic_existed",
    });
  }

  const rRes = await PerfTopics.create({
    topic,
    project_name,
    project_description,
    owner,
    department,
    contact,
    user_name: userName,
  });

  return rsp({ data: { rRes } });
}

async function getTopics({ userName = "" } = {}) {
  const where = {
    switch: 1,
  };
  if (userName) {
    Object.assign(where, { user_name: userName });
  }
  return PerfTopics.findAll({
    attributes: [ "topic_id", "topic", "project_name" ],
    where,
    order: [ [ "topic_id" ] ],
  });
}

async function savePerfStatistics({
  topic,
  dns_time_avg,
  tcp_time_avg,
  response_time_avg,
  white_time_avg,
  domready_time_avg,
  onload_time_avg,
  report_rate_avg,
  report_count,
  report_day,
  report_hour,
  ss_status,
}) {
  await PerfStatistics.update(
    {
      ss_status: 0,
    },
    {
      where: {
        topic,
        report_day,
      },
    },
  );

  return PerfStatistics.create({
    topic,
    dns_time_avg,
    tcp_time_avg,
    response_time_avg,
    white_time_avg,
    domready_time_avg,
    onload_time_avg,
    report_rate_avg,
    report_count,
    report_day,
    report_hour,
    ss_status,
  });
}

async function queryPerfStatistics({ topic, limit }) {
  return PerfStatistics.findAll({
    where: {
      topic,
      ss_status: 1,
    },
    limit: Number(limit),
    order: [ [ "created_at", "DESC" ] ],
  });
}

async function getPerf({ topic = 0, startDay, endDay }) {
  const query = [
    "SELECT",
    "  round( AVG( dns_time ), 2 ) AS dns_time_avg,",
    "  round( AVG( tcp_time ), 2 ) AS tcp_time_avg,",
    "  round( AVG( response_time ), 2 ) AS response_time_avg,",
    "  round( AVG( white_time ), 2 ) AS white_time_avg,",
    "  round( AVG( domready_time ), 2 ) AS domready_time_avg,",
    "  round( AVG( onload_time ), 2 ) AS onload_time_avg,",
    "  round( AVG( render_time ), 2 ) AS render_time_avg,",
    "  round( AVG( report_rate ), 2 ) AS report_rate_avg,",
    "  COUNT( 1 ) AS report_count",
    "FROM perf_report_log",
    "WHERE topic = :topic",
    "  AND dns_time IS NOT NULL",
    "  AND tcp_time IS NOT NULL",
    "  AND response_time IS NOT NULL",
    "  AND white_time IS NOT NULL",
    "  AND domready_time IS NOT NULL",
    "  AND onload_time IS NOT NULL",
    "  AND onload_time > 0",
    "  AND onload_time < 30000",
    "  AND render_time IS NOT NULL",
    "  AND created_at >= :startDay",
    "  AND created_at < :endDay",
  ].join("\n");

  return sqlIns.query(query, {
    replacements: {
      topic,
      startDay,
      endDay,
    },
  });
}

async function getCount() {
  return PerfReportLog.count();
}

async function aggregatePerf({ topic, dreamDay }) {
  const date = new Date(dreamDay);
  const reportDay = format(date, "yyyy-MM-dd");
  const reportHour = format(date, "HH");
  const startDay = format(date, "yyyy-MM-dd 00:00:00");
  const endDay = format(addDays(new Date(startDay), 1), "yyyy-MM-dd 00:00:00");
  const [ results ] = await getPerf({ topic, startDay, endDay });

  if (results.length && results[0].report_count) {
    return savePerfStatistics(
      Object.assign(results[0], {
        report_day: reportDay,
        report_hour: reportHour,
        topic,
        ss_status: 1,
      }),
    );
  }
  return true;
}

function runPerfRange({ start, duration, topic }) {
  return new Array(Number(duration)).fill(0).reduce(async (last, _, index) => {
    await last;
    const dreamDay = format(addDays(new Date(start), index), "yyyy-MM-dd 00:00:00");
    return aggregatePerf({ topic, dreamDay });
  }, Promise.resolve());
}

async function refreshTopicsCache() {
  const today = format(new Date(), "yyyy-MM-dd");
  const topicsData = await getTopics();
  const cacheTopics = state.topicsCache;

  state.topicsCache = topicsData.map(({ topic }) => {
    const existing = cacheTopics.find(item => item.topic === topic) || {
      topic,
      [today]: 0,
    };
    if (!existing[today]) {
      existing[today] = 0;
    }
    return existing;
  });

  return state.topicsCache;
}

async function aggregateCurrentTopics() {
  const topics = (await getTopics()).map(item => item.topic);
  for (const topic of topics) {
    await aggregatePerf({ topic, dreamDay: new Date() });
  }
}

module.exports = {
  PerfReportLog,
  addTopic,
  getTopics,
  queryPerfStatistics,
  getPerf,
  getCount,
  aggregatePerf,
  runPerfRange,
  refreshTopicsCache,
  aggregateCurrentTopics,
};
