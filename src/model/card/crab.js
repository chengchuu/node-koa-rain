// 卡号 密码 状态(0, 1)
const { sqlIns } = require('../../entities/orm');
const { DataTypes } = require('sequelize');
const { rsp } = require('../../entities/response');
const { err } = require('../../entities/error');
const MazeyCrab = sqlIns.define(
  'MazeyCrab',
  {
    crab_id: {
      // 自增 ID
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    crab_amount: {
      type: DataTypes.INTEGER,
    },
    // 规格
    crab_specification: {
      type: DataTypes.STRING(100),
    },
    crab_weight: {
      type: DataTypes.INTEGER,
    },
    // 具体的描述
    crab_content: {
      type: DataTypes.STRING(500),
    },
  },
  {
    tableName: 'mazey_crab',
    createdAt: 'create_at',
    updatedAt: 'update_at',
  }
);
async function mBatchAddCrab (data) {
  const ret = await MazeyCrab.bulkCreate(data);
  if (!ret) {
    return err({ message: '失败' });
  }
  return rsp({ data: ret });
}
MazeyCrab.sync();
module.exports = {
  MazeyCrab,
  mBatchAddCrab,
};
