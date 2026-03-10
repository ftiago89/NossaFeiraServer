const { statusCode } = require('../utils/constants');
const GeneralError = require('../errors/GeneralError');

function validateAuth(event) {
  const apiKey = event.headers && event.headers['x-api-key'];
  const familyId = event.headers && event.headers['x-family-id'];

  if (!apiKey || apiKey !== process.env.API_KEY) {
    throw new GeneralError(statusCode.UNAUTHORIZED, 'API key inválida ou ausente');
  }

  if (!familyId) {
    throw new GeneralError(statusCode.BAD_REQUEST, 'Header x-family-id ausente');
  }

  return { familyId };
}

module.exports = { validateAuth };
