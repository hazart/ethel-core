const startButton = require('./startButton');
const menuButton = require('./menuButton');
const subscription = require('./subscription');
const message = require('./message');
const user = require('./user');

module.exports = {
  startButton: startButton.createButton,
  menuButton: menuButton.createButton,
  subscribeApp: subscription.subscribe,
  sendMessage: message.send,
  getUserInformation: user.getInformation,
};
