const request = require('request');

const configManager = require('../../../utils/configManager');
const logger = require('../../../utils/logger');

/**
 * Send a Facebook message to the user
 *
 * @param msgParams
 */
function send(msgParams) {
  return new Promise((resolve, reject) => {

    logger.debug('---> FB - Sending message', msgParams);

    request({
      url: 'https://graph.facebook.com/v2.6/me/messages',
      qs: { access_token: configManager.config.facebook.pageAccessToken },
      method: 'POST',
      json: {
        recipient: { id: msgParams.senderId },
        message: msgParams.content,
      },

    }, (error, response, body) => {

      if (error) {
        logger.error('Facebook - Error while sending message: ', error);
        reject(error);

      } else if (body.error) {
        logger.error('Facebook - Error while sending message: ', body.error);
        reject(body.error);

      } else {
        logger.debug(`Facebook - Message sent: ${response.statusCode}`);
        resolve(response.statusCode);
      }
    });
  });
}


module.exports = {
  send,
};
