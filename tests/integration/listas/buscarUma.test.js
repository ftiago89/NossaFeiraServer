const { execute } = require('../../../src/lambdas/listas/buscarUma');
const Lista = require('../../../src/models/Lista');

jest.mock('../../../src/database/db', () => jest.fn().mockResolvedValue());

const makeEvent = ({ apiKey, familyId, id } = {}) => ({
  headers: {
    'x-api-key': apiKey ?? 'chave-de-teste',
    'x-family-id': familyId ?? 'familia-teste',
  },
  pathParameters: { id: id ?? 'uuid-teste' },
});

const mockLista = {
  _id: 'uuid-teste',
  familyId: 'familia-teste',
  nome: 'Feira da semana',
  valorEstimado: 15000,
  valorCalculado: 850,
  criadaEm: 1741564800000,
  itens: [],
};

beforeAll(() => {
  process.env.API_KEY = 'chave-de-teste';
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('GET /listas/{id} - buscarUma', () => {
  describe('sucesso', () => {
    test('deve retornar a lista encontrada com status 200', async () => {
      jest.spyOn(Lista, 'findOne').mockResolvedValue(mockLista);

      const response = await execute(makeEvent());

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body._id).toBe('uuid-teste');
      expect(body.nome).toBe('Feira da semana');
    });
  });

  describe('erros', () => {
    test('deve retornar 404 quando lista não for encontrada', async () => {
      jest.spyOn(Lista, 'findOne').mockResolvedValue(null);

      const response = await execute(makeEvent());

      expect(response.statusCode).toBe(404);
    });

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
  });
});
