const action = require('./action');
const message = require('./message');
const speech = require('./speech');

module.exports = {
  prepareAction: action.prepare,
  prepareMessage: message.prepare,
  prepareSpeech: speech.prepare,
};
