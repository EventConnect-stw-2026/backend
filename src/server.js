/**
 * Aplicación: EventConnect - Plataforma de gestión de eventos
 * Archivo: server.js
 * Descripción: Punto de entrada del servidor Express, encargado de conectar a la base de datos, iniciar el servidor y programar tareas periódicas.
 * Autor: Pablo Báscones, Mario Caudevilla, Mario Hernández y David Borrel
 */
require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db");
const logger = require("./utils/logger");

const { startEventSync } = require("./jobs/syncEvents.job");


const PORT = process.env.PORT || 3000;

  const startServer = async () => {
    await connectDB();

    // Import automático solo si la BD está vacía
    await autoImport();

    app.listen(PORT, () => {
      logger.info(`Servidor escuchando en http://localhost:${PORT}`);
    });

    startEventSync();
  };

  async function autoImport() {
    try {
      const Event = require('./models/Event');
      const count = await Event.countDocuments();
      if (count === 0) {
        logger.info('BD vacía — importando eventos de Zaragoza...');
        const importEvents = require('./services/importEvents.service');
        const result = await importEvents();
        logger.info('Import completado', { imported: result.imported, updated: result.updated });
      } else {
        logger.info(`BD ya tiene ${count} eventos — saltando import automático`);
      }
    } catch (err) {
      logger.error('Error en import automático', { error: err.message });
      // No lanzamos el error para que el servidor arranque igualmente
    }
  }

startServer();