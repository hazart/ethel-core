const message = require('./message');
const user = require('./user');

module.exports = {
  sendMessage: message.send,
  getUserInformation: user.getInformation,
};
