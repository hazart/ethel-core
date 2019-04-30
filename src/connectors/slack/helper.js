const logger = require('../../utils/logger');

/**
 * Set the details of a Slack Event
 *
 * @param {object} dialogParams
 * @return {object} dialogParams
 */
function setSlackEventDetails(dialogParams) {
  const message = dialogParams.messengerEvent;

  console.log('-> Slack -------------------------------->', dialogParams.messengerEvent);

  if (message) {

    logger.debug('event.message: ', message);

    if (message.type === 'interactive_message') {
      logger.debug('It\'s an interactive message');
      dialogParams.messengerEvent.content = message.actions[0].name;
      dialogParams.messengerEvent.type = 'text';
    } else if (message.attachments) {
      logger.debug('It\'s an attachment');
      for (let i = 0; i < message.attachments.length; i++) {
        if (message.attachments[i].image_url) {
          dialogParams.messengerEvent.content = 'USER_IMAGE';
          dialogParams.messengerEvent.type = 'event';
        } else {
          dialogParams.messengerEvent.content = 'OUPS';
          dialogParams.messengerEvent.type = 'text';
        }
      }
    } else if (message.text) {
      logger.debug('It\'s a text message');
      dialogParams.messengerEvent.content = message.text;
      dialogParams.messengerEvent.type = 'text';
    }
  } else if (dialogParams.messengerEvent && dialogParams.messengerEvent.subtype === 'file_share') {
    logger.debug('It\'s a file');
    dialogParams.messengerEvent.content = 'USER_IMAGE';
    dialogParams.messengerEvent.type = 'event';
  } else {
    dialogParams.messengerEvent.content = null;
    dialogParams.messengerEvent.type = null;
  }

  return dialogParams;
}

/**
 * Transform an Fb Event to Slack event
 *
 * @param {object} payload
 * @return {object}
 */
function transformPayload(payload) {
  if (payload.attachment && payload.attachment.type === 'image') {
    payload.attachments = [{
      text: payload.text,
      fallback: 'fallback',
      image_url: payload.attachment.payload.url,
    }];
  } else if (payload.quick_replies) {
    for (let index = 0; index < payload.quick_replies.length; index++) {
      let element = payload.quick_replies[index];
      element.type = 'button';
      element.name = payload.quick_replies[index].payload;
      delete element.payload;

      element.text = element.title;
      delete element.title;
    }

    payload.attachments = [{
      text: payload.text,
      fallback: 'fallback',
      callback_id: 'callback_id',
      actions: payload.quick_replies,
    }];
    delete payload.quick_replies;
    delete payload.text;
  }
  return payload;
}

module.exports = {
  setSlackEventDetails,
  transformPayload,
};
