const async = require('async');
const uuid = require('node-uuid');
const logger = require('../utils/logger');
const query = require('./apiRequests/query');
const responseType = require('./responseType');
const randomizer = require('../utils/randomizeItems');
const counter = require('../utils/countItems');
const dataCheck = require('../utils/dataCheck');
const emitter = require('../utils/eventEmitter');
const configManager = require('../utils/configManager');
const userDetailManager = require('../models/userDetail').manager;
const dialogManager = require('../models/dialog').manager;
const DialogParameter = require('../dialogFlow/dialogParameter');

const sessionIds = new Map();

const agentType = require('../dialogFlow/constants').agentType;

/**
 * createDialogParams - Creates a dialog parameter object
 *
 * @param {object} params
 * @param {string} params.senderId - the id of the user on the messenger
 * @param {number} params.userId - the id of the user on the database
 * @param {object} params.messengerEvent - the event received by the messenger
 * @param {string} params.messengerName - the name of the messenger
 * @return {object} dialogParams - an object with the dialog parameters
 */
function createDialogParams(params) {

  // set sender id to sessionIds
  if (!sessionIds.has(params.senderId)) {
    sessionIds.set(params.senderId, uuid.v1());
  }
  const dialogParams = new DialogParameter(params.senderId, params.userId, sessionIds, params.messengerEvent, params.transformDirectMessage);
  dialogParams.messengerName = params.messengerName;

  return dialogParams;
}

/**
 * getAction - Get the action to execute
 *
 * @param {object} dialogParams
 */
function getAction(dialogParams) {

  const action = dialogParams.apiAiResponse.queryResult.action;

  return new Promise((resolve, reject) => {

    if (dataCheck.isObjectAvailable(action)) {
      responseType.prepareAction(dialogParams)
        .then(data => data)
        .then(resolve)
        .catch((err) => {
          logger.error('DF - The action didn\'t work: ', err);
          reject(err);
        });
    } else {
      resolve(dialogParams);
    }
  });
}

/**
 * Send the data received from the messenger to Apiai in order to process it
 *
 * @param {object} dialogParams
 */
function makeQuery(dialogParams) {

  logger.debug('DF - Making query');

  return new Promise((resolve, reject) => {
    query.getResponse(dialogParams)
      .then(() => {
        emitter.eventEmitter.emit('message.send', {
          userId: dialogParams.senderId,
          platform: dialogParams.messengerName,
          message: dialogParams.apiAiResponse.queryResult.queryText,
          intent: dialogParams.apiAiResponse.queryResult.intent.displayName,
          handled: !dialogParams.apiAiResponse.queryResult.intent.isFallback,
          userType: agentType.user,
        });

        resolve(dialogParams);
      })
      .catch((err) => {
        const finalErr = { err, dialogParams };
        reject(finalErr);
      });
  });
}

/**
 * prepareResponse - Format the response received from the Apiai
 *
 * @param {object} dialogParams
 */
function prepareResponse(dialogParams) {

  logger.debug('DF - Handle response', dialogParams.senderId, dialogParams.messengerEvent.content, dialogParams.messengerEvent.type);

  const actionOnly = dialogParams.apiAiResponse.queryResult.parametersFormatted.action_only;
  const messages = dialogParams.apiAiResponse.queryResult.fulfillmentMessages;

  return new Promise((resolve, reject) => {

    if (typeof actionOnly !== 'undefined' && actionOnly === '1') {

      logger.debug('DF - Received an action ONLY from the api.');
      getAction(dialogParams)
        .then(resolve)
        .catch(reject);

    } else if (dataCheck.isObjectAvailable(messages)) {

      // const dialogParamsWithMessage = responseType.prepareMessage(dialogParams);

      getAction(dialogParams)
        .then(responseType.prepareMessage)
        .then(resolve)
        .catch((err) => {
          logger.info('DF - There are no messages available: ', err);
          reject(err);
        });

    } else {

      // const dialogParamsWithSpeech = responseType.prepareSpeech(dialogParams);

      getAction(dialogParams)
        .then(responseType.prepareSpeech)
        .then(resolve)
        .catch((err) => {
          logger.error('DF - There isn\'t a speech available: ', err);
          reject(err);
        });
    }
  });
}

/**
 * Send messages back to the messenger
 *
 * @param dialogParams
 * @param message
 * @return {Promise}
 */
