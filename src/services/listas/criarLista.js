const db = require('../../database/db');
const Lista = require('../../models/Lista');

async function criarLista({ familyId, body }) {
  await db();
  const lista = new Lista({
    _id: body._id,
    familyId,
    nome: body.nome,
    valorEstimado: body.valorEstimado,
    valorCalculado: body.valorCalculado,
    criadaEm: body.criadaEm,
    itens: body.itens || [],
  });

  await lista.save();

  return lista;
}

module.exports = criarLista;
