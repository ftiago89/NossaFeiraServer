const { statusCode } = require('../../utils/constants');
const { successResponse, errorResponse } = require('../../utils/requestsRespose');
const { validateAuth } = require('../../middleware/auth');
const validateBody = require('../validators/listas/atualizarSchema');
const atualizarLista = require('../../services/listas/atualizarLista');
const GeneralError = require('../../errors/GeneralError');

module.exports.execute = async (event) => {
  try {
    const { familyId } = validateAuth(event);

    const { id } = event.pathParameters;

    const body = JSON.parse(event.body);

    if (!validateBody(body)) {
      throw new GeneralError(statusCode.BAD_REQUEST, null, validateBody.errors);
    }

    const lista = await atualizarLista({ familyId, id, body });

    return successResponse(statusCode.OK, lista);
  } catch (err) {
    console.error('Error => ', err);
    return errorResponse(err);
  }
};
