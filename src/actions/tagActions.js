const logger = require('../index').server.getUtils().logger;
const models = require('../index').server.getModels();

const User = models.user.Model;
const UserDetail = models.userDetail.Model;
const async = require('async');


class TagActions {
  /**
  * Remove the tag from the current user during the flow.
  *
  * @param {object} dialogParams
  * @return {Promise}
  */
  remove(dialogParams) {

    return new Promise((resolve, reject) => {

      const parameters = dialogParams.apiAiResponse.queryResult.parametersFormatted;

      async.forEachOf(parameters, (parameterValue, parameterName, next) => {

        if (parameterName === 'remove_tag') {

          UserDetail.destroy({
            where: {
              name: 'tag',
              value: parameterValue,
            },
            include: [
              { model: User, where: { id: dialogParams.userId } },
            ],
          })
            .then(() => {
              next();
            })
            .catch((err) => {
              logger.error(`ApiAi - Error deleting the tag ${parameterValue} from the user ${dialogParams.userId}: `, err);
              next(err);
            });
        } else {
          next();
        }

      }, (err) => {
        if (err) {
          logger.error(`ApiAi - Error deleting tags for user ${dialogParams.userId}: `, err);
          reject(err);
        } else {
          resolve(dialogParams);
        }
      });
    });
  }

}

module.exports = TagActions;
