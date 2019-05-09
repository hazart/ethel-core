const configManager = require('../../utils/configManager');

const bodyParser = require('body-parser');

const {
  dialogflow,
  Image,
} = require('actions-on-google');


function registerGoogle(server) {
  const routeName = configManager.config.google.route || '/wh/google';
  const app = dialogflow();

  app.intent('Default Welcome Intent', (conv) => {
    conv.ask('Hi, how is it going?');
    conv.ask('Here\'s a picture of a cat');
    conv.ask(new Image({
      url: 'https://developers.google.com/web/fundamentals/accessibility/semantics-builtin/imgs/160204193356-01-cat-500.jpg',
      alt: 'A cat',
    }));
  });
  server.post(routeName, bodyParser.json(), (req, res, next) => app(req, res, next));

}

module.exports = registerGoogle;
