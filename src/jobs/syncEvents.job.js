/**
 * Aplicación: EventConnect - Plataforma de gestión de eventos
 * Archivo: syncEvents.job.js
 * Descripción: Tarea programada para sincronizar eventos de Zaragoza cada 6 horas.
 * Autor: Pablo Báscones, Mario Caudevilla, Mario Hernández y David Borrel
 */
const cron = require("node-cron");

const importEvents = require("../services/importEvents.service");
const updateExpiredEvents = require("../services/eventStatus.service");
const deleteOldEvents = require("../services/deleteOldEvents.service");
const logger = require("../utils/logger");

// Función para ejecutar la sincronización de eventos con Zaragoza
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

// Función para programar la tarea de sincronización cada 6 horas
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