const Ajv = require('ajv');
const addFormats = require('ajv-formats');

const ajv = new Ajv();
addFormats(ajv);

const schema = {
  type: 'object',
  properties: {
    nome: { type: 'string', minLength: 1 },
    valorEstimado: { type: 'integer', minimum: 0 },
    valorCalculado: { type: 'integer', minimum: 0 },
    itens: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', minLength: 1 },
          nome: { type: 'string', minLength: 1 },
          quantidade: { type: 'string' },
          categoria: { type: 'string' },
          preco: { type: 'integer', minimum: 0 },
          comprado: { type: 'boolean' },
          criadoEm: { type: 'number' },
        },
        required: ['id', 'nome', 'criadoEm'],
        additionalProperties: false,
      },
    },
  },
  additionalProperties: false,
};

const validate = ajv.compile(schema);

module.exports = validate;
