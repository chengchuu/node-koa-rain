const { sqlIns } = require('../../entities/orm');
const { DataTypes } = require('sequelize');
const MazeyGameTag = sqlIns.define(
  'MazeyGameTag',
  {
    game_id: {
      type: DataTypes.INTEGER,
    },
    tag_id: {
      type: DataTypes.INTEGER,
    },
  },
  {
    tableName: 'mazey_game_tag',
  }
);
MazeyGameTag.sync();
module.exports = {
  MazeyGameTag,
};
