const configManager = require('../../utils/configManager');
const logger = require('../../utils/logger');
const dialogFlow = require('../../dialogFlow');
const userManager = require('../../models/user').manager;

const alexa = require('alexa-app');
const helper = require('./helper');

// @TODO: add default message in agence bot
const I18N = {
  availableI18N: {
    default: 'en-GB',
    lang: ['fr-FR', 'en-GB'],
  },
  hello: {
    'fr-FR': 'Bonjour, que puis-je faire pour vous aujourd\'hui ?',
    'en-GB': 'Hello, how can I help you ?',
  },
  bye: {
    'fr-FR': 'C\'est envoyé. Merci.',
    'en-GB': 'Done. Thank you and see you soon.',
  },
  getLocale: locale => (I18N.availableI18N.lang.indexOf(locale) > -1 ? locale : I18N.availableI18N.default),
};

function getUserInfo(raw) {
  return () => new Promise((resolve) => {
    resolve({
      senderId: raw.context.System.user.userId,
      messenger: dialogFlow.constants.alexa,
      locale: raw.request.locale,
    });
  });
}

function supportsDisplay(request) {
  return request.context &&
         request.context.System &&
         request.context.System.device &&
         request.context.System.device.supportedInterfaces &&
         request.context.System.device.supportedInterfaces.Display;
}

function getImageBg() {
  return {
    type: 'Display.RenderTemplate',
    template: {
      type: 'BodyTemplate6',
      backButton: 'HIDDEN',
      backgroundImage: {
        contentDescription: '',
        sources: [{
          url: '',
          size: 'MEDIUM',
        },
        ],
      },
    },
  };
}

const handleDialog = (req, res, intentName, customSlots = {}) => {

  logger.log(`Alexa dialog status ${req.data.request.dialogState}`);

  // keep asking for slots
  if (!req.getDialog().isCompleted()) {
    return res.shouldEndSession(false).directive({
      type: 'Dialog.Delegate',
      updatedIntent: {
        name: intentName,
        confirmationStatus: req.confirmationStatus,
        slots: {
          ...req.data.request.intent.slots,
          ...customSlots,
        },
      },
    }).send();
  } else {
    return res.shouldEndSession(true).say(I18N.bye[I18N.getLocale(req.data.request.locale)]);
  }
};

// @TODO: add possibility off adding custom intent in agence bot
const intentsList = {};
const handleReceivedMessage = (alexaApp, request, response, dialogParams) => {
  const intentName = alexaApp.intentName(request.data);
  logger.log(`Intent name: ${intentName}`);
  if (request.type() === 'IntentRequest' && intentName && !intentsList[intentName]) {
    // create intent handler
    intentsList[intentName] = true;
    alexaApp.intent(intentName,
      {},
      async (req, res) => {
        const slots = req.slots;

        // exemple of setting custom value in slots (exemple for {fullfill_random} slot:
        let customSlots = {};
        if (slots.fullfill_random) {
          customSlots.fullfill_random = {
            name: 'fullfill_random',
            value: Math.floor(Math.random() * Math.floor(10)),
          };
        }

        // handling action
        const slotsList = Object.keys(slots);
        logger.log('slotsList', slotsList);

        const slotsAsActionParams = {};
        Object.keys(slots).forEach((key) => {
          const slot = slots[key];
          if (slot.value) {
            slotsAsActionParams[key] = slot.value;
          }
        });

        for (let index = 0; index < slotsList.length; index++) {
          const action = slotsList[index];
          if (action.indexOf('action_') !== -1) {
            if (action && slots[action].value !== 'CONFIRMED') {
              customSlots[action] = {
                name: action,
                value: 'CONFIRMED',
              };
              try {
                const actionsData = await helper.prepareAndExecute(action, slotsAsActionParams, dialogParams);
                if (actionsData.slots) {
                  const actionSlots = actionsData.slots;
                  customSlots = { ...customSlots, ...actionSlots };
                }
              } catch (err) {
                logger.log('Alexa - Error in action');
              }
            }
          }
        }


        dialogFlow.checkForQueriesToOtherUsers(dialogParams)
          .then(() => {
            dialogParams.queriesToOtherUsers = [];
          });

        return handleDialog(req, res, intentName, customSlots);

      },
    );
  }
};


function registerAlexa(server) {

  const routeName = configManager.config.alexa.route || '/wh/alexa';

  const alexaApp = new alexa.app(routeName);

  alexaApp.express({
    expressApp: server,
    checkCert: configManager.config.alexa.checkCert,
    debug: configManager.config.alexa.debug,
  });


  // on invocation name
  alexaApp.launch((request, response) => {
    try {
      response
        .shouldEndSession(false)
        .say(I18N.hello[I18N.getLocale(request.data.request.locale)]);

      if (supportsDisplay(request.data)) {
        // response.directive(getImageBg());
      }
    } catch (err) {
      logger.error('Alexa error - ', err);
    }
  });

  // get intent name
  alexaApp.intentName = json => ((json.request.intent && json.request.intent.name) ? json.request.intent.name : null);

  // every time we have got a request from alexa
  alexaApp.pre = (request, response, type) => {

    if (request) {
      logger.log('Alexa - Ethel received a new message');
      logger.log(`Alexa - This is a ${request.type()}`);

      // create user, no need to wait user result
      const userCreated = userManager.createUser(request.context.System.user.userId, getUserInfo(request.data));

      const params = {
        senderId: request.context.System.user.userId,
        // senderId: userCreated.senderId,
        userId: userCreated.userId,
        messengerName: dialogFlow.constants.alexa,
      };

      const dialogParams = dialogFlow.createDialogParams(params);

      return handleReceivedMessage(alexaApp, request, response, dialogParams);
    }

  };


  alexaApp.sessionEnded((request) => {
    if (request.data.request.error) {
      logger.error(request.data.request.error);
    }
  });

}

module.exports = registerAlexa;
