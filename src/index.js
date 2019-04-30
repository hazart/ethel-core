/* eslint no-console: 0, global-require: 0 */
const express = require('express');
const path = require('path');

const context = require('./dialogFlow/apiRequests/context');
const utils = require('./utils');

const actionMapper = utils.actionMapper;
const configManager = utils.configManager;

const logger = utils.logger;

let instance;

class EthelCore {
  constructor() {
    if (instance === undefined) {
      this.actionMapper = actionMapper;
      this.models = null;
      this.server = express();
      instance = this;
    }

    return instance;
  }

  getUtils() {
    return utils;
  }

  getContext() {
    return context;
  }

  getModels() {
    if (!this.models) {
      const syncModels = require('./models/sync');
      this.models = require('./models');

    }
    return this.models;
  }

  getActions() {
    const actions = require('./actions');
    return actions;
  }

  setConfig(ethelCoreConfig) {
    configManager.setConfig(ethelCoreConfig);
  }

  start(port) {
    return new Promise((resolve, reject) => {

      // remove this so use bodyParser on routes
      // this.server.use(bodyParser.text({ type: 'application/json' }));

      if (configManager.config.useDefaultActions !== false) {
        this.actionMapper.mapActions(path.join(__dirname, '../src/actions'));
      }
      if (configManager.config.actionsFolder) {
        this.actionMapper.mapActions(configManager.config.actionsFolder);
      }

      if (configManager.config.facebook && configManager.config.facebook.verifyToken) {
        const registerFacebook = require('./connectors/facebook');
        registerFacebook(this.server);
      }

      if (configManager.config.slack && configManager.config.botToken) {
        const registerSlack = require('./connectors/slack');
        registerSlack(this.server);
      }

      if (configManager.config.alexa) {
        const registerAlexa = require('./connectors/alexa');
        registerAlexa(this.server);
      }

      if (configManager.config.google) {
        const registerGoogle = require('./connectors/google');
        registerGoogle(this.server);
      }

      /*
      ex for cortana :
      if (configManager.config.cortana) {
        const registerCortana = require('./connectors/cortana');
        registerCortana(this.server);
      } */

      if (configManager.config.chatbase && configManager.config.chatbase.apiKey) {
        const chatbase = require('./modules/chatbase');
        chatbase();
      }

      if (configManager.config.static) {
        this.server.use(configManager.config.static.path,
          express.static(configManager.config.static.folder, {
            setHeaders: (res) => {
              res.header('Access-Control-Allow-Origin', configManager.config.static.allowOrigin || '*');
              res.header('Access-Control-Allow-Methods', 'GET');
            },
          }));
      }

      this.server.listen(port, (err) => {
        if (err) throw reject(err);
        logger.log(`> Webserver ready on http://localhost:${port}`);
        resolve(port);
      });
    });
  }
}

module.exports = {
  server: new EthelCore(),
};
