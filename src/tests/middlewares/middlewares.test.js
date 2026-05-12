/**
 * Aplicación: EventConnect - Plataforma de gestión de eventos
 * Archivo: middlewares.test.js
 * Descripción: Pruebas para los middlewares de autenticación y autorización.
 * Autor: Pablo Báscones, Mario Caudevilla, Mario Hernández y David Borrel
 */
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

jest.mock('jsonwebtoken', () => ({
  verify: jest.fn()
}));

jest.mock('express-validator', () => ({
  validationResult: jest.fn()
}));

const requireAuth = require('../../middlewares/auth.middleware');
const requireAdmin = require('../../middlewares/admin.middleware');
const { blockRoutesForAuthenticated } = require('../../middlewares/blockRoutes.middleware');
const errorHandler = require('../../middlewares/errorHandler');
const notFound = require('../../middlewares/notFound');
const validateRequest = require('../../middlewares/validateRequest');

function createRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('middlewares', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('requireAuth returns 401 when no token', () => {
    const res = createRes();
    requireAuth({ cookies: {} }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('requireAuth sets req.user on valid token', () => {
    const next = jest.fn();
    jwt.verify.mockReturnValueOnce({ sub: 'u1' });
    const req = { cookies: { accessToken: 't' } };
    const res = createRes();

    requireAuth(req, res, next);

    expect(req.user).toEqual({ sub: 'u1' });
    expect(next).toHaveBeenCalled();
  });

  it('requireAdmin rejects non-admin', () => {
    const res = createRes();
    requireAdmin({ user: { role: 'user' } }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('blockRoutesForAuthenticated blocks when authenticated', () => {
    const res = createRes();
    const middleware = blockRoutesForAuthenticated(['/login']);
    middleware({ user: { sub: 'u1' }, path: '/login' }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('blockRoutesForAuthenticated blocks when unauthenticated', () => {
    const res = createRes();
    const middleware = blockRoutesForAuthenticated(['/login']);
    middleware({ user: null, path: '/private' }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('errorHandler returns error response', () => {
    const res = createRes();
    errorHandler({ message: 'Boom', status: 400 }, {}, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('notFound returns 404', () => {
    const res = createRes();
    notFound({}, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('validateRequest returns 400 on errors', () => {
    validationResult.mockReturnValueOnce({
      isEmpty: () => false,
      array: () => [{ msg: 'error' }]
    });

    const res = createRes();
    validateRequest({}, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('validateRequest calls next when no errors', () => {
    validationResult.mockReturnValueOnce({
      isEmpty: () => true,
      array: () => []
    });

    const next = jest.fn();
    const res = createRes();
    validateRequest({}, res, next);
    expect(next).toHaveBeenCalled();
  });
});
