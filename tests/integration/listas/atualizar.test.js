const { execute } = require('../../../src/lambdas/listas/atualizar');
const Lista = require('../../../src/models/Lista');

jest.mock('../../../src/database/db', () => jest.fn().mockResolvedValue());

const makeEvent = ({ apiKey, familyId, id, body } = {}) => ({
  headers: {
    'x-api-key': apiKey ?? 'chave-de-teste',
    'x-family-id': familyId ?? 'familia-teste',
  },
  pathParameters: { id: id ?? 'uuid-teste' },
  body: JSON.stringify(
    body ?? {
      nome: 'Feira atualizada',
      valorEstimado: 20000,
      valorCalculado: 1700,
      itens: [],
    }
  ),
});

const mockLista = {
  _id: 'uuid-teste',
  familyId: 'familia-teste',
  nome: 'Feira atualizada',
  valorEstimado: 20000,
  valorCalculado: 1700,
  itens: [],
};

beforeAll(() => {
  process.env.API_KEY = 'chave-de-teste';
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('PUT /listas/{id} - atualizar', () => {
  describe('sucesso', () => {
    test('deve atualizar a lista e retornar 200', async () => {
      jest.spyOn(Lista, 'findOneAndUpdate').mockResolvedValue(mockLista);

      const response = await execute(makeEvent());

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.nome).toBe('Feira atualizada');
    });
  });

  describe('erros', () => {
    test('deve retornar 404 quando lista não for encontrada', async () => {
      jest.spyOn(Lista, 'findOneAndUpdate').mockResolvedValue(null);

      const response = await execute(makeEvent());

      expect(response.statusCode).toBe(404);
    });

    test('deve retornar 400 quando body tiver preco negativo', async () => {
      const response = await execute(makeEvent({
        body: {
          nome: 'Feira',
          itens: [{ id: 'uuid-item', nome: 'Arroz', criadoEm: 1741564800000, preco: -100 }],
        },
      }));

      expect(response.statusCode).toBe(400);
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
