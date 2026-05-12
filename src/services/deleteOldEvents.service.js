/**
 * Aplicación: EventConnect - Plataforma de gestión de eventos
 * Archivo: deleteOldEvents.service.js
 * Descripción: Servicio para eliminar eventos antiguos.
 * Autor: Pablo Báscones, Mario Caudevilla, Mario Hernández y David Borrel
 */

const Event = require("../models/Event");

async function deleteOldEvents() {

  const now = new Date();

  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  const result = await Event.deleteMany({
    status: "expired",
    expiredAt: { $lt: twelveMonthsAgo }
  });

  return result.deletedCount;

}

module.exports = deleteOldEvents;