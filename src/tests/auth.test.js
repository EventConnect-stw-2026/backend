/**
 * Aplicación: EventConnect - Plataforma de gestión de eventos
 * Archivo: auth.test.js
 * Descripción: Pruebas para el controlador de autenticación.
 * Autor: Pablo Báscones, Mario Caudevilla, Mario Hernández y David Borrel
 */

require('dotenv').config();
const request = require('supertest');
const app = require('../app');
const mongoose = require('mongoose');
const User = require('../models/User');
const connectDB = require('../config/db');

describe('Auth Controller', () => {
  let server;
  beforeAll(async () => {
    try {
      await connectDB();
    } catch (error) {
      console.error('Error en connectDB durante beforeAll:', error.message);
      // Continúa de todas formas para permitir que el test falle apropiadamente
    }
    server = app.listen(4001);
    await User.deleteMany({});
  });

  afterAll(async () => {
    await User.deleteMany({});
    // No cierra la conexión aquí; la cierra el teardown global
    if (server && server.close) await server.close();
  });

  describe('POST /api/auth/register', () => {
    it('debe registrar un usuario nuevo', async () => {
      const res = await request(server)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          username: 'testuser',
          email: 'testuser@example.com',
          password: '12345678'
        });
      expect(res.statusCode).toBe(201);
      expect(res.body.user).toHaveProperty('email', 'testuser@example.com');
    });
    it('debe rechazar registro duplicado', async () => {
      await request(server)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          username: 'testuser',
          email: 'testuser@example.com',
          password: '12345678'
        });
      const res = await request(server)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          username: 'testuser',
          email: 'testuser@example.com',
          password: '12345678'
        });
      expect(res.statusCode).toBe(409);
    });
  });

  describe('POST /api/auth/login', () => {
    it('debe hacer login correctamente', async () => {
      await request(server)
        .post('/api/auth/register')
        .send({
          name: 'Login User',
          username: 'loginuser',
          email: 'loginuser@example.com',
          password: '12345678'
        });
      const res = await request(server)
        .post('/api/auth/login')
        .send({
          email: 'loginuser@example.com',
          password: '12345678'
        });
      expect(res.statusCode).toBe(200);
      expect(res.body.user).toHaveProperty('email', 'loginuser@example.com');
    });
    it('debe rechazar login con contraseña incorrecta', async () => {
      const res = await request(server)
        .post('/api/auth/login')
        .send({
          email: 'loginuser@example.com',
          password: 'wrongpassword'
        });
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toContain('inválidos');
    });
  });

  // Puedes añadir más tests para /profile, /refresh, etc.
});
