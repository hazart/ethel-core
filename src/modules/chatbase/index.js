const emitter = require('../../utils/eventEmitter');
const logger = require('../../utils/logger');
const createMessage = require('./createMessage').createMessage;

const listenEvents = () => {
  emitter.eventEmitter.on('message.send', (value) => {
    logger.log('Event - Chatbase - message.send :', value);
    createMessage(value);
  });
};


module.exports = listenEvents;
