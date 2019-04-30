/* eslint import/no-dynamic-require: 0, no-loop-func: 0 */
const fs = require('fs');
const path = require('path');

const logger = require('../utils/logger');

let instance;
const actions = {};

function getAllFuncs(param) {
  let props = [];
  let obj = param;

  do {
    const l = Object.getOwnPropertyNames(obj)
      .concat(Object.getOwnPropertySymbols(obj).map(s => s.toString()))
      .sort()
      .filter((p, i, arr) =>
        typeof obj[p] === 'function' && // only the methods
          p !== 'constructor' && // not the constructor
          (i === 0 || p !== arr[i - 1]) && // not overriding in this prototype
          props.indexOf(p) === -1, // not overridden in a child
      );
    props = props.concat(l);
  }
  while (
    (obj = Object.getPrototypeOf(obj)) && // walk-up the prototype chain
        Object.getPrototypeOf(obj) // not the the Object prototype methods (hasOwnProperty, etc...)
  );

  return props;
}

class ActionMapper {
  constructor() {
    if (instance === undefined) {
      instance = this;
    }

    return instance;
  }

  getActions() {
    return { ...actions };
  }

  getAction(actionName) {
    if (!actions[actionName]) {
      return dialogParams => new Promise((resolve) => { resolve(dialogParams); });
    }

    return actions[actionName];
  }

  addAction(actionName, actionFn) {
    actions[actionName] = actionFn;
  }

  mapActions(folder) {
    let controllers;

    try {
      controllers = fs.readdirSync(folder);
    } catch (error) {
      logger.error(` ==> error mapping ${folder}`);
    }

    for (let index = 0; index < controllers.length; index++) {
      const file = controllers[index];
      if (file !== 'index.js') {
        const absolutePath = path.resolve(`${folder}/${file}`);
        logger.log(` ==> mapping file: ${absolutePath}`);
        const ControllerModule = require(`${absolutePath}`);
        const controller = new ControllerModule();

        const controllerProps = getAllFuncs(controller);
        for (let i = 0; i < controllerProps.length; i += 1) {
          const action = controllerProps[i];
          if (typeof controller[action] === 'function'
            && (action.length > 0 && action[0] !== '_')) {

            let actionName;
            const controllerName = file.split('Actions.js')[0];
            if (action === 'index') {
              actionName = controllerName;
            } else {
              actionName = `${controllerName}.${action.replace(/__/g,'.')}`;
            }

            actionName = actionName.toLowerCase();

            logger.log(`    -> mapping action: ${actionName}`);
            this.addAction(actionName, controller[action]);
          }
        }
      }
    }
  }
}

module.exports = new ActionMapper();
