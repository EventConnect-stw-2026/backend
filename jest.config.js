/**
 * Aplicación: EventConnect - Plataforma de gestión de eventos
 * Archivo: jest.config.js
 * Descripción: Configuración de Jest para la suite de pruebas del backend.
 * Autor: Pablo Báscones, Mario Caudevilla, Mario Hernández y David Borrel
 */

module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/src/tests/jest-setup.js'],
  globalTeardown: '<rootDir>/src/tests/jest-teardown.js',
  testTimeout: 30000,
  detectOpenHandles: true,
  forceExit: true,
  testMatch: ['<rootDir>/src/tests/**/*.test.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/tests/**',
    '!src/server.js'
  ]
};