function sendMessage(dialogParams, message) {

  const messengerApiRequests = require(`../connectors/${dialogParams.messengerName}/apiRequests`);

  return new Promise((resolve, reject) => {

    if (dataCheck.isObjectAvailable(message)) {

      if (messengerApiRequests.sendMessage) {

        const msgParams = {
          senderId: dialogParams.senderId,
          content: message,
        };

        messengerApiRequests.sendMessage(msgParams)
          .then(() => {
            try {
              emitter.eventEmitter.emit('message.send', {
                userId: dialogParams.senderId,
                platform: dialogParams.messengerName,
                message: msgParams.content.text,
                intent: dialogParams.apiAiResponse.queryResult.intent.displayName,
                handled: !dialogParams.apiAiResponse.queryResult.intent.isFallback,
                userType: agentType.agent,
              });
            } catch (error) {
              logger.error(error);
            }
            resolve();
          })
          .catch((err) => {
            reject(err);
          });

      } else {
        logger.log(`The connector ${dialogParams.messengerName} has no apiRequest/sendMessage method`);
      }
    } else {
      logger.debug('DF - no messages to send');
      resolve();
    }
  });
}

/**
 * Handle messages
 *
 * @param {object} dialogParams
 * @param {*} messages
 * @return {Promise}
 */
function handleMessages(dialogParams, messages) {

  return new Promise((resolve, reject) => {

    if (dataCheck.isArrayAvailable(messages)) {

      async.eachSeries(messages, (message, next) => {

        sendMessage(dialogParams, message)
          .then(() => {
            next();
          })
          .catch((err) => {
            logger.error('DF - Error sending message: ', err);
            next(err);
          });
      }, (err) => {
        if (err) {
          logger.error('DF - Error sending all messages: ', err);
          reject(err);
        }

        logger.debug('DF - All messages have been sent');
        resolve(dialogParams);
      });

    } else {

      sendMessage(dialogParams, messages)
        .then(() => {
          logger.debug('DF - The message is sent');
          resolve(dialogParams);
        })
        .catch((err) => {
          logger.error('DF - Error sending the message: ', err);
          reject(err);
        });
    }
  });
}

/**
 * Check for messages to send to the user
 *
 * @param {object} dialogParams
 * @return {Promise}
 */
function checkForMessage(dialogParams) {

  let formattedMessages = dialogParams.formattedMessages;

  logger.debug('DF - Check for message', formattedMessages);

  return new Promise((resolve, reject) => {

    // Processing api messages
    if (dataCheck.isObjectAvailable(formattedMessages)) {

      let order = dialogParams.apiAiResponse.queryResult.parametersFormatted.response_order;
      const intentName = dialogParams.apiAiResponse.queryResult.intent.displayName;

      if (typeof order !== 'undefined' && order !== null) {

        order = order.toLowerCase();

        if (order === 'n') {

          // Sort messages using a modulo
          counter.countItems(dialogParams, intentName)
            .then((data) => {

              const remainder = data % (formattedMessages.length);
              formattedMessages = formattedMessages[remainder];

              handleMessages(dialogParams, formattedMessages)
                .then(resolve)
                .catch((err) => {
                  logger.error('DF - Error sending messages: ', err);
                  reject(err);
                });
            })
            .catch((err) => {
              logger.error('DF - Not able to define which message to send: ', err);
              reject(err);
            });

        } else {

          // Randomize messages
          formattedMessages = randomizer.getRandomizedItems(formattedMessages, order);

          handleMessages(dialogParams, formattedMessages)
            .then(resolve)
            .catch((err) => {
              logger.error('DF - Error sending messages: ', err);
              reject(err);
            });
        }

      } else {
        handleMessages(dialogParams, formattedMessages)
          .then(resolve)
          .catch((err) => {
            logger.error('DF - Error sending messages: ', err);
            reject(err);
          });
      }

    } else {
      resolve(dialogParams);
    }
  });
}

/**
 * Check for direct messages to send to the user
 *
 * @param {object} dialogParams
 * @return {Promise}
 */
function checkForDirectMessage(dialogParams) {

  const directMessage = dialogParams.directMessage;


  logger.debug('DF - Check for direct message', directMessage);

  return new Promise((resolve, reject) => {

    if (dataCheck.isObjectAvailable(directMessage)) {
      handleMessages(dialogParams, directMessage)
        .then(resolve)
        .catch((err) => {
          logger.error('DF - Error sending direct message: ', err);
          reject(err);
        });

    } else {
      resolve(dialogParams);
    }
  });
}

