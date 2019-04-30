const configManager = require('./configManager');

module.exports = {
  log: (...params) => configManager.config.logger.log(...params),
  info: (...params) => configManager.config.logger.info(...params),
  warn: (...params) => configManager.config.logger.warn(...params),
  debug: (...params) => configManager.config.logger.log(...params),
  error: (...params) => configManager.config.logger.error(...params),
  table: (...params) => configManager.config.logger.table(...params),
  trace: (...params) => configManager.config.logger.trace(...params),
  clear: (...params) => configManager.config.logger.clear(...params),
};
