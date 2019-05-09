const request = require('request');

const configManager = require('../../../utils/configManager');
const logger = require('../../../utils/logger');

/**
 * Create button to start the dialog on Facebook
 */
function createButton() {
  request({
    url: 'https://graph.facebook.com/v2.6/me/thread_settings',
    qs: { access_token: configManager.config.facebook.pageAccessToken },
    method: 'POST',
    json: {
      setting_type: 'call_to_actions',
      thread_state: 'new_thread',
      call_to_actions: [
        {
          payload: 'Démarrer',
        },
      ],
    },
  },
  (error, response, body) => {
    if (error) {
      logger.error('Facebook - Error while getting start button: ', error);
    } else if (body.error) {
      logger.error('Facebook - Error while getting start button: ', body.error);
    } else {
      logger.debug('Facebook - Got start button: ', body);
    }
  });
}

module.exports = {
  createButton,
};
