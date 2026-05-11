const { sqlIns } = require("../entities/orm");
const { DataTypes } = require("sequelize");
const { acquireNewUser } = require("./user");

// 访客表
const ddTableInfo = {
  tableName: "mazey_visitor",
  createdAt: "visitor_time",
  updatedAt: false,
};
const MazeyVisitor = sqlIns.define(
  "MazeyVisitor",
  {
    visitor_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    visitor_ip: {
      type: DataTypes.STRING(20),
    },
    visitor_continent: {
      type: DataTypes.STRING(20),
    },
    visitor_country: {
      type: DataTypes.STRING(20),
    },
    visitor_province: {
      type: DataTypes.STRING(20),
    },
    visitor_city: {
      type: DataTypes.STRING(20),
    },
    visitor_county: {
      type: DataTypes.STRING(20),
    },
    visitor_operator: {
      type: DataTypes.STRING(20),
    },
    visitor_citycode: {
      type: DataTypes.STRING(10),
    },
    visitor_postcode: {
      type: DataTypes.STRING(10),
    },
    visitor_areacode: {
      type: DataTypes.STRING(10),
    },
    visitor_referer: {
      type: DataTypes.STRING(50),
    },
    visitor_href: {
      type: DataTypes.STRING(50),
    },
    visitor_get: {
      type: DataTypes.STRING(10),
    },
    visitor_title: {
      type: DataTypes.STRING(50),
    },
    visitor_day_weather: {
      type: DataTypes.STRING(10),
    },
    visitor_temperature_high: {
      type: DataTypes.STRING(10),
    },
    visitor_temperature_low: {
      type: DataTypes.STRING(10),
    },
    visitor_fingerprint: {
      type: DataTypes.STRING(50),
    },
  },
  ddTableInfo,
);

MazeyVisitor.sync();

// ip
async function saveIPInfo ({
  $visitorIP,
  $continent,
  $country,
  $province,
  $city,
  $county,
  $operator,
  $citycode,
  $referrerMz,
  $hrefMz,
  $get,
  $titleMz,
  visitor_day_weather,
  visitor_temperature_high,
  visitor_temperature_low,
  visitor_fingerprint,
}) {
  // 自增新用户
  if (visitor_fingerprint) {
    acquireNewUser({
      user_signup_ip: $visitorIP,
      user_signup_city: $city,
      user_fingerprint: visitor_fingerprint,
    });
  }
  const createData = {
    visitor_ip: $visitorIP,
    visitor_continent: $continent,
    visitor_country: $country,
    visitor_province: $province,
    visitor_city: $city,
    visitor_county: $county,
    visitor_operator: $operator,
    visitor_citycode: $citycode,
    visitor_referer: $referrerMz,
    visitor_href: $hrefMz,
    visitor_get: $get,
    visitor_title: $titleMz,
    visitor_day_weather,
    visitor_temperature_high,
    visitor_temperature_low,
    visitor_fingerprint,
  };
  return MazeyVisitor.create(createData)
    .then(r => {
      // pass
      console.log("_ r:", r);
    })
    .catch(e => {
      if (e.message.includes("doesn't exist")) {
        MazeyVisitor.sync()
          .then(() => MazeyVisitor.create(createData))
          .catch(console.error);
      }
    });
}

// 最近访客
async function queryVisitors () {
  return MazeyVisitor.findAll({
    order: [ [ "visitor_id", "DESC" ] ],
    limit: 10,
  });
}

module.exports = {
  saveIPInfo,
  queryVisitors,
};
