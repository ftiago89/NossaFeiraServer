const { statusCode } = require('../../utils/constants');
const { successResponse, errorResponse } = require('../../utils/requestsRespose');
const { validateAuth } = require('../../middleware/auth');
const validateBody = require('../validators/listas/criarSchema');
const criarLista = require('../../services/listas/criarLista');
const GeneralError = require('../../errors/GeneralError');

module.exports.execute = async (event) => {
  try {
    const { familyId } = validateAuth(event);

    const body = JSON.parse(event.body);

    if (!validateBody(body)) {
      throw new GeneralError(statusCode.BAD_REQUEST, null, validateBody.errors);
    }

    const lista = await criarLista({ familyId, body });

    return successResponse(statusCode.CREATED, lista);
  } catch (err) {
    console.error('Error => ', err);
    return errorResponse(err);
  }
};
