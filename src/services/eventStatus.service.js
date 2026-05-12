/**
 * Aplicación: EventConnect - Plataforma de gestión de eventos
 * Archivo: eventStatus.service.js
 * Descripción: Servicio para actualizar el estado de los eventos.
 * Autor: Pablo Báscones, Mario Caudevilla, Mario Hernández y David Borrel
 */

const Event = require("../models/Event");

async function updateExpiredEvents() {

  const now = new Date();

  const result = await Event.updateMany(
    {
      endDate: { $lt: now },
      status: "active"
    },
    {
      $set: {
        status: "expired",
        expiredAt: now
      }
    }
  );

  return result.modifiedCount;

}

module.exports = updateExpiredEvents;