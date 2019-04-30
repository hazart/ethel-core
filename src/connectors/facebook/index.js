const JSONbig = require('json-bigint');

const helper = require('./helper');
const apiRequests = require('./apiRequests');
const configManager = require('../../utils/configManager');
const logger = require('../../utils/logger');
const dialogFlow = require('../../dialogFlow');
const dataCheck = require('../../utils/dataCheck');
const userManager = require('../../models/user').manager;

const bodyParser = require('body-parser');

function getUserInfo(senderId) {
  return new Promise((resolve, reject) => {
    apiRequests.getUserInformation(senderId)
      .then(dataCheck.isObjectAvailableP)
      .then((data) => {
        let firstName = data.first_name;
        let lastName = data.last_name;
        if (data.name && (!firstName && !lastName)) {
          const userArray = data.name.split(' ');
          firstName = userArray[0];
          lastName = userArray[1];
        }
        resolve({
          senderId: data.senderId,
          messenger: dialogFlow.constants.facebook,
          firstName,
          lastName,
          gender: data.gender,
          locale: data.locale,
          profilePic: data.profile_pic,
          timezone: data.timezone,
        });
      })
      .catch(err => reject(err));
  });
}

function registerFacebook(server) {
  const routeNameAlive = configManager.config.facebook.isAlive || '/wh/facebook-messenger';
  const routeName = configManager.config.facebook.route || '/wh/facebook-messenger';

  // ***** Api Requests to start the app
  apiRequests.subscribeApp();
  apiRequests.startButton();
  apiRequests.menuButton();

  logger.log(` ==> facebook webhook get: ${routeNameAlive}`);
  /**
   * The route Facebook uses to check the application is alive
   */
  server.get(routeNameAlive, (req, res) => {

    logger.debug('---> get/webhook');

    if (req.query['hub.verify_token'] === configManager.config.facebook.verifyToken) {

      res.send(req.query['hub.challenge']);

      setTimeout(() => {
        apiRequests.subscribeApp();
      }, 3000);

    } else {
      res.send('Facebook - Error, wrong validation token');
    }
  });

  logger.log(` ==> facebook webhook post: ${routeName}`);
  /**
  * The route Facebook uses to send the messages received by the page
  */
  server.post(routeName, bodyParser.text({ type: 'application/json' }), (req, res) => {

    const entries = JSONbig.parse(req.body).entry;
    if (entries) {
      entries.forEach((entry) => {

        if (entry.messaging) {
          entry.messaging.forEach((messengerEvent) => {

            const senderId = messengerEvent.sender.id.toString();
            if ((messengerEvent.message && !messengerEvent.message.is_echo)
              || (messengerEvent.postback && messengerEvent.postback.payload)) {
              logger.debug('Facebook - Ethel received a new message');

              userManager.createUser(senderId, getUserInfo)
                .then((data) => {

                  if (dataCheck.isPrimitiveAvailable(data.unavailable) && dataCheck.isPrimitiveAvailable(messengerEvent.message.text) && messengerEvent.message.text.indexOf('user start') === -1) {
                    logger.debug(`Facebook - The user ${data.userId} is not available so do not answer to him`);
                    return null;
                  } else {
                    const params = {
                      senderId,
                      userId: data.userId,
                      messengerEvent,
                      messengerName: dialogFlow.constants.facebook,
                    };


                    const dialogParams = dialogFlow.createDialogParams(params);
                    dialogFlow.processEvent(helper.setFbEventDetails(dialogParams))
                      .catch((err) => {
                        logger.error('Facebook - Error processing the event by the api. An error payload must have been sent to Facebook: ', err);
                      });
                  }

                })
                .catch((err) => {
                  logger.error('Facebook - An error was caught while processing the event but an error payload couldn\'t be sent to Facebook: ', err);

                  return res.status(400).json({
                    status: 'error',
                    error: err,
                  });
                });
            }
          });
        }
      });
    }
    res.status(200).json({
      status: 'ok',
    });
  });
}

module.exports = registerFacebook;
