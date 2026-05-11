const { sqlIns } = require("../../entities/orm");
const { DataTypes } = require("sequelize");
const { rsp } = require("../../entities/response");
const { err } = require("../../entities/error");

// 读书笔记
const NutReadWiki = sqlIns.define(
  "NutReadWiki",
  {
    read_wiki_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nick_name: {
      // 花名
      type: DataTypes.STRING(100),
    },
    book_name: {
      // 书名
      type: DataTypes.STRING(100),
    },
    content: {
      // 内容，前期是 WIKI 链接
      type: DataTypes.STRING(500),
    },
    read_wiki_month: {
      // 05 06 07
      type: DataTypes.STRING(20),
    },
    read_wiki_status: {
      // 状态 1 正常 0 过期
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    integral: {
      // 每日积分
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    tableName: "nut_read_wiki",
    createdAt: "create_at",
    updatedAt: false,
  },
);

NutReadWiki.sync();

// 新增
async function mAddWiki ({ nick_name, book_name, content }) {
  const ret = await NutReadWiki.create({
    nick_name,
    book_name,
    content,
    integral: 30,
  }).catch(console.error);
  if (ret && ret.dataValues) {
    return rsp({ message: "添加成功", data: ret.dataValues });
  }
  return err({ message: "添加失败" });
}

// 查询
async function mGetWikis ({ nick_name } = {}) {
  if (!nick_name) {
    return err({ message: "缺少花名" });
  }
  const query = {
    where: {
      nick_name,
      read_wiki_status: 1,
    },
    order: [ [ "create_at", "DESC" ] ],
  };
  const ret = await NutReadWiki.findAll(query).catch(console.error);
  if (ret && Array.isArray(ret)) {
    return rsp({ message: "成功", data: ret });
  }
  return err({ message: "失败" });
}

// 查询所有记录
async function mGetAllWikis () {
  const query = {
    where: {
      read_wiki_status: 1,
    },
    order: [ [ "create_at", "DESC" ] ],
  };
  const ret = await NutReadWiki.findAll(query).catch(console.error);
  if (ret && Array.isArray(ret)) {
    return rsp({ message: "成功", data: ret });
  }
  return err({ message: "失败" });
}

// // 删除记录
// async function removeAsset({ read_id }) {
//   return NutReadWiki.update({ read_status: 0 }, {
//     where: {
//       read_id
//     }
//   });
// }

// 计算积分
async function mGetWikiIntegral ({ nick_name }) {
  const integralRow = await sqlIns.query(`
    SELECT
      nick_name,
      sum(integral) AS sumIntegral
    FROM
      (
        SELECT
          nick_name,
          book_name,
          integral
        FROM
          nut_read_wiki
        WHERE
          nick_name = '${nick_name}'
        AND read_wiki_status = 1
        GROUP BY
          book_name
      ) AS A;
  `);
  console.log("integralRow", integralRow);
  const [ results ] = integralRow;
  if (results.length && results[0].sumIntegral) {
    return rsp({ message: "查询成功", data: { integral: results[0] } });
  }
  return err({ message: "查询失败" });
}

module.exports = {
  mAddWiki,
  mGetWikis,
  mGetAllWikis,
  mGetWikiIntegral,
};
