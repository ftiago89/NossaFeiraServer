const { execute } = require('../../../src/lambdas/listas/deletar');
const Lista = require('../../../src/models/Lista');

jest.mock('../../../src/database/db', () => jest.fn().mockResolvedValue());

const makeEvent = ({ apiKey, familyId, id } = {}) => ({
  headers: {
    'x-api-key': apiKey ?? 'chave-de-teste',
    'x-family-id': familyId ?? 'familia-teste',
  },
  pathParameters: { id: id ?? 'uuid-teste' },
});

beforeAll(() => {
  process.env.API_KEY = 'chave-de-teste';
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('DELETE /listas/{id} - deletar', () => {
  describe('sucesso', () => {
    test('deve deletar a lista e retornar 200', async () => {
      jest.spyOn(Lista, 'findOneAndDelete').mockResolvedValue({ _id: 'uuid-teste' });

      const response = await execute(makeEvent());

      expect(response.statusCode).toBe(200);
    });
  });

  describe('erros', () => {
    test('deve retornar 404 quando lista não for encontrada', async () => {
      jest.spyOn(Lista, 'findOneAndDelete').mockResolvedValue(null);

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
