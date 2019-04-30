const EventEmitter2 = require('eventemitter2').EventEmitter2;

let instance;

class EmitterManager {
  constructor() {
    if (instance === undefined) {
      instance = this;
      this.eventEmitter = this.connect();
    }

    return instance;
  }
  connect() {
    return new EventEmitter2({
      wildcard: true,
    });
  }
}

module.exports = new EmitterManager();
