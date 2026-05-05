const User = require('../../models/User');
const Event = require('../../models/Event');

jest.mock('../../models/User', () => ({
  findById: jest.fn(),
  countDocuments: jest.fn()
}));

jest.mock('../../models/Event', () => ({
  find: jest.fn()
}));

const statsController = require('../../controllers/stats.controller');

function createRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('stats.controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('getGlobalStats returns category and day stats', async () => {
    Event.find.mockResolvedValueOnce([
      { category: 'M', startDate: new Date('2026-05-01') },
      { category: 'M', startDate: new Date('2026-05-02') }
    ]);

    const res = createRes();
    await statsController.getGlobalStats({}, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('getPersonalStats returns 404 when user missing', async () => {
    User.findById.mockReturnValueOnce({
      populate: jest.fn().mockResolvedValue(null)
    });

    const res = createRes();
    await statsController.getPersonalStats({ user: { sub: 'u1' } }, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('getSystemUserStats returns total users', async () => {
    User.countDocuments.mockResolvedValueOnce(10);

    const res = createRes();
    await statsController.getSystemUserStats({}, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(200);
  });
});
