const logger = require('../index').server.getUtils().logger;
const configManager = require('../utils/configManager');


class SmsActions {
  // action = sms
  index(dialogParams) {
    return new Promise((resolve) => {
      logger.log('execute sms action');

      const parameters = dialogParams.apiAiResponse.queryResult.parametersFormatted;
      const content = parameters.phone_content;
      const phoneNumber = parameters.phone_number;

      if (content && configManager.config.twilio.notifyServiceSid) {
        const twilio = require('twilio')(
          configManager.config.twilio.accountSid,
          configManager.config.twilio.authToken,
        );

        let allNumbers = [];

        if (phoneNumber) {
          allNumbers = allNumbers.concat(phoneNumber);
        }

        const bindings = allNumbers.map(number => JSON.stringify({ binding_type: 'sms', address: number }));
        const service = twilio.notify.services(configManager.config.twilio.notifyServiceSid);

        service.notifications.create({
          toBinding: bindings,
          content,
        });
      }

      resolve(dialogParams);
    });
  }
}

module.exports = SmsActions;
