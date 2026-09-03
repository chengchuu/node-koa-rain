const { sqlIns } = require("../../entities/orm");
const { DataTypes } = require("sequelize");

const PerfTopics = sqlIns.define(
  "PerfTopics",
  {
    topic_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    topic: {
      type: DataTypes.STRING(12),
    },
    project_name: {
      type: DataTypes.STRING(12),
    },
    project_description: {
      type: DataTypes.STRING(200),
    },
    owner: {
      type: DataTypes.STRING(12),
    },
    department: {
      type: DataTypes.STRING(50),
    },
    contact: {
      type: DataTypes.STRING(50),
    },
    switch: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    user_name: {
      type: DataTypes.STRING(20),
      defaultValue: "",
    },
  },
  {
    tableName: "perf_topics",
    createdAt: "created_at",
    updatedAt: false,
  },
);

module.exports = {
  PerfTopics,
};
