/**
 * Aplicación: EventConnect - Plataforma de gestión de eventos
 * Archivo: seedUsers.js
 * Descripción: Script para poblar la base de datos con usuarios de ejemplo.
 * Autor: Pablo Báscones, Mario Caudevilla, Mario Hernández y David Borrel
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();

const users = [
  {
    name: 'Juan Pérez',
    username: 'juanp',
    email: 'juan@example.com',
    password: 'password123',
    role: 'user',
  },
  {
    name: 'Ana García',
    username: 'anag',
    email: 'ana@example.com',
    password: 'password123',
    role: 'user',
  },
  {
    name: 'Carlos López',
    username: 'carlosl',
    email: 'carlos@example.com',
    password: 'password123',
    role: 'user',
  },
  {
    name: 'Admin',
    username: 'admin',
    email: 'admin@example.com',
    password: 'admin123',
    role: 'admin',
  },
];

// Script para poblar la base de datos con usuarios de ejemplo, incluyendo un usuario administrador para facilitar las pruebas y la gestión de la plataforma, con manejo de errores para asegurar que el proceso se completa correctamente
async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Conectado a MongoDB');

    // Borra todos los usuarios existentes
    await User.deleteMany({});
    console.log('Usuarios existentes eliminados');

    // Hashea las contraseñas y usa passwordHash
    const usersToInsert = [];
    for (let user of users) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(user.password, salt);
      usersToInsert.push({
        ...user,
        passwordHash,
      });
    }

    await User.insertMany(usersToInsert);
    console.log('Usuarios insertados correctamente');
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();
