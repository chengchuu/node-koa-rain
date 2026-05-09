const { sqlIns } = require('../../entities/orm');
const { DataTypes } = require('sequelize');
const { rsp, rspPage } = require('../../entities/response');
const { err } = require('../../entities/error');
const { MazeyTag } = require('./tag');
const { MazeyGameTag } = require('./gameTag');
const { MazeySisDic } = require('./sisDic');
const MazeyGame = sqlIns.define(
  'MazeyGame',
  {
    game_id: {
      // 自增 ID
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    game_picture: {
      type: DataTypes.STRING(200),
    },
    game_star: {
      type: DataTypes.FLOAT,
    },
    game_type: {
      // 游戏的类型
      type: DataTypes.STRING(50),
    },
    game_name: {
      type: DataTypes.STRING(50),
    },
    game_english_name: {
      type: DataTypes.STRING(50),
    },
    game_content: {
      // 游戏内容
      type: DataTypes.STRING(500),
    },
    game_score: {
      type: DataTypes.FLOAT,
    },
    game_score_personnel: {
      type: DataTypes.INTEGER,
    },
    // 发行商
    game_publisher: {
      type: DataTypes.STRING(50),
    },
    // 发版时间
    game_release_time: {
      type: DataTypes.STRING(50),
    },
    // 操作人
    user_id: {
      type: DataTypes.INTEGER,
    },
    user_name: {
      type: DataTypes.STRING(20),
    },
  },
  {
    tableName: 'mazey_game',
    createdAt: 'create_at',
    updatedAt: 'update_at',
  }
);
// 增加一个游戏
async function addNewGame ({ game_picture, game_type, game_name, game_english_name, game_content, game_publisher = '', game_release_time = '', user_id, user_name }) {
  const amount = await MazeyGame.count({
    where: {
      game_name,
    },
  });
  if (amount === 0) {
    const ret = await MazeyGame.create({
      game_picture,
      game_type,
      game_name,
      game_english_name,
      game_content,
      game_publisher,
      game_release_time,
      user_id,
      user_name,
    }).catch(console.error);
    if (ret && ret.dataValues) {
      return rsp({ data: ret.dataValues });
    }
    return err();
  }
  return rsp({ message: `${game_name}游戏已存在` });
}
// 导入游戏
// 获取游戏信息并且更新
async function queryUpdateGame ({ game_id }) {
  const ret = await MazeyGame.findOne({
    where: {
      game_id,
    },
    include: [
      {
        model: MazeyTag,
        attributes: ['tag_id', 'tag_name'],
      },
      {
        model: MazeySisDic,
        attributes: ['dic_name'],
      },
    ],
    through: { attributes: [] },
  }).catch(console.error);
  if (!ret) {
    return err({ message: '该游戏不存在' });
  }
  return rsp({ data: ret.dataValues });
}
async function mUpdateGame ({ data }, score) {
  const scoreData = score.data;
  let game_score_personnel = data.game_score_personnel + 1;
  let game_score = (data.game_score * data.game_score_personnel + scoreData.score) / game_score_personnel;
  console.log('game_score', game_score);
  game_score = game_score.toFixed(2);
  let game_star = 5;
  let game_id = data.game_id;
  const ret = await MazeyGame.update(
    {
      game_score,
      game_star,
      game_score_personnel,
    },
    {
      where: {
        game_id,
      },
    }
  ).catch(console.error);
  if (!ret) {
    return err({ message: '该游戏不存在' });
  }
  return rsp({ data: ret.dataValues });
}
// 查询所有游戏进行分页
async function queryAllGame ({ currentPage, pageSize }) {
  const pageIndex = currentPage || 0;
  const pageNo = pageSize || 10;
  const offset = pageIndex * pageNo;
  const total = await MazeyGame.count();
  const ret = await MazeyGame.findAll({
    limit: pageSize,
    offset: offset,
    order: [['create_at', 'DESC']],
    include: [
      {
        model: MazeyTag,
      },
      {
        model: MazeySisDic,
        attributes: ['dic_name'],
      },
    ],
  }).catch(console.error);
  console.log('ret', ret);
  return rspPage({ data: ret, currentPage, total });
}
// 给游戏增加标签
async function mAddNewGameTags ({ game_id, data }) {
  const ret = await MazeyGame.findOne({
    where: {
      game_id,
    },
  }).catch(console.error);
  if (!ret) {
    return err({ message: '该游戏不存在' });
  }
  let tagIds = data.map(item => item[0].tag_id);
  console.log('tagIds', tagIds);
  ret.addMazeyTags(tagIds, { through: { unique: true } });
}
MazeyGame.belongsToMany(MazeyTag, { through: MazeyGameTag, foreignKey: 'game_id', otherKey: 'tag_id' });
MazeyTag.belongsToMany(MazeyGame, { through: MazeyGameTag, foreignKey: 'tag_id', otherKey: 'game_id' });
MazeyGame.belongsTo(MazeySisDic, { foreignKey: 'game_type' });
MazeyGame.sync();
module.exports = {
  addNewGame,
  queryUpdateGame,
  queryAllGame,
  mUpdateGame,
  mAddNewGameTags,
};
