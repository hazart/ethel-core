const logger = require('../../utils/logger');


/**
 * Set the details of a Fb Event
 *
 * @param {object} dialogParams
 * @return {object} dialogParams
 */
function setFbEventDetails(dialogParams) {
  const message = dialogParams.messengerEvent.message;

  if (message && message.text) {
    logger.log('-> FB -------------------------------->', message.text);
  } else {
    logger.log('-> FB -------------------------------->', dialogParams.messengerEvent);
  }

  if (message) {

    logger.debug('event.message: ', message);

    if (message.quick_reply) {
      logger.debug('It\'s a quick reply');
      dialogParams.messengerEvent.content = message.quick_reply.payload;
      dialogParams.messengerEvent.type = 'text';

    } else if (message.attachments) {
      logger.debug('It\'s an attachment');
      for (let i = 0; i < message.attachments.length; i++) {
        if (message.attachments[i].type === 'image') {
          dialogParams.messengerEvent.content = 'USER_IMAGE';
          dialogParams.messengerEvent.type = 'event';
        } else if (message.attachments[i].type === 'audio') {
          dialogParams.messengerEvent.content = 'USER_AUDIO';
          dialogParams.messengerEvent.type = 'event';
        } else if (message.attachments[i].type === 'fallback') {
          dialogParams.messengerEvent.content = message.text;
          dialogParams.messengerEvent.type = 'text';
        } else if (message.attachments[i].type === 'location') {
          dialogParams.messengerEvent.content = `longitude: ${message.attachments[i].payload.coordinates.long} / latitude: ${message.attachments[i].payload.coordinates.lat}`;
          dialogParams.messengerEvent.type = 'text';
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
  } else if (dialogParams.messengerEvent.postback) {
    logger.debug('It\'s a button postback');
    dialogParams.messengerEvent.content = dialogParams.messengerEvent.postback.payload;
    dialogParams.messengerEvent.type = 'text';
  } else {
    dialogParams.messengerEvent.content = null;
    dialogParams.messengerEvent.type = null;
  }

  return dialogParams;
}

module.exports = {
  setFbEventDetails,
};
