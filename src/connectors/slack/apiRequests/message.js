const configManager = require('../../../utils/configManager');
const logger = require('../../../utils/logger');
const helper = require('../helper');

const { WebClient } = require('@slack/client');

const SlackWebClient = new WebClient(configManager.config.slack.botToken);

/**
 * Send a Slack message to the user
 *
 * @param msgParams
 */

function send(msgParams) {

  return new Promise((resolve, reject) => {
    logger.debug('---> Slack - Sending message', msgParams);

    msgParams.content = helper.transformPayload(msgParams.content);

    SlackWebClient.chat.postMessage(
      {
        channel: msgParams.senderId,
        as_user: true,
        ...msgParams.content,
      })
      .then((res) => {
        if (!res.ok) {
          reject('Slack - Error sending message');
        } else {
          resolve(res);
        }
      })
      .catch((err) => {
        logger.error('Slack - Error while sending message: ', err);
        reject(err);
      });
  });
}

module.exports = {
  send,
};
