jest.mock('../../models/User', () => {
  const model = jest.fn();
  model.find = jest.fn();
  model.findById = jest.fn();
  model.findByIdAndUpdate = jest.fn();
  model.findByIdAndDelete = jest.fn();
  model.countDocuments = jest.fn();
  return model;
});

jest.mock('../../models/Event', () => {
  const model = jest.fn();
  model.find = jest.fn();
  model.findById = jest.fn();
  model.findOne = jest.fn();
  model.findByIdAndDelete = jest.fn();
  model.countDocuments = jest.fn();
  return model;
});

jest.mock('../../models/Report', () => {
  const model = jest.fn();
  model.find = jest.fn();
  model.findById = jest.fn();
  model.findByIdAndUpdate = jest.fn();
  model.countDocuments = jest.fn();
  model.deleteMany = jest.fn();
  return model;
});

jest.mock('../../models/Settings', () => {
  const model = jest.fn();
  model.findOne = jest.fn();
  model.create = jest.fn();
  return model;
});

jest.mock('../../models/Conversation', () => ({
  deleteMany: jest.fn()
}));

jest.mock('../../models/Message', () => ({
  deleteMany: jest.fn()
}));

jest.mock('../../models/FriendRequest', () => ({
  deleteMany: jest.fn()
}));

const User = require('../../models/User');
const Event = require('../../models/Event');
const Report = require('../../models/Report');
const Settings = require('../../models/Settings');
const Conversation = require('../../models/Conversation');
const Message = require('../../models/Message');
const FriendRequest = require('../../models/FriendRequest');

const adminController = require('../../controllers/admin.controller');

function createRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

function createPopulateQuery(result) {
  const query = {
    populate: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    then: (resolve) => Promise.resolve(result).then(resolve)
  };
  return query;
}

