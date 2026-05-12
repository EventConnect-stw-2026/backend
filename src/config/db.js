/**
 * Aplicación: EventConnect - Plataforma de gestión de eventos
 * Archivo: db.js
 * Descripción: Configuración de la conexión a MongoDB usando Mongoose.
 * Autor: Pablo Báscones, Mario Caudevilla, Mario Hernández y David Borrel
 */
const mongoose = require("mongoose");
const logger = require("../utils/logger");

// Función para conectar a MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info("MongoDB conectado");
  } catch (error) {
    logger.error("Error conectando a MongoDB", { error: error.message });
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
    throw error;
  }
};

module.exports = connectDB;