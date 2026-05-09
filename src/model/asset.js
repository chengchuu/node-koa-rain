const { sqlIns } = require('../entities/orm');
const { DataTypes } = require('sequelize');
const { mGetUserNameByPassword } = require('./user');
const MazeyAsset = sqlIns.define(
  'MazeyAsset',
  {
    asset_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    asset_link: {
      type: DataTypes.STRING(200),
    },
    asset_show_link: {
      type: DataTypes.STRING(200),
    },
    asset_oss_link: {
      type: DataTypes.STRING(200),
    },
    asset_tiny_link: {
      type: DataTypes.STRING(100),
    },
    asset_target: {
      type: DataTypes.STRING(100),
    },
    asset_type: {
      type: DataTypes.STRING(100),
    },
    asset_file_name: {
      type: DataTypes.STRING(100),
    },
    asset_size: {
      type: DataTypes.INTEGER,
    },
    asset_operator_id: {
      type: DataTypes.INTEGER,
    },
    asset_oss_id: {
      type: DataTypes.INTEGER,
    },
    asset_status: {
      // 状态 1 正常 0 删除
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
  },
  {
    tableName: 'mazey_asset',
    createdAt: 'asset_create_time',
    updatedAt: false,
  }
);

MazeyAsset.sync();

// 新增上传资源
async function newAsset ({ asset_link, asset_oss_id, asset_file_name, asset_show_link, asset_oss_link, asset_target, asset_type, asset_size, asset_operator_id, user_id }) {
  return MazeyAsset.create({ asset_link, asset_oss_id: user_id || asset_oss_id, asset_file_name, asset_show_link, asset_oss_link, asset_target, asset_type, asset_size, asset_operator_id }).catch(
    console.error
  );
}

// 查询静态资源
async function getAsset ({ asset_operator_id, user_id, limit }) {
  console.log('_ asset_operator_id:', asset_operator_id, user_id);
  const query = {
    where: {
      asset_oss_id: user_id,
      asset_status: 1,
    },
    order: [['asset_create_time', 'DESC']],
  };
  if (limit) {
    Object.assign(query, { limit });
  }
  return MazeyAsset.findAll(query).catch(console.error);
}

// 删除记录
async function removeAsset ({ asset_id }) {
  return MazeyAsset.update(
    { asset_status: 0 },
    {
      where: {
        asset_id,
      },
    }
  );
}

module.exports = {
  newAsset,
  getAsset,
  removeAsset,
};
