const User = require('../../models/User');
const FriendRequest = require('../../models/FriendRequest');

jest.mock('../../models/User', () => ({
  findById: jest.fn(),
  find: jest.fn()
}));

jest.mock('../../models/FriendRequest', () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
  find: jest.fn(),
  findByIdAndDelete: jest.fn()
}));

const controller = require('../../controllers/friends.controller');

function createRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('friends.controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sendFriendRequest validates data', async () => {
    const res = createRes();
    await controller.sendFriendRequest({ user: { sub: 'u1' }, body: {} }, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('sendFriendRequest rejects existing request', async () => {
    User.findById.mockResolvedValueOnce({ _id: 'u1' });
    User.findById.mockResolvedValueOnce({ _id: 'u2' });
    FriendRequest.findOne.mockResolvedValueOnce({ _id: 'r1' });

    const res = createRes();
    await controller.sendFriendRequest({ user: { sub: 'u1' }, body: { friendId: 'u2' } }, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('sendFriendRequest creates request', async () => {
    User.findById.mockResolvedValueOnce({ _id: 'u1' });
    User.findById.mockResolvedValueOnce({ _id: 'u2' });
    FriendRequest.findOne.mockResolvedValueOnce(null);
    FriendRequest.create.mockResolvedValueOnce({ _id: 'r1' });

    const res = createRes();
    await controller.sendFriendRequest({ user: { sub: 'u1' }, body: { friendId: 'u2' } }, res);

    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('acceptFriendRequest returns 404 when missing', async () => {
    FriendRequest.findById.mockResolvedValueOnce(null);

    const res = createRes();
    await controller.acceptFriendRequest({ user: { sub: 'u1' }, params: { requestId: 'r1' } }, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('acceptFriendRequest accepts pending request', async () => {
    const save = jest.fn();
    FriendRequest.findById.mockResolvedValueOnce({
      toUser: { toString: () => 'u1' },
      status: 'pending',
      save
    });

    const res = createRes();
    await controller.acceptFriendRequest({ user: { sub: 'u1' }, params: { requestId: 'r1' } }, res);

    expect(save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('rejectFriendRequest returns 403 when not owner', async () => {
    FriendRequest.findById.mockResolvedValueOnce({ toUser: 'u2', status: 'pending' });

    const res = createRes();
    await controller.rejectFriendRequest({ user: { sub: 'u1' }, params: { requestId: 'r1' } }, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('rejectFriendRequest rejects pending request', async () => {
    const save = jest.fn();
    FriendRequest.findById.mockResolvedValueOnce({
      toUser: { toString: () => 'u1' },
      status: 'pending',
      save
    });

    const res = createRes();
    await controller.rejectFriendRequest({ user: { sub: 'u1' }, params: { requestId: 'r1' } }, res);

    expect(save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('getPendingRequests returns list', async () => {
    FriendRequest.find.mockReturnValueOnce({
      populate: jest.fn().mockResolvedValue([{ _id: 'r1' }])
    });

    const res = createRes();
    await controller.getPendingRequests({ user: { sub: 'u1' } }, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('getFriends returns friends list', async () => {
    FriendRequest.find.mockReturnValueOnce({
      populate: jest.fn().mockResolvedValue([
        { fromUser: { _id: 'u1' }, toUser: { _id: 'u2' } }
      ])
    });

    const res = createRes();
    await controller.getFriends({ user: { sub: 'u1' } }, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('removeFriend returns 404 when not friends', async () => {
    FriendRequest.findOne.mockResolvedValueOnce(null);

    const res = createRes();
    await controller.removeFriend({ user: { sub: 'u1' }, params: { friendId: 'u2' } }, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('removeFriend deletes friend request', async () => {
    FriendRequest.findOne.mockResolvedValueOnce({ _id: 'r1' });
    FriendRequest.findByIdAndDelete.mockResolvedValueOnce({});

    const res = createRes();
    await controller.removeFriend({ user: { sub: 'u1' }, params: { friendId: 'u2' } }, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('getSuggestedFriends returns suggestions', async () => {
    FriendRequest.find
      .mockResolvedValueOnce([{ fromUser: 'u1', toUser: 'u2', status: 'accepted' }])
      .mockResolvedValueOnce([{ fromUser: 'u1', toUser: 'u3', status: 'pending' }])
      .mockReturnValueOnce({
        populate: jest.fn().mockResolvedValue([
          {
            fromUser: { _id: 'u2', name: 'A', toObject() { return this; } },
            toUser: { _id: 'u4', name: 'B', toObject() { return this; } },
            status: 'accepted'
          }
        ])
      });

    const res = createRes();
    await controller.getSuggestedFriends({ user: { sub: 'u1' } }, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('getSearchableUsers returns users list', async () => {
    User.find.mockResolvedValueOnce([{ _id: 'u2' }]);

    const res = createRes();
    await controller.getSearchableUsers({ user: { sub: 'u1' } }, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('getUsersBySearch returns list', async () => {
    User.find.mockReturnValueOnce({
      limit: jest.fn().mockResolvedValue([{ _id: 'u2' }])
    });

    const res = createRes();
    await controller.getUsersBySearch({ user: { sub: 'u1' }, query: { q: 'a' } }, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('getSentRequests returns list', async () => {
    FriendRequest.find.mockReturnValueOnce({
      populate: jest.fn().mockResolvedValue([{ _id: 'r1' }])
    });

    const res = createRes();
    await controller.getSentRequests({ user: { sub: 'u1' } }, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });
});
