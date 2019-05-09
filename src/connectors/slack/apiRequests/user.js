const configManager = require('../../../utils/configManager');
const logger = require('../../../utils/logger');
const { WebClient } = require('@slack/client');

const SlackWebClient = new WebClient(configManager.config.slack.botToken);


/**
 * Get User Information from Slack
 *
 * @param senderId
 */
function getInformation(senderId) {
  return new Promise((resolve, reject) => {

    SlackWebClient.users.info(
      {
        user: senderId,
        include_locale: true,
      })
      .then((res) => {
        if (!res.ok) {
          reject('Slack - Error getting user');
        } else {
          resolve(res.user);
        }
      })
      .catch((err) => {
        logger.error('Slack - Error getting user information: ', err);
        reject(err);
      });
  });
}

module.exports = {
  getInformation,
};
