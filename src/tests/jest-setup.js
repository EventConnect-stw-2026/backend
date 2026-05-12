/**
 * Aplicación: EventConnect - Plataforma de gestión de eventos
 * Archivo: jest-setup.js
 * Descripción: Script para configurar el entorno de pruebas.
 * Autor: Pablo Báscones, Mario Caudevilla, Mario Hernández y David Borrel
 */
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongoServer;

// Este script se ejecutará antes de que se inicien las pruebas, y se encargará de iniciar un servidor de MongoDB en memoria para proporcionar una base de datos aislada y rápida para las pruebas, además de configurar las variables de entorno necesarias para la aplicación durante las pruebas
module.exports = async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  process.env.MONGODB_URI = mongoUri;
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-secret-key-for-jwt-tokens';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key';
  process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
  
  console.log('✓ MongoMemoryServer iniciado en:', mongoUri);
  
  // Almacena el server en global para poder cerrarlo después
  global.__MONGO_SERVER__ = mongoServer;
};
