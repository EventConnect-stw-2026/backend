const EventMessage = require('../../models/EventMessage');
const User = require('../../models/User');
const FriendRequest = require('../../models/FriendRequest');

jest.mock('../../models/EventMessage', () => ({
  find: jest.fn(),
  create: jest.fn()
}));

jest.mock('../../models/User', () => ({
  findById: jest.fn()
}));

jest.mock('../../models/FriendRequest', () => ({
  find: jest.fn()
}));

const controller = require('../../controllers/event-chat.controller');

function createRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('event-chat.controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('getEventMessages returns messages', async () => {
    EventMessage.find.mockReturnValueOnce({
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      populate: jest.fn().mockResolvedValue([{ _id: 'm1' }])
    });

    const res = createRes();
    await controller.getEventMessages({ params: { eventId: 'e1' } }, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('sendEventMessage validates content', async () => {
    const res = createRes();
    await controller.sendEventMessage({ params: { eventId: 'e1' }, user: { sub: 'u1' }, body: { content: '' } }, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('sendEventMessage returns 403 when not attending', async () => {
    User.findById.mockReturnValueOnce({
      select: jest.fn().mockResolvedValue({ attendedEvents: [] })
    });

    const res = createRes();
    await controller.sendEventMessage({ params: { eventId: 'e1' }, user: { sub: 'u1' }, body: { content: 'Hi' } }, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('getFriendsAttending returns empty list', async () => {
    FriendRequest.find.mockResolvedValueOnce([]);

    const res = createRes();
    await controller.getFriendsAttending({ params: { eventId: 'e1' }, user: { sub: 'u1' } }, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });
});
