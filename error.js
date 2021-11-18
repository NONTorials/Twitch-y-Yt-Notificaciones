module.exports = function YTNotisError(message) {
  Error.captureStackTrace(this, this.constructor);
  this.name = "[Youtube Notifications Error]";
  this.message = message;

};

require('util').inherits(module.exports, Error);
