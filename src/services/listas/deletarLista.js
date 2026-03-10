const db = require('../../database/db');
const Lista = require('../../models/Lista');
const GeneralError = require('../../errors/GeneralError');
const { statusCode } = require('../../utils/constants');

async function deletarLista({ familyId, id }) {
  await db();
  const lista = await Lista.findOneAndDelete({ _id: id, familyId });

  if (!lista) {
    throw new GeneralError(statusCode.NOT_FOUND, 'Lista não encontrada');
  }
}

module.exports = deletarLista;