/**
 * Process the event received by the messenger
 *
 * @param dialogParams
 * @return {Promise}
 */
function processEvent(dialogParams) {

  logger.debug('DF - Process event started');

  return new Promise((resolve) => {
    makeQuery(dialogParams)
      .then(prepareResponse)
      .then(checkForMessage)
      .then(checkForDirectMessage)
      .then(dialogManager.createDialog)
      .then(userDetailManager.createUserDetails)
      .then(() => {
        logger.info('DF - The process is over');

        return checkForQuery(dialogParams);
      })
      .then(checkForQueriesToOtherUsers)
      .then(resolve)

      .catch((err) => {

        let finalError = err;

        // check if the error comes from the apiai
        if (dataCheck.isPrimitiveAvailable(err.apiAiTrace)) {
          finalError = err.apiAiTrace;
        }

        logger.error('DF - Error processing the messenger event: ', finalError);

        const dialogParamsWithError = configManager.config.payload.getErrorPayload(dialogParams);
        dialogParamsWithError.resetQueriesToDo();

        resolve(checkForDirectMessage(dialogParamsWithError));
      });
  });
}

/**
 * Check for queries to execute on ApiAi
 *
 *  @param {object} dialogParams
 *  @return {Promise}
 */
function checkForQuery(dialogParams) {

  const queriesToDo = dialogParams.queriesToDo;
  const remainingQueries = dialogParams.remainingQueries;

  logger.info('DF - Check for new queries', queriesToDo, remainingQueries);

  // Add remaining queries to queries to do
  if (dataCheck.isObjectAvailable(remainingQueries)) {
    dialogParams.addRemainingQueriesToTheTop(remainingQueries);
  }

  return new Promise((resolve) => {

    if (dataCheck.isArrayAvailable(queriesToDo)) {

      logger.debug('DF - Query found, restart the process');

      // if there are multiple queries to do, execute the first and add the others to remaining queries
      // Obs: if the query has a question on it, the next one will be executed without waiting for the answer
      if (queriesToDo.length > 1) {
        // catch the first and start the process with it
        const firstQuery = [queriesToDo.shift()];
        dialogParams.updateMessengerEvent(firstQuery);

        // add the rest to the remaining queries
        dialogParams.updateRemainingQueries(queriesToDo);

        logger.debug('DF - Starting the process with the query', firstQuery);
      } else {
        // do the process with the single query
        dialogParams.updateMessengerEvent(queriesToDo);

        logger.debug('DF - Starting the process with the query', queriesToDo);
      }
      // reset the queries to do so it can receive the ones of the next process
      dialogParams.resetQueriesToDo();

      if (dataCheck.isArrayAvailable(dialogParams.remainingQueries)) {
        logger.debug('DF - The remaining queries are', dialogParams.remainingQueries);
      }
      resolve(processEvent(dialogParams));

    } else {
      logger.info('DF - There aren\'t new queries to do');
      resolve(dialogParams);
    }

  });
}

/**
 * Check for queries to execute on ApiAi on behalf of other users
 *
 *  @param {object} dialogParams
 *  @return {Promise}
 */
function checkForQueriesToOtherUsers(dialogParams) {

  const queriesToOtherUsers = dialogParams.queriesToOtherUsers;

  logger.info('DF - Check for queries to other users', queriesToOtherUsers);

  return new Promise((resolve, reject) => {

    if (dataCheck.isArrayAvailable(queriesToOtherUsers)) {

      async.eachSeries(queriesToOtherUsers, (queryUser, next) => {

        const params = {
          senderId: queryUser.senderId,
          userId: queryUser.userId,
          messengerEvent: queryUser.messengerEvent,
          messengerName: queryUser.messengerName,
          transformDirectMessage: dialogParams.transformDirectMessage,
        };

        const dialogParamsForUser = createDialogParams(params);

        processEvent(dialogParamsForUser)
          .then(() => {
            next();
          })
          .catch((err) => {
            logger.error('DF - Error processing event for user: ', queryUser.userId);
            next(err);
          });

      }, (err) => {
        if (err) {
          logger.error('DF - Error processing all events to other users: ', err);
          reject(err);
        }

        resolve(dialogParams);
      });
    } else {
      logger.info('DF - There aren\'t queries to other users');
      resolve(dialogParams);
    }
  });
}


module.exports = {
  processEvent,
  checkForQuery,
  createDialogParams,
  checkForQueriesToOtherUsers,
};
