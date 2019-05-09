const JSONbig = require('json-bigint');

const helper = require('./helper');
const apiRequests = require('./apiRequests');
const configManager = require('../../utils/configManager');
const logger = require('../../utils/logger');
const dialogFlow = require('../../dialogFlow');
const dataCheck = require('../../utils/dataCheck');
const userManager = require('../../models/user').manager;
const bodyParser = require('body-parser');

const urlencodedParser = bodyParser.urlencoded({ extended: false });


const { RTMClient } = require('@slack/client');

const token = configManager.config.slack.botToken;
const rtm = new RTMClient(token);

function getUserInfo(senderId) {
  return new Promise((resolve, reject) => {
    apiRequests.getUserInformation(senderId)
      .then(dataCheck.isObjectAvailableP)
      .then((data) => {
        // check if message is sended by the bot himself to prevent loop
        if (!data.is_bot && data.name !== configManager.config.slack.botName) {
          resolve({
            senderId: data.id,
            messenger: dialogFlow.constants.slack,
            firstName: data.profile.first_name,
            lastName: data.profile.last_name,
            // gender: data.gender,
            locale: data.locale,
            profilePic: data.profile.image_512,
            // timezone: data.timezone, //data.tz
          });
        }
      },
      )
      .catch(err => reject(err));
  });
}


function handleReceivedMessage(senderId, data, messengerEvent) {
  const params = {
    senderId,
    userId: data.userId,
    messengerEvent,
    messengerName: dialogFlow.constants.slack,
    transformDirectMessage: helper.transformPayload,
  };

  const dialogParams = dialogFlow.createDialogParams(params);

  dialogFlow.processEvent(helper.setSlackEventDetails(dialogParams))
    .catch((err) => {
      logger.error('Slack - Error processing the event by the api.', err);
    });

}

function registerSlack(server) {
  const routeName = configManager.config.slack.route || '/wh/slack';
  const routeNameAction = configManager.config.slack.routeAction || '/wh/slack/action';

  server.post(routeName, (req, res) => {

    const body = JSONbig.parse(req.body);
    if (body.challenge) {
      res.send(body.challenge);
    } else {
      res.send('Slack - Error, no challenge value sended');
    }
  });

  server.post(routeNameAction, urlencodedParser, (req, res) => {
    res.status(200).end();
    logger.debug('Slack got an action');
    const actionJSONPayload = JSON.parse(req.body.payload);
    logger.log(actionJSONPayload);
    const senderId = actionJSONPayload.user.id.toString();
    userManager.createUser(senderId, getUserInfo)
      .then((data) => {
        handleReceivedMessage(senderId, data, actionJSONPayload);
      })
      .catch((err) => {
        logger.error('Slack - An error was caught while processing the action', err);
      });
  });

  rtm.on('message', (messengerEvent) => {

    const senderId = messengerEvent.user.toString();
    logger.debug('Slack - Ethel received a new message');

    userManager.createUser(senderId, getUserInfo)
      .then((data) => {

        if (dataCheck.isPrimitiveAvailable(data.unavailable) && dataCheck.isPrimitiveAvailable(messengerEvent.text) && messengerEvent.text.indexOf('user start') === -1) {
          logger.debug(`Slack - The user ${data.userId } is not available so do not answer to him`);
          return null;
        } else {
          logger.log(messengerEvent);
          return handleReceivedMessage(senderId, data, messengerEvent);
        }
      })
      .catch((err) => {
        logger.error('Slack - An error was caught while processing the event', err);
      });

  });

  rtm.start();


}

module.exports = registerSlack;
