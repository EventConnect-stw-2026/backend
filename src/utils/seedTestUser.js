// Crea el usuario de prueba para los tests E2E de Playwright
// Ejecuta: node src/utils/seedTestUser.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();

const TEST_EMAIL    = process.env.TEST_EMAIL    || 'test-e2e@eventconnect.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'Test1234!';
const TEST_USERNAME = process.env.TEST_USERNAME || 'test_e2e';

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI_LOCAL || process.env.MONGODB_URI);
    console.log('Conectado a MongoDB');

    const exists = await User.findOne({ email: TEST_EMAIL });
    if (exists) {
      console.log(`Usuario de test ya existe: ${TEST_EMAIL}`);
      process.exit(0);
    }

    const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);
    await User.create({
      name: 'Test E2E',
      username: TEST_USERNAME,
      email: TEST_EMAIL,
      passwordHash,
      role: 'user',
    });

    console.log(`Usuario de test creado: ${TEST_EMAIL}`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();
