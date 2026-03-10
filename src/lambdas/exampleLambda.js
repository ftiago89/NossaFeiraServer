const { statusCode } = require('../utils/constants');
const { errorResponse, successResponse } = require('../utils/requestsRespose');

module.exports.execute = async (req) => {
  try {
    return successResponse(statusCode.OK, { message: 'hello from lambda!' });
  } catch (err) {
    console.error('Error => ', err);
    return errorResponse(err);
  }
};
