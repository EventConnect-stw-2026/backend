const cron = require('node-cron');
const importEvents = require('../../services/importEvents.service');
const updateExpiredEvents = require('../../services/eventStatus.service');
const deleteOldEvents = require('../../services/deleteOldEvents.service');

jest.mock('node-cron', () => ({
  schedule: jest.fn()
}));

jest.mock('../../services/importEvents.service', () => jest.fn());

jest.mock('../../services/eventStatus.service', () => jest.fn());

jest.mock('../../services/deleteOldEvents.service', () => jest.fn());

const { runSync, startEventSync } = require('../../jobs/syncEvents.job');

describe('syncEvents.job', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('runSync calls services', async () => {
    importEvents.mockResolvedValueOnce({ imported: 1, updated: 2 });
    updateExpiredEvents.mockResolvedValueOnce(3);
    deleteOldEvents.mockResolvedValueOnce(4);

    await runSync();

    expect(importEvents).toHaveBeenCalled();
    expect(updateExpiredEvents).toHaveBeenCalled();
    expect(deleteOldEvents).toHaveBeenCalled();
  });

  it('startEventSync schedules job', () => {
    startEventSync();
    expect(cron.schedule).toHaveBeenCalled();
  });
});
