
const logger = require('../../utils/logger');
const User = require('../user').Model;
const UserString = require('./model');
const dataCheck = require('../../utils/dataCheck');

/**
 * Create user string
 *
 * @param {object} dialogParams
 * @param {string} str
 * @return {Promise} - if ok, number of times a string was used
 */
function createUserString(dialogParams, str) {

  const userId = dialogParams.userId;

  return new Promise((resolve, reject) => {
    if (dataCheck.isPrimitiveAvailable(userId) && dataCheck.isPrimitiveAvailable(str)) {

      UserString.findOne({
        where: {
          str,
        },
        include: [
          { model: User, where: { id: userId } },
        ],
        order: 'created_at DESC',
      })
        .then((data) => {

          if (dataCheck.isDbResultAvailable(data)) {

            // string already exists for this user, just increment the times
            const times = data.times + 1;

            return UserString.update({
              times,
            }, {
              where: {
                id: data.id,
              },
            })
              .then(() => {
                resolve(times);
              })
              .catch((err) => {
                logger.error('User String Manager - Not able to update user string: ', err);
                reject(err);
              });

          } else {

            // string doesn't exist yet, create it
            return UserString.create({
              str,
              times: 1,
              user_id: userId,
            })
              .then((userString) => {
                resolve(userString.times);
              })
              .catch((err) => {
                logger.error('User String Manager - Not able to create user string: ', err);
                reject(err);
              });
          }
        })
        .catch((err) => {
          logger.error('User String Manager - Error creating user string: ', err);
          reject(err);
        });
    } else {
      resolve();
    }
  });
}

module.exports = {
  createUserString,
};
