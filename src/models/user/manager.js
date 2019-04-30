const logger = require('../../utils/logger');
const User = require('./model');
const dataCheck = require('../../utils/dataCheck');

/**
 * Create a user in the database
 *
 * @param {number} senderId - user id on messenger
 * @param {function} getUserInfoCb - callback provided by third party messenger

 */
function createUser(senderId, getUserInfoCb) {

  return new Promise((resolve, reject) => {

    User.findOne({ where: { senderId } })
      .then(dataCheck.isDbResultAvailableP)
      .then((data) => {
        // user already on the database
        const params = {
          userId: data.id,
          unavailable: data.unavailable,
        };
        resolve(params);
      })
      .catch(() => {
        getUserInfoCb(senderId)
          .then(dataCheck.isObjectAvailableP)
          .then(data => User.create({
            senderId: data.senderId,
            messenger: data.messenger,
            firstName: data.firstName,
            lastName: data.lastName,
            gender: data.gender,
            locale: data.locale,
            profilePic: data.profilePic,
            timezone: data.timezone,
            unavailable: null,
          })
            .catch((err) => {
              logger.error(err);
              reject('User Manager - Error creating user: ', err);
            }))
          .then((data) => {
            const params = {
              userId: data.id,
              unavailable: null,
            };
            resolve(params);
          })
          .catch((err) => {
            logger.error(new Error('User Manager - Error creating user: ', err));
            reject('User Manager - Error creating user: ', err);
          });
      });
  });
}

module.exports = {
  createUser,
};
