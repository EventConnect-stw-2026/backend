#!/bin/sh
set -e

echo "Iniciando backend..."

if [ -z "$MONGODB_URI" ]; then
  echo "ERROR: La variable MONGODB_URI no está definida."
  exit 1
fi

echo "Comprobando conexión con MongoDB..."

node -e "
require('dotenv').config();
const mongoose = require('mongoose');

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB disponible');
    await mongoose.disconnect();
    process.exit(0);
  } catch (e) {
    console.error('Error conectando con MongoDB:', e.message);
    process.exit(1);
  }
})();
"

echo "Comprobando usuarios existentes..."

USER_COUNT=$(node -e "
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const count = await User.countDocuments();
    console.log(count);
    await mongoose.disconnect();
    process.exit(0);
  } catch (e) {
    console.error('Error comprobando usuarios:', e.message);
    process.exit(2);
  }
})();
" | grep -Eo '^[0-9]+$' | tail -1)

echo "Número de usuarios encontrados: $USER_COUNT"

if [ "$USER_COUNT" = "0" ]; then
  echo "No hay usuarios, ejecutando seed de usuarios..."
  node src/utils/seedUsers.js
else
  echo "Usuarios ya existen, no se ejecuta seed de usuarios."
fi

echo "Ejecutando seed de Settings..."
node src/utils/seedSettings.js

echo "Ejecutando seed de Reports..."
node src/utils/seedReports.js

echo "Arrancando backend..."
exec npm start
