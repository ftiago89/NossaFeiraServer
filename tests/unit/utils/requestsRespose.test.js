const { successResponse, errorResponse } = require('../../../src/utils/requestsRespose');
const GeneralError = require('../../../src/errors/GeneralError');
const { statusCode } = require('../../../src/utils/constants');

describe('successResponse', () => {
  test('deve retornar statusCode e body serializado', () => {
    const response = successResponse(statusCode.OK, { nome: 'Feira' });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual({ nome: 'Feira' });
  });

  test('deve retornar statusCode 201 sem body', () => {
    const response = successResponse(statusCode.CREATED);

    expect(response.statusCode).toBe(201);
    expect(response.body).toBeUndefined();
  });
});

describe('errorResponse', () => {
  test('deve retornar resposta formatada para GeneralError 401', () => {
    const error = new GeneralError(statusCode.UNAUTHORIZED, 'API key inválida');
    const response = errorResponse(error);

    expect(response.statusCode).toBe(401);
    const body = JSON.parse(response.body);
    expect(body.status).toBe(401);
    expect(body.statusDescription).toBe('Unauthorized');
  });

  test('deve retornar resposta formatada para GeneralError 404', () => {
    const error = new GeneralError(statusCode.NOT_FOUND, 'Lista não encontrada');
    const response = errorResponse(error);

    expect(response.statusCode).toBe(404);
    const body = JSON.parse(response.body);
    expect(body.status).toBe(404);
  });

  test('deve retornar 500 para erro genérico', () => {
    const error = new Error('erro inesperado');
    const response = errorResponse(error);

    expect(response.statusCode).toBe(500);
    const body = JSON.parse(response.body);
    expect(body.status).toBe(500);
    expect(body.errorMessage).toBe('erro inesperado');
  });
});
