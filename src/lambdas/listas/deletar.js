const { statusCode } = require('../../utils/constants');
const { successResponse, errorResponse } = require('../../utils/requestsRespose');
const { validateAuth } = require('../../middleware/auth');
const deletarLista = require('../../services/listas/deletarLista');

module.exports.execute = async (event) => {
  try {
    const { familyId } = validateAuth(event);

    const { id } = event.pathParameters;

    await deletarLista({ familyId, id });

    return successResponse(statusCode.OK);
  } catch (err) {
    console.error('Error => ', err);
    return errorResponse(err);
  }
};
