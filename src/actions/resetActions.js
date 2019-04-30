const context = require('../index').server.getContext();

const models = require('../index').server.getModels();

const User = models.user.Model;
const UserDetail = models.userDetail.Model;
const UserString = models.userString.Model;

class ResetActions {
  index(dialogParams) {
    return new Promise((resolve, reject) => {
      context.resetContexts(dialogParams, true)
        .then(() => {
          resolve(dialogParams);
        })
        .catch((err) => {
          console.error('DF - Error resetting contexts: ', err);
          reject(err);
        });
    });
  }

  /**
  * Reset the details of the current user who is talking to Ethel.
  *
  * @param {object} dialogParams
  * @return {Promise}
  */
  db(dialogParams) {
    return new Promise((resolve, reject) => {

      UserDetail.destroy({
        where: {
          user_id: dialogParams.userId,
        },
        include: [
          { model: User, where: { id: dialogParams.userId } },
        ],
      })
        .then(() => UserString.destroy({
          where: {
            user_id: dialogParams.userId,
          },
          include: [
            { model: User, where: { id: dialogParams.userId } },
          ],
        }))
        .then(() => {
          resolve(dialogParams);
        })
        .catch((err) => {
          console.error(`DF - Error resetting the user ${dialogParams.userId}:`, err);
          reject(err);
        });
    });
  }
}

module.exports = ResetActions;
