const GeneralError = require('../errors/GeneralError');
const { statusCode, statusDescription } = require('./constants');

function successResponse(statusCode, body) {
  const response = {
    statusCode,
  };
  if (body) {
    response.body = JSON.stringify(body);
  }

  return response;
}

function errorResponse(err) {
  if (err instanceof GeneralError) {
    const { timeStamp, status, statusDescription, type, error, errors } = err;
    const errorBody = {
      timeStamp,
      status,
      statusDescription,
      type,
      errors,
    };

    if (error) {
      errorBody.errorCode = error.code;
      errorBody.errorMessage = error.message ? error.message : error;
    }

    return {
      statusCode: status,
      body: JSON.stringify(errorBody),
    };
  } else {
    return {
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      body: JSON.stringify({
        timeStamp: new Date(),
        status: statusCode.INTERNAL_SERVER_ERROR,
        statusDescription: statusDescription[statusCode.INTERNAL_SERVER_ERROR],
        type: 'Unexpected Error',
        errorMessage: err.message
          ? err.message
          : statusDescription[statusCode.INTERNAL_SERVER_ERROR],
      }),
    };
  }
}

module.exports = { successResponse, errorResponse };
