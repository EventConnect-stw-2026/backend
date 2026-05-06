const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { sendEmail } = require('../../utils/email');
const User = require('../../models/User');
const Event = require('../../models/Event');

const mockVerifyIdToken = jest.fn();

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn()
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
  verify: jest.fn()
}));

jest.mock('google-auth-library', () => ({
  OAuth2Client: jest.fn(() => ({ verifyIdToken: mockVerifyIdToken }))
}));

jest.mock('../../utils/email', () => ({
  sendEmail: jest.fn()
}));

jest.mock('../../models/User', () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn()
}));

jest.mock('../../models/Event', () => ({
  find: jest.fn()
}));

const authController = require('../../controllers/auth.controller');

function createRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);
  return res;
}

function createPopulateUser(user) {
  return {
    populate: jest.fn().mockResolvedValue(user)
  };
}

describe('auth.controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'secret';
    process.env.JWT_REFRESH_SECRET = 'refresh';
    process.env.FRONTEND_URL = 'http://localhost:4200';
  });

  it('register returns 409 if email exists', async () => {
    User.findOne.mockResolvedValueOnce({ _id: 'u1' });

    const res = createRes();
    await authController.register({ body: { email: 'a@b.com' } }, res);

    expect(res.status).toHaveBeenCalledWith(409);
  });

  it('register creates user and sets cookies', async () => {
    User.findOne.mockResolvedValueOnce(null);
    User.create.mockResolvedValueOnce({
      _id: 'u1',
      name: 'Name',
      username: 'user',
      email: 'a@b.com',
      role: 'user',
      isBlocked: false
    });
    bcrypt.hash.mockResolvedValueOnce('hashed');
    jwt.sign.mockReturnValueOnce('access').mockReturnValueOnce('refresh');

    const res = createRes();
    await authController.register(
      { body: { name: 'Name', username: 'user', email: 'a@b.com', password: 'pass' } },
      res
    );

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.cookie).toHaveBeenCalled();
  });

  it('login rejects missing user', async () => {
    User.findOne.mockResolvedValueOnce(null);

    const res = createRes();
    await authController.login({ body: { email: 'a@b.com', password: 'pass' } }, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('login rejects blocked user', async () => {
    User.findOne.mockResolvedValueOnce({ isBlocked: true });

    const res = createRes();
    await authController.login({ body: { email: 'a@b.com', password: 'pass' } }, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('login rejects invalid password', async () => {
    User.findOne.mockResolvedValueOnce({ isBlocked: false, passwordHash: 'hash' });
    bcrypt.compare.mockResolvedValueOnce(false);

    const res = createRes();
    await authController.login({ body: { email: 'a@b.com', password: 'bad' } }, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('login succeeds and sets cookies', async () => {
    User.findOne.mockResolvedValueOnce({
      _id: 'u1',
      isBlocked: false,
      passwordHash: 'hash',
      name: 'Name',
      username: 'user',
      email: 'a@b.com',
      role: 'user'
    });
    bcrypt.compare.mockResolvedValueOnce(true);
    jwt.sign.mockReturnValueOnce('access').mockReturnValueOnce('refresh');

    const res = createRes();
    await authController.login({ body: { email: 'a@b.com', password: 'pass' } }, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.cookie).toHaveBeenCalledTimes(2);
  });

  it('loginWithGoogle requires token', async () => {
    const res = createRes();
    await authController.loginWithGoogle({ body: {} }, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('loginWithGoogle creates user on register', async () => {
    mockVerifyIdToken.mockResolvedValueOnce({
      getPayload: () => ({ email: 'a@b.com', name: 'Name', picture: 'pic' })
    });
    User.findOne.mockResolvedValueOnce(null);
    User.create.mockResolvedValueOnce({
      _id: 'u1',
      email: 'a@b.com',
      name: 'Name',
      username: 'name',
      role: 'user',
      isBlocked: false
    });
    jwt.sign.mockReturnValueOnce('access').mockReturnValueOnce('refresh');

    const res = createRes();
    await authController.loginWithGoogle({ body: { token: 't', isRegistering: true } }, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('loginWithGoogle rejects when not registering', async () => {
    mockVerifyIdToken.mockResolvedValueOnce({
      getPayload: () => ({ email: 'a@b.com', name: 'Name' })
    });
    User.findOne.mockResolvedValueOnce(null);

    const res = createRes();
    await authController.loginWithGoogle({ body: { token: 't', isRegistering: false } }, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('refreshToken rejects missing cookie', async () => {
    const res = createRes();
    await authController.refreshToken({ cookies: {} }, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('refreshToken returns access token', async () => {
    jwt.verify.mockReturnValueOnce({ sub: 'u1' });
    User.findById.mockResolvedValueOnce({ _id: 'u1', email: 'a@b.com', role: 'user' });
    jwt.sign.mockReturnValueOnce('access');

    const res = createRes();
    await authController.refreshToken({ cookies: { refreshToken: 'rt' } }, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('logout clears cookies', async () => {
    const res = createRes();
    await authController.logout({}, res);

    expect(res.clearCookie).toHaveBeenCalledTimes(2);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('requestPasswordReset returns 404 for unknown email', async () => {
    User.findOne.mockResolvedValueOnce(null);

    const res = createRes();
    await authController.requestPasswordReset({ body: { email: 'a@b.com' } }, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('requestPasswordReset sends email', async () => {
    const save = jest.fn();
    User.findOne.mockResolvedValueOnce({
      _id: 'u1',
      name: 'Name',
      username: 'user',
      email: 'a@b.com',
      save
    });

    const res = createRes();
    await authController.requestPasswordReset({ body: { email: 'a@b.com' } }, res);

    expect(save).toHaveBeenCalled();
    expect(sendEmail).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('resetPassword returns 400 for invalid token', async () => {
    User.findOne.mockResolvedValueOnce(null);

    const res = createRes();
    await authController.resetPassword({ body: { token: 't', password: 'pass' } }, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('resetPassword updates password', async () => {
    const save = jest.fn();
    User.findOne.mockResolvedValueOnce({
      _id: 'u1',
      save
    });
    bcrypt.hash.mockResolvedValueOnce('hashed');

    const res = createRes();
    await authController.resetPassword({ body: { token: 't', password: 'pass' } }, res);

    expect(save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('getHistory returns 401 without user', async () => {
    const res = createRes();
    await authController.getHistory({ user: null }, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('getHistory returns data', async () => {
    User.findById.mockReturnValueOnce(createPopulateUser({ attendedEvents: [1, 2, 3] }));

    const res = createRes();
    await authController.getHistory({ user: { sub: 'u1' } }, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('getAttending filters future events', async () => {
    User.findById.mockReturnValueOnce(createPopulateUser({
      attendedEvents: [
        { startDate: new Date(Date.now() - 1000) },
        { startDate: new Date(Date.now() + 1000) }
      ]
    }));

    const res = createRes();
    await authController.getAttending({ user: { sub: 'u1' } }, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0].data.length).toBe(1);
  });

  it('getRecommendations returns empty when no events', async () => {
    User.findById.mockReturnValueOnce(createPopulateUser({ attendedEvents: [] }));

    const res = createRes();
    await authController.getRecommendations({ user: { sub: 'u1' }, query: {} }, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('updateProfile returns 401 without user', async () => {
    const res = createRes();
    await authController.updateProfile({ user: null, body: {} }, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('updateProfile rejects wrong current password', async () => {
    User.findById.mockResolvedValueOnce({ passwordHash: 'hash' });
    bcrypt.compare.mockResolvedValueOnce(false);

    const res = createRes();
    await authController.updateProfile({
      user: { sub: 'u1' },
      body: { passwordChange: { currentPassword: 'bad', newPassword: 'new' } }
    }, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('updateProfile updates profile with password', async () => {
    User.findById.mockResolvedValueOnce({ passwordHash: 'hash' });
    bcrypt.compare.mockResolvedValueOnce(true);
    bcrypt.hash.mockResolvedValueOnce('newhash');
    User.findByIdAndUpdate.mockResolvedValueOnce({
      _id: 'u1',
      name: 'Name',
      email: 'a@b.com',
      username: 'user',
      avatarUrl: '',
      bio: '',
      location: '',
      interests: []
    });

    const res = createRes();
    await authController.updateProfile({
      user: { sub: 'u1' },
      body: { passwordChange: { currentPassword: 'old', newPassword: 'new' } }
    }, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('getProfile returns 401 without user', async () => {
    const res = createRes();
    await authController.getProfile({ user: null }, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('getProfile returns user', async () => {
    User.findById.mockResolvedValueOnce({
      _id: 'u1',
      name: 'Name',
      email: 'a@b.com',
      username: 'user',
      role: 'user',
      isBlocked: false,
      attendedEvents: [],
      savedEvents: []
    });

    const res = createRes();
    await authController.getProfile({ user: { sub: 'u1' } }, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('loginWithGoogle rejects blocked user', async () => {
    mockVerifyIdToken.mockResolvedValueOnce({
      getPayload: () => ({ email: 'a@b.com', name: 'Name' })
    });
    User.findOne.mockResolvedValueOnce({ isBlocked: true });

    const res = createRes();
    await authController.loginWithGoogle({ body: { token: 't', isRegistering: true } }, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('refreshToken rejects invalid token', async () => {
    jwt.verify.mockImplementationOnce(() => {
      throw new Error('invalid');
    });

    const res = createRes();
    await authController.refreshToken({ cookies: { refreshToken: 'rt' } }, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('getRecommendations returns interleaved results', async () => {
    const eventA = { _id: 'e1', category: 'C1', startDate: new Date(Date.now() + 1000) };
    const eventB = { _id: 'e2', category: 'C2', startDate: new Date(Date.now() + 2000) };
    User.findById.mockReturnValueOnce(createPopulateUser({ attendedEvents: [eventA, eventB] }));
    Event.find
      .mockReturnValueOnce({ sort: jest.fn().mockReturnThis(), limit: jest.fn().mockResolvedValue([eventA]) })
      .mockReturnValueOnce({ sort: jest.fn().mockReturnThis(), limit: jest.fn().mockResolvedValue([eventB]) });

    const res = createRes();
    await authController.getRecommendations({ user: { sub: 'u1' }, query: { limit: 2 } }, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0].data.length).toBeGreaterThan(0);
  });
});
