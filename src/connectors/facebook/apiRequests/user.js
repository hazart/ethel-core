const request = require('request');

const configManager = require('../../../utils/configManager');
const logger = require('../../../utils/logger');

/**
 * Get User Information from Facebook
 *
 * @param senderId
 */
function getInformation(senderId) {
  return new Promise((resolve, reject) => {

    request({

      url: `https://graph.facebook.com/v2.6/${senderId}`,
      qs: { access_token: configManager.config.facebook.pageAccessToken },
      method: 'GET',

    }, (err, response, body) => {

      if (err) {
        logger.error('Facebook - Error getting user information: ', err);
        reject(err);

      } else if (body.error) {
        logger.error('Facebook - Error getting user information: ', body.error);
        reject(body.error);

      } else {
        const info = JSON.parse(response.body);
        info.senderId = senderId;
        resolve(info);
      }
    });
  });
}


module.exports = {
  getInformation,
};
