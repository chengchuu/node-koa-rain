const { sqlIns } = require("../../entities/orm");
const { DataTypes } = require("sequelize");

const PerfStatistics = sqlIns.define(
  "PerfStatistics",
  {
    ss_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    topic: {
      type: DataTypes.STRING(12),
    },
    dns_time_avg: {
      type: DataTypes.FLOAT,
    },
    tcp_time_avg: {
      type: DataTypes.FLOAT,
    },
    response_time_avg: {
      type: DataTypes.FLOAT,
    },
    white_time_avg: {
      type: DataTypes.FLOAT,
    },
    domready_time_avg: {
      type: DataTypes.FLOAT,
    },
    onload_time_avg: {
      type: DataTypes.FLOAT,
    },
    report_rate_avg: {
      type: DataTypes.FLOAT,
    },
    report_count: {
      type: DataTypes.INTEGER,
    },
    report_day: {
      type: DataTypes.STRING(12),
    },
    report_hour: {
      type: DataTypes.STRING(12),
    },
    ss_status: {
      type: DataTypes.INTEGER,
    },
  },
  {
    tableName: "perf_statistics",
    createdAt: "created_at",
    updatedAt: false,
  },
);

module.exports = {
  PerfStatistics,
};
