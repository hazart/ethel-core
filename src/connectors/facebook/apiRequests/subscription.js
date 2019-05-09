const request = require('request');

const configManager = require('../../../utils/configManager');
const logger = require('../../../utils/logger');

/**
 * Subscribe the app to Facebook
 */
function subscribe() {
  request({
    method: 'POST',
    uri: `https://graph.facebook.com/v2.6/me/subscribed_apps?access_token=${configManager.config.facebook.pageAccessToken}`,
  },
  (error, response, body) => {
    if (error) {
      logger.error('Facebook - Error while subscribing app: ', error);
    } else if (body.error) {
      logger.error('Facebook - Error while subscribing app: ', body.error);
    } else {
      logger.debug('Facebook - Subscription result: ', body);
    }
  });
}

module.exports = {
  subscribe,
};
