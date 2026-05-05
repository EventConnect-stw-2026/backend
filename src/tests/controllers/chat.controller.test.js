const mongoose = require('mongoose');
const User = require('../../models/User');
const FriendRequest = require('../../models/FriendRequest');
const Conversation = require('../../models/Conversation');
const Message = require('../../models/Message');

jest.mock('mongoose', () => ({
  Types: { ObjectId: { isValid: jest.fn() } }
}));

jest.mock('../../models/User', () => ({
  findById: jest.fn()
}));

jest.mock('../../models/FriendRequest', () => ({
  findOne: jest.fn()
}));

jest.mock('../../models/Conversation', () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
  find: jest.fn()
}));

jest.mock('../../models/Message', () => ({
  countDocuments: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
  updateMany: jest.fn()
}));

const controller = require('../../controllers/chat.controller');

function createRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('chat.controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('createOrGetConversation returns 400 on missing data', async () => {
    const res = createRes();
    await controller.createOrGetConversation({ user: {}, params: {} }, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('createOrGetConversation returns 400 on invalid ids', async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValueOnce(false);

    const res = createRes();
    await controller.createOrGetConversation({ user: { sub: 'u1' }, params: { friendId: 'f1' } }, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('createOrGetConversation returns 404 if user missing', async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(true);
    User.findById.mockResolvedValueOnce(null);
    User.findById.mockResolvedValueOnce({ _id: 'f1' });

    const res = createRes();
    await controller.createOrGetConversation({ user: { sub: 'u1' }, params: { friendId: 'f1' } }, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('createOrGetConversation returns existing conversation', async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(true);
    User.findById.mockResolvedValueOnce({ _id: 'u1' });
    User.findById.mockResolvedValueOnce({ _id: 'f1' });
    FriendRequest.findOne.mockResolvedValueOnce({});

    Conversation.findOne.mockReturnValueOnce({
      populate: jest.fn().mockResolvedValue({
        _id: 'c1',
        participants: [{ _id: 'u1' }, { _id: 'f1' }],
        lastMessage: '',
        lastMessageAt: null
      })
    });

    const res = createRes();
    await controller.createOrGetConversation({ user: { sub: 'u1' }, params: { friendId: 'f1' } }, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('getMyConversations returns 401 without user', async () => {
    const res = createRes();
    await controller.getMyConversations({ user: null }, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('getMyConversations returns list', async () => {
    Conversation.find.mockReturnValueOnce({
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockResolvedValue([
        { _id: 'c1', participants: [{ _id: 'u1' }, { _id: 'u2' }] }
      ])
    });
    Message.countDocuments.mockResolvedValueOnce(1);

    const res = createRes();
    await controller.getMyConversations({ user: { sub: 'u1' } }, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('getConversationMessages returns 400 for invalid id', async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValueOnce(false);

    const res = createRes();
    await controller.getConversationMessages({ user: { sub: 'u1' }, params: { conversationId: 'c1' } }, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('sendMessage returns 400 on empty content', async () => {
    const res = createRes();
    await controller.sendMessage({ user: { sub: 'u1' }, params: { conversationId: 'c1' }, body: { content: '' } }, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('sendMessage sends message when allowed', async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValueOnce(true);
    const save = jest.fn();
    Conversation.findById.mockResolvedValueOnce({
      _id: 'c1',
      participants: ['u1', 'u2'],
      save
    });
    FriendRequest.findOne.mockResolvedValueOnce({});
    Message.create.mockResolvedValueOnce({ _id: 'm1' });
    Message.findById.mockReturnValueOnce({
      populate: jest.fn().mockReturnThis()
    });

    const res = createRes();
    await controller.sendMessage({
      user: { sub: 'u1' },
      params: { conversationId: 'c1' },
      body: { content: 'Hola' }
    }, res);

    expect(save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('getConversationMessages returns messages', async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValueOnce(true);
    Conversation.findById.mockReturnValueOnce({
      populate: jest.fn().mockResolvedValue({
        _id: 'c1',
        participants: [{ _id: 'u1' }, { _id: 'u2' }]
      })
    });
    Message.find.mockReturnValueOnce({
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockResolvedValue([{ _id: 'm1' }])
    });

    const res = createRes();
    await controller.getConversationMessages({
      user: { sub: 'u1' },
      params: { conversationId: 'c1' }
    }, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('markConversationAsRead updates messages', async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValueOnce(true);
    Conversation.findById.mockResolvedValueOnce({
      participants: ['u1', 'u2']
    });
    Message.updateMany.mockResolvedValueOnce({ modifiedCount: 2 });

    const res = createRes();
    await controller.markConversationAsRead({ user: { sub: 'u1' }, params: { conversationId: 'c1' } }, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('getUnreadCountsByFriend returns counts', async () => {
    Conversation.find.mockReturnValueOnce({
      populate: jest.fn().mockResolvedValue([
        { _id: 'c1', participants: [{ _id: 'u1' }, { _id: 'u2' }] }
      ])
    });
    Message.countDocuments.mockResolvedValueOnce(3);

    const res = createRes();
    await controller.getUnreadCountsByFriend({ user: { sub: 'u1' } }, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });
});
