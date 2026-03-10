const { execute } = require('../../../src/lambdas/listas/listarTodas');
const Lista = require('../../../src/models/Lista');

jest.mock('../../../src/database/db', () => jest.fn().mockResolvedValue());

const makeEvent = ({ apiKey, familyId, queryStringParameters } = {}) => ({
  headers: {
    'x-api-key': apiKey ?? 'chave-de-teste',
    'x-family-id': familyId ?? 'familia-teste',
  },
  queryStringParameters: queryStringParameters ?? null,
});

const mockListas = [
  { _id: 'uuid-1', nome: 'Feira da semana', familyId: 'familia-teste' },
  { _id: 'uuid-2', nome: 'Churrasco', familyId: 'familia-teste' },
];

beforeAll(() => {
  process.env.API_KEY = 'chave-de-teste';
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('GET /listas - listarTodas', () => {
  describe('sucesso', () => {
    test('deve retornar listas paginadas com valores default', async () => {
      jest.spyOn(Lista, 'find').mockReturnValue({
        skip: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue(mockListas),
        }),
      });
      jest.spyOn(Lista, 'countDocuments').mockResolvedValue(2);

      const response = await execute(makeEvent());

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.content).toHaveLength(2);
      expect(body.page).toBe(0);
      expect(body.pageSize).toBe(50);
      expect(body.totalElements).toBe(2);
    });

    test('deve respeitar page e pageSize enviados na query', async () => {
      jest.spyOn(Lista, 'find').mockReturnValue({
        skip: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([mockListas[0]]),
        }),
      });
      jest.spyOn(Lista, 'countDocuments').mockResolvedValue(2);

      const response = await execute(makeEvent({
        queryStringParameters: { page: '1', pageSize: '1' },
      }));

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.page).toBe(1);
      expect(body.pageSize).toBe(1);
      expect(body.content).toHaveLength(1);
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
  });
});
