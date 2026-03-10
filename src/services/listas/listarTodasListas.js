const db = require('../../database/db');
const Lista = require('../../models/Lista');

async function listarTodasListas({ familyId, page = 0, pageSize = 50 }) {
  await db();
  const skip = page * pageSize;

  const projection = { _id: 1, nome: 1, valorEstimado: 1, criadaEm: 1, updatedAt: 1, itens: 1 };

  const [content, totalElements] = await Promise.all([
    Lista.find({ familyId }, projection).skip(skip).limit(pageSize),
    Lista.countDocuments({ familyId }),
  ]);

  return { content, page, pageSize, totalElements };
}

module.exports = listarTodasListas;
