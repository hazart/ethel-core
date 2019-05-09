const async = require('async');

const logger = require('../../utils/logger');
const dataCheck = require('../../utils/dataCheck');

const configManager = require('../../utils/configManager');
const getContextsClient = require('./oauth').getContextsClient;


const deleteContext = async (context) => {

  const contextsClient = await getContextsClient();

  const request = {
    name: context.name,
  };

  const contextId = contextsClient.matchContextFromContextName(context.name);

  return new Promise((resolve, reject) => {
    contextsClient
      .deleteContext(request)
      .then(() => {
        logger.log(`ApiApi - Context ${contextId} deleted`);
        resolve();
      })
      .catch((err) => {
        logger.error(`Failed to delete context ${contextId}`, err);
        reject(err);
      });
  });
};

const deleteAllContexts = async (dialogParams) => {

  // const contexts = dialogParams.apiAiResponse.queryResult.outputContexts;
  const projectId = configManager.config.dialogFlow.projectId;
  const sessionId = dialogParams.sessionIds.get(dialogParams.senderId);

  const contextsClient = await getContextsClient();

  const sessionPath = contextsClient.sessionPath(projectId, sessionId);

  const request = {
    parent: sessionPath,
  };

  return new Promise((resolve, reject) => {
    contextsClient
      .deleteAllContexts(request)
      .then(() => {
        logger.log('DF - All Context deleted');
        resolve();
      })
      .catch((err) => {
        logger.error('DF - Failed to delete context all context', err);
        reject(err);
      });
  });

};


/**
 * Check which contexts must be deleted
 */
function getContextsToExclude(dialogParams) {

  const contexts = dialogParams.apiAiResponse.queryResult.outputContexts;
  const parameters = contexts.length > 0 ? contexts[0].parametersFormatted : null;
  let needles;
  let needlesArray = [];
  const contextsToExclude = [];

  if (parameters) {
    for (const key in parameters) {
      if (key === 'clean_except') {
        needles = parameters[key];
      }
    }
    if (typeof needles === 'string') {
      needlesArray = needles.split(',');
    }
  }

  logger.debug('DF - needles to except from clean contexts: ', needlesArray);

  if (dataCheck.isArrayAvailable(needlesArray)) {

    for (const context of contexts) {
      const contextName = context.name;
      for (const needle of needlesArray) {
        // if context name is not in the needles array it should be deleted
        if (contextName.indexOf(needle) === -1) {
          contextsToExclude.push(contextName);
        }
      }
    }
  }

  return contextsToExclude;
}

/**
 * Make a call to ApiAi in order to reset the contexts of an user
 *
 * If needle is defined, it will clear only the contexts that contain that needle
 * If no needle is defined, it will clear all contexts
 *
 * @param dialogParams
 * @param all
 */
function resetContexts(dialogParams, all) {


  return new Promise((resolve, reject) => {

    if (all) {
      deleteAllContexts(dialogParams)
        .then(resolve)
        .catch(reject);

    } else {

      const contexts = getContextsToExclude(dialogParams);

      if (dataCheck.isArrayAvailable(contexts)) {

        async.eachSeries(contexts, (context, nextContext) => {

          deleteContext(context)
            .then(nextContext)
            .catch((err) => {
              nextContext(err);
            });

        }, (err) => {

          if (err) {
            logger.error('DF - Error resetting contexts with needles: ', err);
            reject(err);
          } else {
            resolve(dialogParams);
          }
        });

      } else {
        logger.debug('DF - no contexts to exclude.');
        resolve(dialogParams);
      }
    }
  });
}

module.exports = {
  resetContexts,
};
