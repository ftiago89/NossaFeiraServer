const { validateAuth } = require('../../../src/middleware/auth');

const makeEvent = ({ apiKey, familyId } = {}) => ({
  headers: {
    ...(apiKey !== undefined && { 'x-api-key': apiKey }),
    ...(familyId !== undefined && { 'x-family-id': familyId }),
  },
});

beforeAll(() => {
  process.env.API_KEY = 'chave-de-teste';
});

describe('validateAuth', () => {
  describe('sucesso', () => {
    test('deve retornar familyId quando headers são válidos', () => {
      const event = makeEvent({ apiKey: 'chave-de-teste', familyId: 'familia-teste' });

      const result = validateAuth(event);

      expect(result.familyId).toBe('familia-teste');
    });
  });

  describe('erros', () => {
    test('deve lançar erro 401 quando x-api-key estiver ausente', () => {
      const event = makeEvent({ familyId: 'familia-teste' });

      expect(() => validateAuth(event)).toThrow(expect.objectContaining({ status: 401 }));
    });

    test('deve lançar erro 401 quando x-api-key for inválida', () => {
      const event = makeEvent({ apiKey: 'chave-errada', familyId: 'familia-teste' });

      expect(() => validateAuth(event)).toThrow(expect.objectContaining({ status: 401 }));
    });

    test('deve lançar erro 400 quando x-family-id estiver ausente', () => {
      const event = makeEvent({ apiKey: 'chave-de-teste' });

      expect(() => validateAuth(event)).toThrow(expect.objectContaining({ status: 400 }));
    });
  });
});
