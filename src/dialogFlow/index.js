const constants = require('./constants');
const eventHandler = require('./eventHandler');

module.exports = {
  constants,
  processEvent: eventHandler.processEvent,
  checkForQuery: eventHandler.checkForQuery,
  createDialogParams: eventHandler.createDialogParams,
  checkForQueriesToOtherUsers: eventHandler.checkForQueriesToOtherUsers,
};
