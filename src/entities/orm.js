// orm

const { mysqlConf } = require("../config/index");
const { Sequelize } = require("sequelize");

const sqlIns = new Sequelize(mysqlConf.$mysql_database, mysqlConf.$mysql_username, mysqlConf.$mysql_password, {
  host: mysqlConf.$mysql_server_name,
  dialect: "mysql" /* 选择 'mysql' | 'mariadb' | 'postgres' | 'mssql' 其一 */,
  timezone: "+08:00",
  dialectOptions: {
    charset: "utf8",
  },
});

module.exports = {
  sqlIns,
};
