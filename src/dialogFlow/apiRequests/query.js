const helper = require('../../dialogFlow/helper');
const configManager = require('../../utils/configManager');
const logger = require('../../utils/logger');

const getSessionClient = require('./oauth').getSessionClient;


/**
 * Send data to ApiAi
 *
 * @param params
 * @return request
 */

const apiAiRequest = async (dialogParams) => {

  const content = dialogParams.messengerEvent.content;
  const type = dialogParams.messengerEvent.type;
  const sessionIds = dialogParams.sessionIds;
  const senderId = dialogParams.senderId;

  logger.info(sessionIds);
  logger.info('DF - Making query with this params: ', `content: ${content}`, `type: ${type}`, `senderId: ${senderId}`, `sessionIds: ${sessionIds}`);

  const sessionClient = await getSessionClient();

  const sessionPath = sessionClient.sessionPath(configManager.config.dialogFlow.projectId, sessionIds.get(senderId));
  const queryRequest = {
    session: sessionPath,
    queryInput: {},
  };

  if (type === 'text') {
    queryRequest.queryInput = {
      text: {
        text: content,
        languageCode: configManager.config.dialogFlow.lang,
      },
    };
  }

  if (type === 'event') {
    queryRequest.queryInput = {
      event: {
        name: content,
        languageCode: configManager.config.dialogFlow.lang,
        parameters: {},
      },
    };
    console.log('==> DF --> Action > ', content.name, content);
  }

  return sessionClient.detectIntent(queryRequest);
};

/**
 * Get the response from ApiAi
 *
 * @param params
 */
function getResponse(dialogParams) {

  return new Promise((resolve, reject) => {

    apiAiRequest(dialogParams)
      .then((response) => {
        const data = response[0];

        if (data.queryResult.outputContexts.length > 0) {
          // @TODO: use structProtoToJson instead
          data.queryResult.outputContexts[0].parametersFormatted = helper.getAllParameters(data.queryResult.outputContexts[0].parameters);
        }
        if (data.queryResult.parameters) {
          // @TODO: use structProtoToJson instead
          data.queryResult.parametersFormatted = helper.getAllParameters(data.queryResult.parameters);
        }
        dialogParams.apiAiResponse = data;

        logger.log('==> DF ---> result: ', JSON.stringify(dialogParams.apiAiResponse, null, 4));
        for (let i = 0; i < dialogParams.apiAiResponse.queryResult.outputContexts.length; i++) {
          logger.log('==> DF ---> context : ', dialogParams.apiAiResponse.queryResult.outputContexts[i].name, `(${dialogParams.apiAiResponse.queryResult.outputContexts[i].lifespanCount})`);
        }
        logger.log('==> DF ----=> intent : ', dialogParams.apiAiResponse.queryResult.intent.displayName);
        logger.log('==> DF ---> action : ', dialogParams.apiAiResponse.queryResult.action);
        logger.log('==> DF ---> parameters : ', dialogParams.apiAiResponse.queryResult.outputContexts.length > 0 ? dialogParams.apiAiResponse.queryResult.outputContexts[0].parameters : null);
        resolve(dialogParams);

      })
      .catch((apiAiTrace) => {
        logger.error('DF - Error on query with this params: ', `content: ${dialogParams.messengerEvent.content}`, `type: ${dialogParams.messengerEvent.type}`, `senderId: ${dialogParams.senderId}`, `sessionIds: ${dialogParams.sessionIds}`);
        logger.error(dialogParams.sessionIds);
        logger.error('DF - Error on query: ', apiAiTrace);

        const err = {
          apiAiTrace,
          dialogParams,
        };

        reject(err);
      });

  });
}


module.exports = {
  getResponse,
};
