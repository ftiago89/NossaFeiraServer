const GeneralError = require('../../../src/errors/GeneralError');
const { statusCode, statusDescription } = require('../../../src/utils/constants');

describe('GeneralError', () => {
  test('deve criar um erro com status 400 e descrição correta', () => {
    const error = new GeneralError(statusCode.BAD_REQUEST, 'campo inválido');

    expect(error.status).toBe(400);
    expect(error.statusDescription).toBe(statusDescription.BAD_REQUEST);
    expect(error.error).toBe('campo inválido');
    expect(error.timestamp).toBeInstanceOf(Date);
  });

  test('deve criar um erro com status 401 e descrição correta', () => {
    const error = new GeneralError(statusCode.UNAUTHORIZED, 'não autorizado');

    expect(error.status).toBe(401);
    expect(error.statusDescription).toBe(statusDescription.UNAUTHORIZED);
  });

  test('deve criar um erro com status 404 e descrição correta', () => {
    const error = new GeneralError(statusCode.NOT_FOUND, 'não encontrado');

    expect(error.status).toBe(404);
    expect(error.statusDescription).toBe(statusDescription.NOT_FOUND);
  });

  test('deve criar um erro com status 500 e descrição correta', () => {
    const error = new GeneralError(statusCode.INTERNAL_SERVER_ERROR, 'erro inesperado');

    expect(error.status).toBe(500);
    expect(error.statusDescription).toBe(statusDescription.INTERNAL_SERVER_ERROR);
  });

  test('deve aceitar lista de erros de validação', () => {
    const errors = [{ message: 'campo obrigatório' }];
    const error = new GeneralError(statusCode.BAD_REQUEST, null, errors);

    expect(error.errors).toEqual(errors);
  });
});
