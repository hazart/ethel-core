const dialogflow = require('dialogflow');

function getSessionClient() {
  return new Promise((resolve, reject) => {
    try {
      const sessionsClient = new dialogflow.SessionsClient();
      resolve(sessionsClient);
    } catch (error) {
      reject(error);
    }
  });
}

function getContextsClient() {
  return new Promise((resolve, reject) => {
    try {
      const contextsClient = new dialogflow.ContextsClient();
      resolve(contextsClient);
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = {
  getSessionClient,
  getContextsClient,
};
