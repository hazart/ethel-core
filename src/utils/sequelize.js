const configManager = require('./configManager');
const Sequelize = require('sequelize');
const logger = require('./logger');

let instance;

class SequelizeManager {
  constructor() {
    if (instance === undefined) {
      this.sequelize = this.connect();
      instance = this;
    }
    return instance;
  }

  connect() {
    return new Sequelize(
      configManager.config.database.dbName,
      configManager.config.database.dbUser,
      configManager.config.database.dbPassword,
      {
        host: configManager.config.database.host,
        port: configManager.config.database.port,
        dialect: 'mysql',

        pool: {
          max: 5,
          min: 0,
          idle: 10000,
        },
      },
    );
  }

  testConnect() {
    this.sequelize.authenticate().then((errors) => { logger.log(errors); });
  }
}

module.exports = new SequelizeManager();
