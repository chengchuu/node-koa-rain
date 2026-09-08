const { sqlIns } = require("../../entities/orm");
const { DataTypes } = require("sequelize");
const { rsp } = require("../../entities/response");
const { err } = require("../../entities/error");
const MazeyCrab = sqlIns.define(
  "MazeyCrab",
  {
    crab_id: {
      // Auto-increment ID
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    crab_amount: {
      type: DataTypes.INTEGER,
    },
    // Specification
    crab_specification: {
      type: DataTypes.STRING(100),
    },
    crab_weight: {
      type: DataTypes.INTEGER,
    },
    // Description
    crab_content: {
      type: DataTypes.STRING(500),
    },
  },
  {
    tableName: "mazey_crab",
    createdAt: "create_at",
    updatedAt: "update_at",
  },
);
async function mBatchAddCrab (data) {
  const ret = await MazeyCrab.bulkCreate(data);
  if (!ret) {
    return err({ message: "失败" });
  }
  return rsp({ data: ret });
}
module.exports = {
  MazeyCrab,
  mBatchAddCrab,
};
