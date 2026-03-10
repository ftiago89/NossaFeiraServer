const db = require('../../database/db');
const Lista = require('../../models/Lista');
const GeneralError = require('../../errors/GeneralError');
const { statusCode } = require('../../utils/constants');

async function buscarUmaLista({ familyId, id }) {
  await db();
  const lista = await Lista.findOne({ _id: id, familyId });

  if (!lista) {
    throw new GeneralError(statusCode.NOT_FOUND, 'Lista não encontrada');
  }

  return lista;
}

module.exports = buscarUmaLista;
