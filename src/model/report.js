const { sqlIns } = require("../entities/orm");
const { DataTypes } = require("sequelize");

const MazeyReport = sqlIns.define(
  "MazeyReport",
  {
    report_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    topic: {
      type: DataTypes.STRING(20),
    },
    os: {
      type: DataTypes.STRING(10),
    },
    os_version: {
      type: DataTypes.STRING(10),
    },
    device_type: {
      type: DataTypes.STRING(10),
    },
    network: {
      type: DataTypes.STRING(10),
    },
    screen_direction: {
      type: DataTypes.STRING(10),
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
  },
  {
    tableName: "mazey_report",
    createdAt: "report_create_time",
    updatedAt: false,
  },
);

MazeyReport.sync();

// 新增上传资源
async function report ({
  topic,
  os,
  os_version,
  device_type,
  network,
  screen_direction,
  unload_time,
  redirect_time,
  dns_time,
  tcp_time,
  ssl_time,
  response_time,
  download_time,
  first_paint_time,
  first_contentful_paint_time,
  domready_time,
  onload_time,
  white_time,
  render_time,
  decoded_body_size,
  encoded_body_size,
}) {
  return MazeyReport.create({
    topic,
    os,
    os_version,
    device_type,
    network,
    screen_direction,
    unload_time,
    redirect_time,
    dns_time,
    tcp_time,
    ssl_time,
    response_time,
    download_time,
    first_paint_time,
    first_contentful_paint_time,
    domready_time,
    onload_time,
    white_time,
    render_time,
    decoded_body_size,
    encoded_body_size,
  })
    .then(() => "success")
    .catch(console.error);
}

module.exports = {
  report,
};
