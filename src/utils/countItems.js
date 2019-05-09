const logger = require('../utils/logger');
const userStringManager = require('../models/userString/manager');
const dataCheck = require('../utils/dataCheck');

/**
 * countItems - Count the number of times a string has been used by a user (ex: intent name)
 *
 * @param {object} dialogParams
 * @param {string} str
*/
function countItems(dialogParams, str) {

  return new Promise((resolve) => {

    userStringManager.createUserString(dialogParams, str)
      .then((data) => {
        if (dataCheck.isPrimitiveAvailable(data)) {
          logger.debug(`DF - The string ${str} was called : ${data} times`);
          resolve(data);
        } else {
          logger.debug(`DF - The string ${str} has never been called or some important information is missing to check it`);
          resolve(null);
        }
      })
      .catch((err) => {
        logger.error('DF - Could\'t check the number of times this intent was called: ', err);
        // Do not interrupt the process because of this so resolve the promise
        resolve(null);
      });
  });
}


module.exports = {
  countItems,
};
