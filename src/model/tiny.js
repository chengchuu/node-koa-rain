const logger = require("../entities/logger");
const { sqlIns } = require("../entities/orm");
const { DataTypes } = require("sequelize");

const MazeyTiny = sqlIns.define(
  "MazeyTiny",
  {
    tiny_id: {
      // Auto-increment ID
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    ori_link: {
      // Original URL
      type: DataTypes.STRING(350),
    },
    ori_md5: {
      // MD5 hash of the original URL
      type: DataTypes.STRING(40),
    },
    tiny_link: {
      // Short URL
      type: DataTypes.STRING(30),
    },
    tiny_key: {
      // Short-link key
      type: DataTypes.STRING(20),
    },
    tiny_count: {
      type: DataTypes.INTEGER,
    },
  },
  {
    tableName: "mazey_tiny",
    createdAt: "create_at",
    updatedAt: false,
  },
);

MazeyTiny.sync();

async function queryOriLink ({ ori_md5 }) {
  let queryOriLinkRes = MazeyTiny.findOne({
    where: {
      ori_md5,
    },
  }).catch(error => {
    logger.error({ err: error }, "[tiny] original link lookup failed");
  });
  return queryOriLinkRes;
}

// Return the saved row ID for short-link generation.
async function saveOriLink ({ ori_link, ori_md5 }) {
  return MazeyTiny.create({ ori_link, ori_md5 }).catch(error => {
    logger.error({ err: error }, "[tiny] original link save failed");
  });
}

async function saveTinyLink ({ tiny_id, tiny_link, tiny_key }) {
  return MazeyTiny.update(
    {
      tiny_link,
      tiny_key,
    },
    {
      where: {
        tiny_id,
      },
    },
  ).catch(error => {
    logger.error({ err: error }, "[tiny] short link save failed");
  });
}

async function queryTinyLink ({ tiny_key }) {
  return MazeyTiny.findOne({
    attributes: [ "ori_link" ],
    where: {
      tiny_key,
    },
  }).catch(error => {
    logger.error({ err: error }, "[tiny] short link lookup failed");
  });
}

async function mUpdateTinyLink ({ tiny_key }) {
  return MazeyTiny.increment("tiny_count", {
    where: {
      tiny_key,
    },
  }).catch(error => {
    logger.error({ err: error }, "[tiny] visit count update failed");
  });
}

module.exports = {
  queryOriLink,
  saveOriLink,
  saveTinyLink,
  queryTinyLink,
  mUpdateTinyLink,
};