describe('admin.controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('getDashboard returns stats and activity', async () => {
    User.countDocuments
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(4);
    Event.countDocuments
      .mockResolvedValueOnce(6)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(4)
      .mockResolvedValueOnce(5)
      .mockResolvedValueOnce(6)
      .mockResolvedValueOnce(7)
      .mockResolvedValueOnce(8)
      .mockResolvedValueOnce(9);

    const upcomingEvents = [
      { _id: 'e1', title: 'Event 1', startDate: new Date(), status: 'active' }
    ];
    Event.find.mockReturnValueOnce({
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      select: jest.fn().mockResolvedValue(upcomingEvents)
    });

    const req = {};
    const res = createRes();

    await adminController.getDashboard(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        stats: expect.objectContaining({ totalUsers: 10, activeEvents: 6 })
      })
    );
  });

  it('getUsers maps users', async () => {
    User.find.mockReturnValueOnce({
      sort: jest.fn().mockReturnThis(),
      select: jest.fn().mockResolvedValue([
        { _id: 'u1', name: 'Name', email: 'a@b.com', role: 'user', isBlocked: false, createdAt: new Date() }
      ])
    });

    const res = createRes();
    await adminController.getUsers({}, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0].users[0]).toHaveProperty('id', 'u1');
  });

  it('getEvents maps events', async () => {
    Event.find.mockReturnValueOnce({
      sort: jest.fn().mockReturnThis(),
      select: jest.fn().mockResolvedValue([
        { _id: 'e1', title: 'Title', description: 'Desc', category: 'Cat', startDate: new Date(), status: 'active', enrolled: 2 }
      ])
    });

    const res = createRes();
    await adminController.getEvents({}, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0].events[0]).toHaveProperty('id', 'e1');
  });

  it('getEventDetail returns 404 when missing', async () => {
    Event.findById.mockReturnValueOnce(createPopulateQuery(null));

    const res = createRes();
    await adminController.getEventDetail({ params: { id: 'e1' } }, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('createEvent validates required fields', async () => {
    const res = createRes();
    await adminController.createEvent({ body: { title: 'T' } }, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('createEvent creates event', async () => {
    const save = jest.fn();
    Event.mockImplementationOnce(() => ({
      _id: 'e1',
      title: 'T',
      category: 'C',
      status: 'active',
      save
    }));

    const req = {
      body: {
        title: 'T',
        description: 'D',
        category: 'C',
        location: 'L'
      }
    };
    const res = createRes();

    await adminController.createEvent(req, res);

    expect(save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('updateEvent returns 404 when missing', async () => {
    Event.findOne.mockResolvedValueOnce(null);

    const res = createRes();
    await adminController.updateEvent({ params: { id: 'e1' }, body: {} }, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('updateEvent updates fields', async () => {
    const save = jest.fn();
    Event.findOne.mockResolvedValueOnce({
      _id: 'e1',
      title: 'Old',
      description: 'Old',
      category: 'Old',
      startDate: null,
      endDate: null,
      locationName: 'Old',
      status: 'active',
      isFree: true,
      save
    });

    const req = {
      params: { id: 'e1' },
      body: { title: 'New', description: 'New', category: 'New', location: 'Loc', status: 'pending', isFree: false }
    };
    const res = createRes();

    await adminController.updateEvent(req, res);

    expect(save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('deleteEvent returns 404 when missing', async () => {
    Event.findById.mockResolvedValueOnce(null);

    const res = createRes();
    await adminController.deleteEvent({ params: { id: 'e1' } }, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('deleteEvent removes event', async () => {
    Event.findById.mockResolvedValueOnce({ _id: 'e1' });
    Event.findByIdAndDelete.mockResolvedValueOnce({ _id: 'e1' });

    const res = createRes();
    await adminController.deleteEvent({ params: { id: 'e1' } }, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('getReportsSummary returns counts', async () => {
    Report.countDocuments
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(4)
      .mockResolvedValueOnce(3);

    const res = createRes();
    await adminController.getReportsSummary({}, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('getReports maps reports', async () => {
    Report.find.mockReturnValueOnce({
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      select: jest.fn().mockResolvedValue([
        {
          _id: 'r1',
          type: 'comment',
          involvedUser: { name: 'Name', username: 'uname' },
          reportedBy: { name: 'Reporter', username: 'rep' },
          description: 'Desc',
          reason: 'spam',
          category: 'Contenido',
          status: 'open',
          createdAt: new Date()
        }
      ])
    });

    const res = createRes();
    await adminController.getReports({ query: {} }, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0].reports[0]).toHaveProperty('id', 'r1');
  });

  it('getReportDetail returns 404 when missing', async () => {
    Report.findById.mockReturnValueOnce(createPopulateQuery(null));

    const res = createRes();
    await adminController.getReportDetail({ params: { id: 'r1' } }, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('resolveReport updates status and bans user', async () => {
    const save = jest.fn();
    Report.findById.mockResolvedValueOnce({
      _id: 'r1',
      involvedUser: 'u1',
      save
    });
    User.findByIdAndUpdate.mockResolvedValueOnce({ _id: 'u1' });

    const req = { params: { id: 'r1' }, body: { action: 'ban' }, user: { _id: 'admin' } };
    const res = createRes();

    await adminController.resolveReport(req, res);

    expect(save).toHaveBeenCalled();
    expect(User.findByIdAndUpdate).toHaveBeenCalledWith('u1', { isBlocked: true });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('rejectReport returns 404 when missing', async () => {
    Report.findById.mockResolvedValueOnce(null);

    const res = createRes();
    await adminController.rejectReport({ params: { id: 'r1' }, body: {}, user: { _id: 'admin' } }, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('markReportUnderReview returns 404 when missing', async () => {
    Report.findByIdAndUpdate.mockResolvedValueOnce(null);

    const res = createRes();
    await adminController.markReportUnderReview({ params: { id: 'r1' } }, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('getSettings creates settings when missing', async () => {
    Settings.findOne.mockResolvedValueOnce(null);
    Settings.create.mockResolvedValueOnce({
      appName: 'App',
      description: 'Desc',
      contactEmail: 'a@b.com',
      contactPhone: '1',
      timezone: 'UTC',
      defaultLanguage: 'es',
      moderation: {},
      notifications: {},
      backup: {},
      maintenance: {}
    });

    const res = createRes();
    await adminController.getSettings({}, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('updateGeneralSettings updates fields', async () => {
    const save = jest.fn();
    Settings.findOne.mockResolvedValueOnce({
      appName: 'App',
      description: 'Desc',
      contactEmail: 'a@b.com',
      contactPhone: '1',
      timezone: 'UTC',
      defaultLanguage: 'es',
      save
    });

    const res = createRes();
    await adminController.updateGeneralSettings({ body: { appName: 'New' } }, res);

    expect(save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('updateModerationSettings updates moderation', async () => {
    const save = jest.fn();
    Settings.findOne.mockResolvedValueOnce({
      moderation: {
        requireEventApproval: false,
        autoDetectWords: false,
        autoBanAfterReports: false,
        notifyModeratorsOnReports: false,
        bannedWords: []
      },
      save
    });

    const res = createRes();
    await adminController.updateModerationSettings({ body: { bannedWords: 'a,b' } }, res);

    expect(save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('updateNotificationSettings updates notifications', async () => {
    const save = jest.fn();
    Settings.findOne.mockResolvedValueOnce({
      notifications: {
        notifyReportedUsers: false,
        notifyFlaggedContent: false,
        weeklySummary: false,
        systemAlerts: false
      },
      save
    });

    const res = createRes();
    await adminController.updateNotificationSettings({ body: { weeklySummary: true } }, res);

    expect(save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('getSystemStatus returns status', async () => {
    Settings.findOne.mockResolvedValueOnce({
      maintenance: {},
      backup: { frequency: 'daily' }
    });
    User.countDocuments.mockResolvedValueOnce(10);
    Event.countDocuments.mockResolvedValueOnce(5);

    const res = createRes();
    await adminController.getSystemStatus({}, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('clearCache returns ok', async () => {
    const res = createRes();
    await adminController.clearCache({}, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('optimizeDatabase updates maintenance', async () => {
    const save = jest.fn();
    Settings.findOne.mockResolvedValueOnce({ maintenance: {}, save });

    const res = createRes();
    await adminController.optimizeDatabase({}, res);

    expect(save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('downloadBackup returns response', async () => {
    const res = createRes();
    await adminController.downloadBackup({}, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('blockUser prevents blocking admins', async () => {
    const save = jest.fn();
    User.findById.mockResolvedValueOnce({ _id: 'u1', role: 'admin', isBlocked: false, save });

    const res = createRes();
    await adminController.blockUser({ params: { id: 'u1' } }, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('unblockUser unblocks', async () => {
    const save = jest.fn();
    User.findById.mockResolvedValueOnce({ _id: 'u1', role: 'user', isBlocked: true, save });

    const res = createRes();
    await adminController.unblockUser({ params: { id: 'u1' } }, res);

    expect(save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('deleteUser removes references', async () => {
    User.findById.mockResolvedValueOnce({ _id: 'u1', role: 'user' });
    Conversation.deleteMany.mockResolvedValueOnce({});
    Message.deleteMany.mockResolvedValueOnce({});
    Report.deleteMany.mockResolvedValueOnce({});
    Report.deleteMany.mockResolvedValueOnce({});
    FriendRequest.deleteMany.mockResolvedValueOnce({});
    User.findByIdAndDelete.mockResolvedValueOnce({});

    const res = createRes();
    await adminController.deleteUser({ params: { id: 'u1' } }, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });
});
