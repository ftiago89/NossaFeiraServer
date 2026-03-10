const { statusCode } = require('../../utils/constants');
const { successResponse, errorResponse } = require('../../utils/requestsRespose');
const { validateAuth } = require('../../middleware/auth');
const listarTodasListas = require('../../services/listas/listarTodasListas');

module.exports.execute = async (event) => {
  try {
    const { familyId } = validateAuth(event);

    const { page, pageSize } = event.queryStringParameters || {};

    const resultado = await listarTodasListas({
      familyId,
      page: page ? parseInt(page) : undefined,
      pageSize: pageSize ? parseInt(pageSize) : undefined,
    });

    return successResponse(statusCode.OK, resultado);
  } catch (err) {
    console.error('Error => ', err);
    return errorResponse(err);
  }
};
