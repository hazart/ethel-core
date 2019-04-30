const logger = require('../index').server.getUtils().logger;
const dataCheck = require('../index').server.getUtils().dataCheck;
const models = require('../index').server.getModels();

const User = models.user.Model;
const UserDetail = models.userDetail.Model;
const async = require('async');


class AdminActions {
  constructor() {
    this.user__event = this.user__event.bind(this);
    this.user__tag = this.user__tag.bind(this);
    this.user__untag = this.user__untag.bind(this);
    this.user__stop = this.user__stop.bind(this);
    this.user__start = this.user__start.bind(this);
  }

  /**
  * Run admin actions on users using their names or a tag associated to a group of users.
  *
  * @param {object} dialogParams
  * @param {string} callback - the function to apply to the user
  * @return {Promise}
  */
  _start(dialogParams, callback) {

    return new Promise((resolve, reject) => {

      const parameters = dialogParams.apiAiResponse.queryResult.parametersFormatted;
      const user = parameters.admin_user_name || parameters.admin_user_stop || parameters.admin_user_start;
      const tag = parameters.admin_user_tag;
      const messenger = parameters.admin_user_messenger;

      // the action must be done on a user
      if (dataCheck.isPrimitiveAvailable(user)) {

        logger.debug('DF - Got a user: ', user);

        const userArray = user.split(' ');
        const firstName = userArray[0];
        const lastName = userArray[1];

        User.findOne({
          where: {
            firstName,
            lastName,
          },
        })
          .then(dataCheck.isDbResultAvailableP)
          .then((data) => {

            const fnParams = {
              dialogParams,
              user: data,
              resolve,
            };
            callback(fnParams);
          })
          .catch((err) => {
            logger.error(`DF - Not able to apply an action to the user ${firstName} ${lastName}: `, err);
            callback({ reject });
          });

      }

      // the action must by messenger on a user
      if (dataCheck.isPrimitiveAvailable(messenger)) {

        User.findAll({
          where: {
            name: 'messenger',
            value: messenger,
          },
        },
        )
          .then(dataCheck.isArrayAvailableP)
          .then((userMessenger) => {
            async.eachSeries(userMessenger, (item, next) => {
              const fnParams = {
                dialogParams,
                user: item,
                nextUser: next,
              };
              callback(fnParams);
            }, (err) => {
              if (err) {
                logger.error('DF - Error sending to all', err);
                reject(err);
              } else {
                resolve(dialogParams);
              }
            });
          })
          .catch((err) => {
            logger.error('DF - Error applying an action to all', err);
            reject(err);
          });
      }

      // the action must be done on a list of users defined by a tag
      if (dataCheck.isPrimitiveAvailable(tag)) {

        logger.debug('DF - Got a tag: ', tag);

        UserDetail.findAll({
          where: {
            name: 'tag',
            value: tag,
          },
          group: 'user_id',
          order: 'created_at DESC',
        })
          .then(dataCheck.isArrayAvailableP)
          .then((userDetails) => {
            async.eachSeries(userDetails, (item, next) => {
              User.findOne({
                where: {
                  id: item.user_id,
                },
              })
                .then(dataCheck.isDbResultAvailableP)
                .then((data) => {
                  const fnParams = {
                    dialogParams,
                    user: data,
                    nextUser: next,
                  };

                  callback(fnParams);
                })
                .catch((err) => {
                  logger.error('DF - Not able to apply an action: ', err);
                  next(err);
                });
            }, (err) => {
              if (err) {
                logger.error(`DF - Error applying an action to users with tag ${tag}: `, err);
                callback({ reject });
                // reject(err);
              } else {
                const fnParams = {
                  dialogParams,
                  resolve,
                };
                callback(fnParams);
                // resolve(dialogParams);
              }
            });
          })
          .catch((err) => {
            logger.error(`DF - Error applying an action to users with tag ${tag}: `, err);
            callback({ reject });
            // reject(err);
          });
      }

      resolve(dialogParams);
    });
  }


  /**
  * Send an event to user
  * @argument callback -> send from send
  *   @param {object} params
  *   @param {object} params.dialogParams
  *   @param {object} params.user - the user
  *   @param {function} params.resolve - used to return the value to the promise
  *   @param {function} params.reject - used to return an error to the promise
  *   @param {function} params.nextUser - used when in a loop with async
  *   @return {*}
  */
  user__event(dialogParams) {
    return new Promise((resolve, reject) => {
      this._start(dialogParams, (params) => {
        if (params.user) {
          const query = this._getQueryToAnotherUser(params.dialogParams, params.user);
          params.dialogParams.addQueryToOtherUser(query);
        }
        if (dataCheck.isFunctionAvailable(params.resolve)) {
          return resolve(params.dialogParams);
        } else if (dataCheck.isFunctionAvailable(params.reject)) {
          return reject();
        } else if (dataCheck.isFunctionAvailable(params.nextUser)) {
          return params.nextUser();
        } else {
          throw new Error('DF - No function was given to continue the action.');
        }
      });
    });
  }

  /**
  * Get a query to another user
  *
  * @param {object} dialogParams
  * @param {object} user
  * @return {object} query
  */
  _getQueryToAnotherUser(dialogParams, user) {

    const messengerName = user.messenger;
    const parameters = dialogParams.apiAiResponse.queryResult.parametersFormatted;
    const event = parameters.admin_event || parameters.admin_user_event;

    const query = {
      senderId: user.senderId,
      userId: user.id,
      messengerEvent: {
        content: event,
        type: 'event',
      },
      messengerName,
    };


    return query;
  }

