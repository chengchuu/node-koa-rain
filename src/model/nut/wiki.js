const logger = require("../../entities/logger");
const { sqlIns } = require("../../entities/orm");
const { DataTypes } = require("sequelize");
const { rsp } = require("../../entities/response");
const { err } = require("../../entities/error");

// Reading notes
const NutReadWiki = sqlIns.define(
  "NutReadWiki",
  {
    read_wiki_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nick_name: {
      // Nickname
      type: DataTypes.STRING(100),
    },
    book_name: {
      // Book title
      type: DataTypes.STRING(100),
    },
    content: {
      // Note content; originally a wiki URL
      type: DataTypes.STRING(500),
    },
    read_wiki_month: {

      type: DataTypes.STRING(20),
    },
    read_wiki_status: {
      // Status: 1 active, 0 expired
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    integral: {
      // Daily points
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

async function mAddWiki ({ nick_name, book_name, content }) {
  const ret = await NutReadWiki.create({
    nick_name,
    book_name,
    content,
    integral: 30,
  }).catch(error => {
    logger.error({ err: error }, "[reading] note creation failed");
  });
  if (ret && ret.dataValues) {
    return rsp({ message: "添加成功", data: ret.dataValues });
  }
  return err({ message: "添加失败" });
}

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
  const ret = await NutReadWiki.findAll(query).catch(error => {
    logger.error({ err: error }, "[reading] note lookup failed");
  });
  if (ret && Array.isArray(ret)) {
    return rsp({ message: "成功", data: ret });
  }
  return err({ message: "失败" });
}

async function mGetAllWikis () {
  const query = {
    where: {
      read_wiki_status: 1,
    },
    order: [ [ "create_at", "DESC" ] ],
  };
  const ret = await NutReadWiki.findAll(query).catch(error => {
    logger.error({ err: error }, "[reading] note listing failed");
  });
  if (ret && Array.isArray(ret)) {
    return rsp({ message: "成功", data: ret });
  }
  return err({ message: "失败" });
}

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
