const configManager = require('../../utils/configManager');
const logger = require('../../utils/logger');
const chatbase = require('@google/chatbase');

const agentType = require('../../dialogFlow').constants.agentType;

function createMessage(options) {
  const defaultOptions = {
    userId: null,
    platform: null,
    message: null,
    intent: null,
    handled: null,
    userType: null,
  };
  const mergedOptions = { ...defaultOptions, ...options };
  const msg = chatbase.newMessage(configManager.config.chatbase.apiKey)
    .setPlatform(mergedOptions.platform)
    .setMessage(mergedOptions.message)
    .setVersion(configManager.config.version)
    .setUserId(mergedOptions.userId)
    .setIntent(mergedOptions.intent);

  if (mergedOptions.userType === agentType.user) {
    msg.setAsTypeUser();
  }
  if (mergedOptions.userType === agentType.agent) {
    msg.setAsTypeAgent();
  }
  if (mergedOptions.handled) {
    msg.setAsHandled();
  } else {
    msg.setAsNotHandled();
    // The message cannot be set as not_handled and not be of type user
    msg.setAsTypeUser();
  }

  msg.send()
    .then(msgSended => logger.log(msgSended.getCreateResponse()))
    .catch(err => logger.error(err));
}


module.exports = {
  createMessage,
};
