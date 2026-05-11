const cron = require("node-cron");

const importEvents = require("../services/importEvents.service");
const updateExpiredEvents = require("../services/eventStatus.service");
const deleteOldEvents = require("../services/deleteOldEvents.service");
const logger = require("../utils/logger");

async function runSync() {

  logger.info('Starting Zaragoza sync');

  const importResult = await importEvents();

  const expiredCount = await updateExpiredEvents();

  const deletedCount = await deleteOldEvents();

  logger.info('Sync finished', {
    imported: importResult.imported,
    updated: importResult.updated,
    expiredUpdated: expiredCount,
    deleted: deletedCount
  });

}

function startEventSync() {

  cron.schedule("0 */6 * * *", async () => {

    try {
      await runSync();
    } catch (err) {
      logger.error('Sync error', { error: err });
    }

  });

  logger.info('Event sync scheduled (every 6 hours)');

}

module.exports = {
  runSync,
  startEventSync
};