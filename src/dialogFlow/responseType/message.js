const nunjucks = require('nunjucks');
const async = require('async');
const helper = require('../helper');
const dialogFlowContants = require('../constants');
const configManager = require('../../utils/configManager');
const logger = require('../../utils/logger');
const dataCheck = require('../../utils/dataCheck');

/**
 * renderProxy - Render the template using nunjucks
 *
 * @param str
 * @param obj
 * @return {*}
 */
function renderProxy(str, obj) {
  return nunjucks.renderString(str, obj);
}

/**
 *  Format the messages
 *
 * @param {object} dialogParams
 * @param {*} message
 * @returns {Promise}
 */
function format(dialogParams, message) {

  let messageContent = {};
  const messengerName = dialogParams.messengerName;

  return new Promise((resolve, reject) => {

    switch (message.message) {
      case 'text': {
        logger.debug('-> one text response message');

        const customPayload = { ...configManager.config.payload.getMessagePayload(), ...dialogParams.valuesToPopulateString };
        const response = renderProxy(message.text.text[0], customPayload);
        console.log('//////')
        console.log(message.text.text[0]);
        console.log(response);
        console.log('//////');

        if (dataCheck.isObjectAvailable(response)) {
          if (response.length > 0 && response[0] !== '{') {
            messageContent = {
              text: response,
            };
          } else {
            messageContent = response;
          }

          resolve(messageContent);
        } else {
          messageContent = response;
          resolve(messageContent);
        }
        break;
      }
      case 'card':
      case 'carousel': {
        logger.debug('-> one card message');

        const elements = [];
        let cards = [].concat(message.card || []);
        for (let i = 0; i < cards.length; i++) {
          const formattedButtons = [];
          for (let j = 0; j < cards[i].buttons.length; j++) {
            const element = cards[i].buttons[j];
            const isUrl = element.postback.startsWith('http');
            const button = {
              type: isUrl ? 'web_url' : 'postback',
              title: element.text,
            };
            const buttonAction = isUrl ? 'url' : 'payload';
            button[buttonAction] = element.postback;

            formattedButtons.push(button);
          }
          elements.push({
            title: cards[i].title,
            image_url: cards[i].imageUri,
            subtitle: cards[i].subtitle,
            buttons: (formattedButtons.length) ? formattedButtons : undefined,
          });


        }

        messageContent = {
          attachment: {
            type: 'template',
            payload: {
              template_type: 'generic',
              elements,
            },
          },
        };
        resolve(messageContent);
        break;
      }
      case 'quickReplies': {
        logger.debug('-> one quick reply message');
        const formattedReplies = [];
        for (let index = 0; index < message.quickReplies.quickReplies.length; index++) {
          const element = message.quickReplies.quickReplies[index];
          formattedReplies.push({
            content_type: 'text',
            title: element,
            payload: element,
          });
        }
        messageContent = {
          text: message.quickReplies.title,
          quick_replies: formattedReplies,
        };
        resolve(messageContent);
        break;
      }
      case 'image': {
        logger.debug('-> one image message');

        messageContent = {
          attachment: {
            type: 'image',
            payload: {
              url: message.image.imageUri,
            },
          },
        };
        resolve(messageContent);
        break;
      }
      case 'payload': {
        logger.debug('-> one custom payload message');
        // messageContent = message.payload.facebook;
        messageContent = helper.structProtoToJson(message.payload.fields[messengerName].structValue);
        resolve(messageContent);
        break;
      }
      default:
        break;
    }
  });
}

/**
 * Get cards of intents and merge them in carousel
 * @param {*} messages array of DF messages
 */
function groupCardsToCarousel(messages) {
  let cards = [];
  const mergedMessages = [];
  for (let i = 0; i < messages.length; i++) {
    const element = messages[i];
    if (element.message === dialogFlowContants.content.card
            && (
              (messages[i + 1] && messages[i + 1].message === dialogFlowContants.content.card) ||
                (messages[i - 1] && messages[i - 1].message === dialogFlowContants.content.card)
            )
    ) {
      cards.push(element[dialogFlowContants.content.card]);
      if (!messages[i + 1] || (messages[i + 1] && messages[i + 1].message !== dialogFlowContants.content.card)) {
        mergedMessages.push({
          platform: messages[0].platform,
          card: cards,
          message: dialogFlowContants.content.carousel,
        });
        cards = [];
      }
    } else {
      mergedMessages.push(element);
    }
  }
  return mergedMessages;
}

/**
 * Prepare the messages received by the ApiAi in order to send it back to the messenger
 *
 * @param {object} dialogParams
 * @returns {Promise}
 */
function prepare(dialogParams) {

  logger.debug('DF - Received messages from the api.');

  const defaultPlateform = dialogFlowContants.default;
  let messages = dialogParams.apiAiResponse.queryResult.fulfillmentMessages;

  // console.log('==> DF ---> result fulfillmentMessages: ', JSON.stringify(messages, null, 4));


  const defaultMessages = messages.filter(el => el.platform.toLowerCase() == defaultPlateform);
  const platformMessages = messages.filter(el => el.platform.toLowerCase() == dialogParams.messengerName);


  messages = platformMessages.length ? platformMessages : defaultMessages;
  messages = groupCardsToCarousel(messages);

  // console.log('==> DF ---> result fulfillmentMessages filtered: ', JSON.stringify(messages, null, 4));


  const formattedMessages = [];

  return new Promise((resolve, reject) => {

    async.eachSeries(messages, (message, next) => {

      format(dialogParams, message)
        .then((data) => {
          if (typeof data !== 'undefined') {
            formattedMessages.push(data);
          }
          next();
        })
        .catch((err) => {
          logger.error(`DF - Error preparing the message: ${message}`, err);
          next(err);
        });


    }, (err) => {
      if (err) {
        logger.error('DF - Error preparing all the messages: ', err);
        reject(err);
      }

      dialogParams.formattedMessages = formattedMessages;

      resolve(dialogParams);
    });
  });
}


module.exports = {
  prepare,
};
