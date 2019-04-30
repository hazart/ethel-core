/**
 * class DialogParameter - an object to be feed along the dialog
 * with the messenger event and the apiai response
 */
class DialogParameter {
  constructor(senderId, userId, sessionIds, messengerEvent, transformDirectMessage = null) {
    this.senderId = senderId; // the user id on the messenger
    this.userId = userId; // the user id on the database
    this.sessionIds = sessionIds; // the sessions ids
    this.messengerEvent = messengerEvent; // the event received by the messenger
    this.messengerName = null; // the name of the messenger (facebook, slack...)
    this.apiAiResponse = {}; // the response from the ApiAi
    this._valuesToPopulateString = {}; // add some dynamic content to DF response. Hello {{ username }}, {username: 'you'} => Hello you
    this.formattedMessages = []; // the messages prepared to be sent to the messenger
    this._directMessage = {}; // custom payload to be sent directly to the user
    this.queriesToDo = []; // queries to be done defined by an apiAi action
    this.remainingQueries = []; // queries from the last query
    this.queriesToOtherUsers = []; // queries to be done on behalf of other users

    this.transformDirectMessage = transformDirectMessage;
  }

  // @TODO: check how the other messenger events are created
  // @TODO: maybe it's a better idea to create a dialogParams for each messenger that inherits from this one
  updateMessengerEvent(queryToDo) {
    for(let query of queryToDo) {
      this.messengerEvent.content = query.content;
      this.messengerEvent.type = query.type;
      this.messengerEvent.message = {};
    }
  }

  get valuesToPopulateString() {
    return this._valuesToPopulateString;
  }
  set valuesToPopulateString(values) {
    this._valuesToPopulateString = { ...this._valuesToPopulateString, ...values};
  }

  get directMessage() {
    return this._directMessage;
  }
  set directMessage(directMessage) {
    if (typeof this.transformDirectMessage === 'function') {
      this._directMessage = this.transformDirectMessage(directMessage);
    } else {
      this._directMessage = directMessage;
    }
  }

  /**
  * Add a new query to do
  *
  * @param queryToDo
  */
  addQueryToDo(queryToDo) {
    this.queriesToDo.push(queryToDo);
  }


  resetQueriesToDo() {
    this.queriesToDo = [];
  }

  /**
   * Add remaining queries to the queries to do so they can be done first
   *
   * @param remainingQueries
   */
  addRemainingQueriesToTheTop(remainingQueries) {
    remainingQueries.reverse();
    for(let query of remainingQueries) {
      this.queriesToDo.unshift(query);
    }
    this.remainingQueries = [];
  }

  /**
   * Update the remaining queries with new queries to do
   *
   * @param queries
   */
  updateRemainingQueries(queries) {
    for (let query of queries) {
        this.remainingQueries.push(query);
    }
  }

  /**
  * Add a new query to other user
  *
  * @param queryToOtherUser
  */
  addQueryToOtherUser(queryToOtherUser) {
    this.queriesToOtherUsers.push(queryToOtherUser);
  }


}

module.exports = DialogParameter;
