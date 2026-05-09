const { sqlIns } = require('../../entities/orm');
const { DataTypes } = require('sequelize');
const MazeySisDic = sqlIns.define(
  'MazeySisDic',
  {
    dic_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    dic_code: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    dic_name: {
      type: DataTypes.STRING(200),
    },
    game_type: {
      type: DataTypes.STRING(200),
    },
    dic_type: {
      type: DataTypes.STRING(200),
    },
    parent_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'mazey_sis_dic',
        key: 'dic_id',
      },
    },
    status: {
      type: DataTypes.INTEGER(200),
    },
    remark: {
      type: DataTypes.INTEGER(200),
    },
    user_id: {
      type: DataTypes.INTEGER,
    },
    user_name: {
      type: DataTypes.STRING(20),
    },
  },
  {
    tableName: 'mazey_sis_dic',
    createdAt: 'create_at',
    updatedAt: 'update_at',
  }
);
MazeySisDic.sync();
module.exports = {
  MazeySisDic,
};
