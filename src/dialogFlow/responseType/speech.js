const nunjucks = require('nunjucks');

const configManager = require('../../utils/configManager');
const logger = require('../../utils/logger');

/**
 * Make a template to send back a speech to the messenger
 *
 * @param str
 * @param obj
 * @return {*}
 */
function renderProxy(str, obj) {

  return nunjucks.renderString(str, obj);
}

/**
 *
 * @param speech
 */
function prepare(dialogParams) {

  logger.debug('DF - Received a speech from the api.');

  return new Promise((resolve, reject) => {

    const speech = dialogParams.apiAiResponse.queryResult.fulfillmentText;

    let formattedMessages = '';

    try {
      formattedMessages = renderProxy(speech, configManager.config.payload.getSpeechPayload());
    } catch (err) {
      logger.error('DF - Error preparing all the messages: ', err);
      reject(err);
    }

    dialogParams.formattedMessages = formattedMessages;
    resolve(dialogParams);
  });
}

module.exports = {
  prepare,
};
