const mongoose = require('mongoose');
const Meetup = require('../../models/Meetup');
const Event = require('../../models/Event');
const User = require('../../models/User');
const FriendRequest = require('../../models/FriendRequest');

jest.mock('mongoose', () => ({
  Types: { ObjectId: { isValid: jest.fn() } }
}));

jest.mock('../../models/Meetup', () => ({
  create: jest.fn(),
  findById: jest.fn(),
  find: jest.fn(),
  countDocuments: jest.fn()
}));

jest.mock('../../models/Event', () => ({
  findById: jest.fn()
}));

jest.mock('../../models/User', () => ({
  findById: jest.fn()
}));

jest.mock('../../models/FriendRequest', () => ({
  findOne: jest.fn()
}));

const controller = require('../../controllers/meetup.controller');

function createRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('meetup.controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('createMeetup validates input', async () => {
    const res = createRes();
    await controller.createMeetup({ user: { sub: 'u1' }, body: {} }, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('createMeetup rejects invalid eventId', async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValueOnce(false);

    const res = createRes();
    await controller.createMeetup({ user: { sub: 'u1' }, body: { eventId: 'e1', friendIds: ['u2'], meetupDateTime: '2026-01-01', meetupPlace: 'A' } }, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('createMeetup returns 404 if event missing', async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(true);
    Event.findById.mockResolvedValueOnce(null);
    User.findById.mockResolvedValueOnce({ _id: 'u1' });

    const res = createRes();
    await controller.createMeetup({ user: { sub: 'u1' }, body: { eventId: 'e1', friendIds: ['u2'], meetupDateTime: '2026-01-01', meetupPlace: 'A' } }, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('createMeetup creates meetup', async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(true);
    Event.findById.mockResolvedValueOnce({ _id: 'e1' });
    User.findById.mockResolvedValueOnce({ _id: 'u1' });
    FriendRequest.findOne
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({});

    Meetup.create.mockResolvedValueOnce({ _id: 'm1' });
    Meetup.findById.mockReturnValueOnce({
      populate: jest.fn().mockReturnThis()
    });

    const res = createRes();
    await controller.createMeetup({
      user: { sub: 'u1' },
      body: { eventId: 'e1', friendIds: ['u2', 'u3'], meetupDateTime: '2026-01-01', meetupPlace: 'Plaza' }
    }, res);

    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('respondToMeetup rejects invalid response', async () => {
    const res = createRes();
    await controller.respondToMeetup({ user: { sub: 'u1' }, params: { meetupId: 'm1' }, body: { response: 'maybe' } }, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('respondToMeetup accepts response', async () => {
    const save = jest.fn();
    Meetup.findById.mockResolvedValueOnce({
      status: 'active',
      participants: [{ user: { toString: () => 'u1' } }],
      save
    });
    Meetup.findById.mockReturnValueOnce({
      populate: jest.fn().mockReturnThis()
    });

    const res = createRes();
    await controller.respondToMeetup({
      user: { sub: 'u1' },
      params: { meetupId: 'm1' },
      body: { response: 'accepted' }
    }, res);

    expect(save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('cancelMeetup returns 404 when missing', async () => {
    Meetup.findById.mockResolvedValueOnce(null);

    const res = createRes();
    await controller.cancelMeetup({ user: { sub: 'u1' }, params: { meetupId: 'm1' } }, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('cancelMeetup cancels meetup', async () => {
    const save = jest.fn();
    Meetup.findById.mockResolvedValueOnce({
      organizer: { toString: () => 'u1' },
      status: 'active',
      save
    });

    const res = createRes();
    await controller.cancelMeetup({ user: { sub: 'u1' }, params: { meetupId: 'm1' } }, res);

    expect(save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('getOrganizedMeetups returns list', async () => {
    Meetup.find.mockReturnValueOnce({
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockResolvedValue([{ _id: 'm1' }])
    });

    const res = createRes();
    await controller.getOrganizedMeetups({ user: { sub: 'u1' } }, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('getInvitedMeetups returns list', async () => {
    Meetup.find.mockReturnValueOnce({
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockResolvedValue([{ _id: 'm2' }])
    });

    const res = createRes();
    await controller.getInvitedMeetups({ user: { sub: 'u1' } }, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('getPendingMeetupInvitationsCount returns count', async () => {
    Meetup.countDocuments.mockResolvedValueOnce(2);

    const res = createRes();
    await controller.getPendingMeetupInvitationsCount({ user: { sub: 'u1' } }, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });
});
