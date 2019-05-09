const actionMapper = require('../../utils/actionMapper');
const logger = require('../../utils/logger');

function prepareAndExecute(action = '', slotsAsActionParams = {}, dialogParameters = {}) {

  return new Promise((resolve, reject) => {

    action = action.replace('action_', '');
    action = action.split('__');
    const actionName = action[0];
    action = action.splice(1);
    let actionParams = {};
    for (let j = 0; j < action.length; j++) {
      const params = action[j];
      actionParams[action[j]] = null;
      if (j + 1 <= action.length) {
        actionParams[params] = action[j + 1];
        action = action.splice(1);
      }
    }

    actionParams = { ...actionParams, ...slotsAsActionParams };

    logger.log(`Alexa - got an action ${actionName} with params ${JSON.stringify(actionParams, null, 4)}`);

    // mock dialogParams to simulate apiai action params used in our actions
    const dialogParams = dialogParameters;
    dialogParams.apiAiResponse = {
      queryResult: {
        parametersFormatted: actionParams,
      },
    };

    actionMapper.getAction(actionName)(dialogParams)
      .then((data) => {
        logger.log('Alexa - action data', data);
        resolve(data);
      })
      .catch((err) => {
        logger.error(err);
        reject(err);
      });

  });

}


module.exports = {
  prepareAndExecute,
};
