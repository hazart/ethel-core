const async = require('async');

const logger = require('../index').server.getUtils().logger;
const configManager = require('../utils/configManager');


class PhoneActions {
  // action = phone
  index(dialogParams) {
    return new Promise((resolve, reject) => {
      logger.log('execute phone action');

      if (configManager.config.twilio.voiceXML) {
        const twilio = require('twilio')(
          configManager.config.twilio.accountSid,
          configManager.config.twilio.authToken,
        );

        const parameters = dialogParams.apiAiResponse.queryResult.parametersFormatted;

        async.forEachOf(parameters, (parameterValue, parameterName, next) => {

          if (parameterName === 'phone_number') {
            logger.log('calling');
            twilio.calls.create({
              url: configManager.config.twilio.voiceXML,
              to: parameterValue,
              from: configManager.config.twilio.phoneNumber,
            });
          }
          next();

        }, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve(dialogParams);
          }
        });
      }
    });
  }
}

module.exports = PhoneActions;
