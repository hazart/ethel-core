const async = require('async');
const logger = require('../../utils/logger');
const actionMapper = require('../../utils/actionMapper');
// const actionHandler = require('../action_handler');

/**
 *
 * @param action
 * @param params
 */
function doAction(action, dialogParams) {

  const senderId = dialogParams.senderId;
  const sessionIds = dialogParams.sessionIds;
  const userId = dialogParams.userId;

  logger.debug('Checking Action information for query: ', senderId, sessionIds, userId);

  return new Promise((resolve, reject) => {

    logger.log(`Invoking action: ${action}`);
    actionMapper.getAction(action)(dialogParams)
      .then(resolve)
      .catch(reject);
  });
}

/**
 * Prepare the action received by ApiAi
 *
 * @param dialogParams
 */
function prepare(dialogParams) {

  const action = dialogParams.apiAiResponse.queryResult.action;
  let actionsArray;

  logger.debug('----> prepare action', action);

  return new Promise((resolve, reject) => {

    if (action.indexOf(',') !== -1) {
      // multiple actions
      actionsArray = action.split(',');

      async.eachSeries(actionsArray, (item, nextAction) => {

        doAction(item, dialogParams)
          .then(() => {
            nextAction();
          })
          .catch((err) => {
            logger.debug('DF - Error doing action: ', err);
            nextAction(err);
          });
      }, (err) => {

        if (err) {
          logger.error('DF - Error doing actions: ', err);
          reject(err);
        } else {
          resolve(dialogParams);
        }
      });

    } else {
      // single action
      doAction(action, dialogParams)
        .then(resolve)
        .catch((err) => {
          logger.debug('DF - Error executing action: ', err);
          reject(err);
        });
    }
  });
}

module.exports = {
  prepare,
};