  /**
  *  Add tag to user
  *
  * @argument callback -> send from send
  *   @param {object} params
  *   @param {object} params.dialogParams
  *   @param {object} params.user - the user
  *   @param {function} params.resolve - used to return the value to the promise
  *   @param {function} params.reject - used to return an error to the promise
  *   @param {function} params.nextUser - used when in a loop with async
  *   @return {*}
  */
  user__tag(dialogParams) {
    return new Promise((resolve, reject) => {
      this._start(dialogParams, (params) => {

        const parameters = dialogParams.apiAiResponse.queryResult.parametersFormatted;

        async.forEachOf(parameters, (parameterValue, parameterName, nextParameter) => {

          if (parameterName === 'admin_tag') {

            UserDetail.findOne({
              where: {
                name: 'tag',
                value: parameterValue,
              },
              include: [
                { model: User, where: { id: params.user.id } },
              ],
              order: 'created_at DESC',
            })
              .then((data) => {

                if (dataCheck.isDbResultAvailable(data)) {
                  logger.debug(`DF - User ${params.dialogParams.userId} already have the tag ${parameterValue}`);
                  nextParameter();
                } else {
                  UserDetail.create({
                    name: 'tag',
                    value: parameterValue,
                    user_id: params.user.id,
                  })
                    .then(() => {
                      nextParameter();
                    })
                    .catch((err) => {
                      nextParameter(err);
                    });
                }
              })
              .catch((err) => {
                logger.error(`DF - Error adding the tag ${parameterValue} to the user ${params.dialogParams.userId}: `, err);
                nextParameter(err);
              });
          } else {
            nextParameter();
          }

        }, (err) => {
          if (err) {
            logger.error(`DF - Error adding tags to user ${params.dialogParams.userId}: `, err);

            if (dataCheck.isFunctionAvailable(params.reject)) {
              return params.reject(err);
            } else {
              throw new Error('DF - No reject function was given to continue the action.');
            }
          } else if (dataCheck.isFunctionAvailable(params.resolve)) {
            return params.resolve(params.dialogParams);
          } else if (dataCheck.isFunctionAvailable(params.nextUser)) {
            return params.nextUser();
          } else {
            throw new Error('DF - No function was given to continue the action.');
          }
        });

      })

        .then(resolve)
        .catch(reject);
    });

  }

  /**
  *  Delete tag from user
  * @argument callback -> send from send
  *   @param {object} params
  *   @param {object} params.dialogParams
  *   @param {object} params.user - the user
  *   @param {function} params.resolve - used to return the value to the promise
  *   @param {function} params.reject - used to return an error to the promise
  *   @param {function} params.nextUser - used when in a loop with async
  *   @return {*}
  */
  user__untag(dialogParams) {

    return new Promise((resolve, reject) => {
      this._start(dialogParams, (params) => {

        const parameters = dialogParams.apiAiResponse.queryResult.parametersFormatted;

        async.forEachOf(parameters, (parameterValue, parameterName, nextParameter) => {

          if (parameterName === 'admin_tag') {

            UserDetail.destroy({
              where: {
                name: 'tag',
                value: parameterValue,
              },
              include: [
                { model: User, where: { id: params.user.id } },
              ],
            })
              .then(() => {
                nextParameter();
              })
              .catch((err) => {
                logger.error(`DF - Error deleting the tag ${parameterValue} from the user ${params.dialogParams.userId}: `, err);
                nextParameter(err);
              });
          } else {
            nextParameter();
          }

        }, (err) => {
          if (err) {
            logger.error(`DF - Error deleting tags from user ${params.dialogParams.userId}: `, err);

            if (dataCheck.isFunctionAvailable(params.reject)) {
              return params.reject(err);
            } else {
              throw new Error('DF - No reject function was given to continue the action.');
            }
          } else if (dataCheck.isFunctionAvailable(params.resolve)) {
            return params.resolve(params.dialogParams);
          } else if (dataCheck.isFunctionAvailable(params.nextUser)) {
            return params.nextUser();
          } else {
            throw new Error('DF - No function was given to continue the action.');
          }
        });

      })

        .then(resolve)
        .catch(reject);
    });
  }

  /**
  * Stop talking to a user
  *
  * @param {object} params
  * @param {object} params.dialogParams
  * @param {object} params.user - the user
  * @param {function} params.resolve - used to return the value to the promise
  * @param {function} params.reject - used to return an error to the promise
  * @param {function} params.nextUser - used when in a loop with async
  * @return {*}
  */
  user__stop(dialogParams) {
    return new Promise((resolve, reject) => {
      this._start(dialogParams, params => User.update({
        unavailable: 1,
      }, {
        where: {
          id: params.user.id,
        },
      }))
        .then(resolve)
        .catch(reject);
    });
  }

  /**
  * startTalking - Start talking to a user
  *
  * @param {object} params
  * @param {object} params.dialogParams
  * @param {object} params.user - the user
  * @param {function} params.resolve - used to return the value to the promise
  * @param {function} params.reject - used to return an error to the promise
  * @param {function} params.nextUser - used when in a loop with async
  * @return {*}
  */
  user__start(dialogParams) {
    return new Promise((resolve, reject) => {
      this._start(dialogParams, params => User.update({
        unavailable: null,
      }, {
        where: {
          id: params.user.id,
        },
      }))
        .then(resolve)
        .catch(reject);
    });
  }

}

module.exports = AdminActions;
