const Event = require("../models/Event");
const Zaragoza = require("./zaragoza.service");
const mapEvent = require("../models/eventMapper");
const logger = require("../utils/logger");

async function importEvents() {
  let start = 0;
  const rows = 50;
  let total = 1;
  let imported = 0;
  let updated = 0;

  try {
    while (start < total) {
      logger.info('[IMPORT] Fetching events', { start, rows });

      const data = await Zaragoza.getEvents(start, rows);

      // 🔴 VALIDACIÓN CRÍTICA
      if (!data || !Array.isArray(data.result)) {
        throw new Error("Invalid response from Zaragoza API");
      }

      total = data.totalCount || 0;

      for (const rawEvent of data.result) {
        try {
          const mapped = mapEvent(rawEvent);

          if (!mapped || !mapped.externalId) {
            logger.warn('[IMPORT] Evento inválido, se omite');
            continue;
          }

          const existing = await Event.findOne({
            externalId: mapped.externalId
          });

          if (!existing) {
            await Event.create({
              ...mapped,
              status: "active"
            });
            imported++;
          } else {
            await Event.updateOne(
              { externalId: mapped.externalId },
              {
                $set: {
                  ...mapped,
                  status: "active",
                  expiredAt: null
                }
              }
            );
            updated++;
          }

        } catch (eventError) {
          logger.error('[IMPORT] Error procesando evento', { error: eventError.message });
        }
      }

      start += rows;
    }

    logger.info('[IMPORT] DONE', { imported, updated });

    return {
      imported,
      updated
    };

  } catch (err) {
    logger.error('[IMPORT] FATAL ERROR', { error: err.message });
    throw err; // importante: que el controller lo capture
  }
}

module.exports = importEvents;