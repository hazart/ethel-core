let instance;

class ConfigManager {
  constructor() {
    if (instance === undefined) {
      this.config = {};
      instance = this;
    }

    return instance;
  }

  setConfig(ethelCoreConfig) {
    this.config = { ...ethelCoreConfig };

    if (!this.config.logger) {
      this.config.logger = console;
    }
  }
}

module.exports = new ConfigManager();
