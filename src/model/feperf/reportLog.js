const { sqlIns } = require("../../entities/orm");
const { DataTypes } = require("sequelize");

const PerfReportLog = sqlIns.define(
  "PerfReportLog",
  {
    perf_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    topic: {
      type: DataTypes.STRING(12),
    },
    os: {
      type: DataTypes.STRING(12),
    },
    os_version: {
      type: DataTypes.STRING(12),
    },
    device_type: {
      type: DataTypes.STRING(12),
    },
    network: {
      type: DataTypes.STRING(12),
    },
    screen_direction: {
      type: DataTypes.STRING(12),
    },
    unload_time: {
      type: DataTypes.INTEGER,
    },
    redirect_time: {
      type: DataTypes.INTEGER,
    },
    dns_time: {
      type: DataTypes.INTEGER,
    },
    tcp_time: {
      type: DataTypes.INTEGER,
    },
    ssl_time: {
      type: DataTypes.INTEGER,
    },
    response_time: {
      type: DataTypes.INTEGER,
    },
    download_time: {
      type: DataTypes.INTEGER,
    },
    first_paint_time: {
      type: DataTypes.INTEGER,
    },
    first_contentful_paint_time: {
      type: DataTypes.INTEGER,
    },
    domready_time: {
      type: DataTypes.INTEGER,
    },
    onload_time: {
      type: DataTypes.INTEGER,
    },
    white_time: {
      type: DataTypes.INTEGER,
    },
    render_time: {
      type: DataTypes.INTEGER,
    },
    decoded_body_size: {
      type: DataTypes.INTEGER,
    },
    encoded_body_size: {
      type: DataTypes.INTEGER,
    },
    report_rate: {
      type: DataTypes.FLOAT,
    },
  },
  {
    tableName: "perf_report_log",
    createdAt: "created_at",
    updatedAt: false,
  },
);

module.exports = {
  PerfReportLog,
};
