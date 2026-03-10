const db = require('../../database/db');
const Lista = require('../../models/Lista');
const GeneralError = require('../../errors/GeneralError');
const { statusCode } = require('../../utils/constants');

async function atualizarLista({ familyId, id, body }) {
  await db();
  const lista = await Lista.findOneAndUpdate(
    { _id: id, familyId },
    {
      $set: {
        nome: body.nome,
        valorEstimado: body.valorEstimado,
        valorCalculado: body.valorCalculado,
        itens: body.itens || [],
      },
    },
    { new: true }
  );

  if (!lista) {
    throw new GeneralError(statusCode.NOT_FOUND, 'Lista não encontrada');
  }

  return lista;
}

module.exports = atualizarLista;
