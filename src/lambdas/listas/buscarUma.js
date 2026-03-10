const { statusCode } = require('../../utils/constants');
const { successResponse, errorResponse } = require('../../utils/requestsRespose');
const { validateAuth } = require('../../middleware/auth');
const buscarUmaLista = require('../../services/listas/buscarUmaLista');

module.exports.execute = async (event) => {
  try {
    const { familyId } = validateAuth(event);

    const { id } = event.pathParameters;

    const lista = await buscarUmaLista({ familyId, id });

    return successResponse(statusCode.OK, lista);
  } catch (err) {
    console.error('Error => ', err);
    return errorResponse(err);
  }
};
