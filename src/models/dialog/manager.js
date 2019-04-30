const logger = require('../../utils/logger');
const Dialog = require('./model');
const User = require('../user').Model;
const dataCheck = require('../../utils/dataCheck');

/**
 * Create a dialog in the database
 *
 * @param {object} dialogParams
 */
function createDialog(dialogParams) {

  const apiAiResponse = dialogParams.apiAiResponse.queryResult;
  const resolvedQuery = apiAiResponse.queryText;
  const userId = dialogParams.userId;

  return new Promise((resolve, reject) => {

    if (dataCheck.isObjectAvailable(resolvedQuery)) {

      Dialog.findOne({
        include: [
          { model: User, where: { id: userId } },
        ],
        order: 'created_at DESC',
      })
        .then((data) => {

          let previousIntentName = null;

          if (dataCheck.isDbResultAvailable(data)) {
            previousIntentName = data.currentIntentName;
          }

          return Dialog.create({
            intentId: apiAiResponse.intent.name,
            previousIntentName,
            currentIntentName: apiAiResponse.intent.displayName,
            speech: apiAiResponse.fulfillmentText,
            resolvedQuery,
            user_id: userId,
          });

        })
        .then(() => {
          resolve(dialogParams);
        })
        .catch((err) => {
          logger.error(new Error('Dialog Manager - Error creating dialog: ', err));
          reject(err);
        });
    } else {
      resolve(dialogParams);
    }
  });
}

module.exports = {
  createDialog,
};
