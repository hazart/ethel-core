class DispatchActions {

  event(dialogParams) {
    return new Promise((resolve) => {
      const parameters = dialogParams.apiAiResponse.queryResult.parametersFormatted;
      const actionEvent = (parameters.action_event) ? parameters.action_event : 'DISPATCH';
      const queryParams = {
        content: actionEvent,
        type: 'event',
      };

      dialogParams.addQueryToDo(queryParams);

      resolve(dialogParams);
    });
  }
}

module.exports = DispatchActions;
