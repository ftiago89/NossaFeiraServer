const { statusDescription } = require('../utils/constants');

class GeneralError {
  constructor(status, error, errors) {
    this.timestamp = new Date();
    this.status = status;
    this.statusDescription = statusDescription[status];
    this.type = 'General Error';
    this.error = error;
    this.errors = errors;
  }
}

module.exports = GeneralError;
