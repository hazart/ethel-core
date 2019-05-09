const logger = require('../../utils/logger');
const User = require('../user').Model;
const UserDetail = require('./model');
const dataCheck = require('../../utils/dataCheck');

/**
 * Create user details from dialog params
 *
 * @param {object} dialogParams
 */
function createUserDetails(dialogParams) {

  const contexts = dialogParams.apiAiResponse.queryResult.outputContexts;
  const parameters = contexts.length > 0 ? contexts[0].parametersFormatted : null;
  const senderId = dialogParams.senderId;

  return new Promise((resolve, reject) => {

    if (dataCheck.isObjectAvailable(parameters)) {

      User.findOne({ where: { senderId } })
        .then(dataCheck.isDbResultAvailableP)
        .then((data) => {

          const parametersProps = Object.keys(parameters);
          for (let i = 0; i < parametersProps.length; i += 1) {
            const name = parametersProps[i];
            if (typeof parameters[name] === 'object') {

              const parametersNameProps = Object.keys(parameters[name]);
              for (let j = 0; j < parametersNameProps.length; j += 1) {
                const property = parametersNameProps[i];
                if (property && property.indexOf('response_') === -1 && property.indexOf('action_') === -1 && property.indexOf('admin_') === -1 && property.indexOf('remove_') === -1) {
                  const value = parameters[name][property];
                  if (dataCheck.isPrimitiveAvailable) {
                    UserDetail.create({
                      name: property,
                      value,
                      user_id: data.id,
                    })
                      .catch((err) => {
                        logger.error('User Parameter Manager - Error creating user detail: ', err);
                      });
                  }
                }
              }
            } else if (name && name.indexOf('response_') === -1 && name.indexOf('action_') === -1 && name.indexOf('admin_') === -1 && name.indexOf('remove_') === -1) {
              const value = parameters[name];
              UserDetail.create({
                name,
                value,
                user_id: data.id,
              })
                .catch((err) => {
                  logger.error('User Parameter Manager - Error creating user detail: ', err);
                });
            }
          }
          return null;
        })
        .then(() => {
          resolve(dialogParams);
        })
        .catch((err) => {
          logger.error('User Parameter Manager - Error creating all user details: ', err);
          reject(err);
        });
    } else {
      resolve(dialogParams);
    }
  });
}

module.exports = {
  createUserDetails,
};
