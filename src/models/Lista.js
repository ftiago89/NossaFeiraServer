const { Schema, model } = require('mongoose');

const ItemSchema = new Schema(
  {
    id: { type: String, required: true },
    nome: { type: String, required: true },
    quantidade: { type: String },
    categoria: { type: String, default: 'OUTROS' },
    preco: { type: Number, min: 0 },
    comprado: { type: Boolean, default: false },
    criadoEm: { type: Number, required: true },
  },
  { _id: false }
);

const ListaSchema = new Schema(
  {
    _id: { type: String },
    familyId: { type: String, required: true, index: true },
    nome: { type: String, required: true },
    valorEstimado: { type: Number, min: 0 },
    valorCalculado: { type: Number, min: 0 },
    criadaEm: { type: Number, required: true },
    itens: { type: [ItemSchema], default: [] },
  },
  {
    timestamps: { createdAt: false, updatedAt: 'updatedAt' },
  }
);

const ListaModel = model('lista', ListaSchema);

module.exports = ListaModel;
