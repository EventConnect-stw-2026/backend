/**
 * Aplicación: EventConnect - Plataforma de gestión de eventos
 * Archivo: jest-teardown.js
 * Descripción: Script para limpiar los recursos después de ejecutar las pruebas.
 * Autor: Pablo Báscones, Mario Caudevilla, Mario Hernández y David Borrel
 */
const mongoose = require('mongoose');

// Este script se ejecutará después de que todas las pruebas hayan terminado, y se encargará de cerrar la conexión a la base de datos y detener el servidor en memoria utilizado para las pruebas, asegurando que no queden recursos abiertos que puedan afectar a otras pruebas o al entorno de desarrollo
module.exports = async () => {
  // Cierra la conexión de Mongoose
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
  
  // Detiene el servidor en memoria
  if (global.__MONGO_SERVER__) {
    await global.__MONGO_SERVER__.stop();
    console.log('✓ MongoMemoryServer detenido');
  }
};
