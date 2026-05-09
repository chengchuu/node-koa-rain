const { sqlIns } = require('../../entities/orm');
const { DataTypes } = require('sequelize');
const { rsp } = require('../../entities/response');
const { err } = require('../../entities/error');
const MazeyTag = sqlIns.define(
  'MazeyTag',
  {
    tag_id: {
      // 自增 ID
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    tag_name: {
      type: DataTypes.STRING(200),
      unique: true,
    },
    // 1 通过 2驳回 3待定
    tag_status: {
      type: DataTypes.INTEGER,
    },
    tag_description: {
      type: DataTypes.STRING(200),
    },
    user_id: {
      type: DataTypes.INTEGER,
    },
    user_name: {
      type: DataTypes.STRING(20),
    },
  },
  {
    tableName: 'mazey_tag',
    createdAt: 'create_at',
    updatedAt: 'update_at',
    indexes: [{ fields: ['tag_name'] }],
  }
);
// 增加标签
async function mAddNewTags ({ user_id, user_name, tag_name, tag_status }) {
  // 创建前先看标签是否存在
  console.log('tag_name', tag_name);
  const tags = await Promise.all(
    tag_name.map(name => {
      return MazeyTag.findOrCreate({
        where: { tag_name: name },
        defaults: {
          tag_status: tag_status,
          user_name: user_name || '系统',
          user_id: user_id || 1,
        },
      });
    })
  );
  // const ret = await MazeyTag.bulkCreate(param, {
  //   updateOnDuplicate: ['tag_name'],
  // });
  console.log('tag_status', tag_status);
  if (tag_status === 1 || tag_status === '1') {
    return rsp({ data: tags });
  } else {
    return rsp({ data: [] });
  }
}
// 查询已有标签
async function mQueryOldTags ({ tag_name }) {
  let tags = await MazeyTag.findAll({
    where: {
      tag_name: tag_name,
    },
  });
  return rsp({ data: tags });
}
MazeyTag.sync();
module.exports = {
  MazeyTag,
  mAddNewTags,
  mQueryOldTags,
};
