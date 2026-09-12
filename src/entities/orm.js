const { mysqlConf } = require("../config/index");
const { Sequelize } = require("sequelize");

const sqlIns = new Sequelize(mysqlConf.$mysql_database, mysqlConf.$mysql_username, mysqlConf.$mysql_password, {
  host: mysqlConf.$mysql_server_name,
  dialect: "mysql" ,
  timezone: "+08:00",
  logging: false,
  dialectOptions: {
    charset: "utf8",
  },
});

module.exports = {
  sqlIns,
};
