const mongoose = require('mongoose');
const Report = require('../../models/Report');
const User = require('../../models/User');
const Event = require('../../models/Event');
const Settings = require('../../models/Settings');
const bcrypt = require('bcryptjs');

jest.mock('mongoose', () => ({
  connect: jest.fn()
}));

jest.mock('../../models/Report', () => ({
  deleteMany: jest.fn(),
  insertMany: jest.fn()
}));

jest.mock('../../models/User', () => ({
  find: jest.fn(),
  deleteMany: jest.fn(),
  insertMany: jest.fn()
}));

jest.mock('../../models/Event', () => ({
  find: jest.fn()
}));

jest.mock('../../models/Settings', () => ({
  deleteMany: jest.fn(),
  create: jest.fn()
}));

jest.mock('bcryptjs', () => ({
  genSalt: jest.fn(),
  hash: jest.fn()
}));

describe('seed scripts', () => {
  let exitSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
  });

  afterEach(() => {
    exitSpy.mockRestore();
  });

  it('seedReports inserts reports when users exist', async () => {
    let userModel;
    let eventModel;
    let reportModel;

    jest.isolateModules(() => {
      userModel = require('../../models/User');
      eventModel = require('../../models/Event');
      reportModel = require('../../models/Report');
      userModel.find.mockReturnValueOnce({
        limit: jest.fn().mockResolvedValue([
          { _id: 'u1' },
          { _id: 'u2' },
          { _id: 'u3' }
        ])
      });
      eventModel.find.mockReturnValueOnce({
        limit: jest.fn().mockResolvedValue([
          { _id: 'e1' },
          { _id: 'e2' }
        ])
      });
      reportModel.deleteMany.mockResolvedValueOnce({});
      reportModel.insertMany.mockResolvedValueOnce({});
      require('../../utils/seedReports');
    });

    await new Promise((resolve) => setImmediate(resolve));
    expect(reportModel.deleteMany).toHaveBeenCalled();
    expect(reportModel.insertMany).toHaveBeenCalled();
    expect(process.exit).toHaveBeenCalled();
  });

  it('seedSettings inserts initial settings', async () => {
    let settingsModel;

    jest.isolateModules(() => {
      settingsModel = require('../../models/Settings');
      settingsModel.deleteMany.mockResolvedValueOnce({});
      settingsModel.create.mockResolvedValueOnce({});
      require('../../utils/seedSettings');
    });

    await new Promise((resolve) => setImmediate(resolve));
    expect(settingsModel.deleteMany).toHaveBeenCalled();
    expect(settingsModel.create).toHaveBeenCalled();
    expect(process.exit).toHaveBeenCalled();
  });

  it('seedUsers inserts hashed users', async () => {
    let userModel;
    let bcryptModule;

    jest.isolateModules(() => {
      userModel = require('../../models/User');
      bcryptModule = require('bcryptjs');
      userModel.deleteMany.mockResolvedValueOnce({});
      bcryptModule.genSalt.mockResolvedValue('salt');
      bcryptModule.hash.mockResolvedValue('hash');
      userModel.insertMany.mockResolvedValueOnce({});
      require('../../utils/seedUsers');
    });

    await new Promise((resolve) => setImmediate(resolve));
    expect(userModel.deleteMany).toHaveBeenCalled();
    expect(userModel.insertMany).toHaveBeenCalled();
    expect(process.exit).toHaveBeenCalled();
  });
});
