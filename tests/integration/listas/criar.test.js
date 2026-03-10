const { execute } = require('../../../src/lambdas/listas/criar');
const Lista = require('../../../src/models/Lista');

jest.mock('../../../src/database/db', () => jest.fn().mockResolvedValue());

const makeEvent = ({ apiKey, familyId, body } = {}) => ({
  headers: {
    'x-api-key': apiKey ?? 'chave-de-teste',
    'x-family-id': familyId ?? 'familia-teste',
  },
  body: JSON.stringify(
    body ?? {
      _id: 'uuid-teste',
      nome: 'Feira da semana',
      valorEstimado: 15000,
      valorCalculado: 850,
      criadaEm: 1741564800000,
      itens: [],
    }
  ),
});

beforeAll(() => {
  process.env.API_KEY = 'chave-de-teste';
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('POST /listas - criar', () => {
  describe('sucesso', () => {
    test('deve criar uma lista e retornar 201', async () => {
      jest.spyOn(Lista.prototype, 'save').mockResolvedValue();

      const response = await execute(makeEvent());

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.nome).toBe('Feira da semana');
      expect(body.familyId).toBe('familia-teste');
    });
  });

  describe('erros', () => {
    test('deve retornar 401 quando x-api-key estiver ausente', async () => {
      const response = await execute(makeEvent({ apiKey: '' }));

      expect(response.statusCode).toBe(401);
    });

    test('deve retornar 401 quando x-api-key for inválida', async () => {
      const response = await execute(makeEvent({ apiKey: 'chave-errada' }));

      expect(response.statusCode).toBe(401);
    });

    test('deve retornar 400 quando x-family-id estiver ausente', async () => {
      const response = await execute(makeEvent({ familyId: '' }));

      expect(response.statusCode).toBe(400);
    });

    test('deve retornar 400 quando body não tiver _id', async () => {
      const response = await execute(makeEvent({
        body: { nome: 'Feira', criadaEm: 1741564800000 },
      }));

      expect(response.statusCode).toBe(400);
    });

    test('deve retornar 400 quando body não tiver nome', async () => {
      const response = await execute(makeEvent({
        body: { _id: 'uuid-teste', criadaEm: 1741564800000 },
      }));

      expect(response.statusCode).toBe(400);
    });
  });
});
