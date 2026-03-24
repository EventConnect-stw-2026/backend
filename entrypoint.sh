#!/bin/sh
# Entrypoint para ejecutar el seed solo si no hay usuarios y luego arrancar el backend

set -e


# Espera a que MongoDB esté disponible
until nc -z mongo 27017; do
  echo "Esperando a que MongoDB esté disponible..."
  sleep 2
done
# Espera extra para asegurar que Mongo está listo
sleep 3

# Ejecuta el seed solo si no hay usuarios


# Imprime la URI y el número de usuarios antes de decidir
USER_COUNT=$(node -e "require('dotenv').config(); const mongoose = require('mongoose'); const User = require('./src/models/User'); (async () => { try { await mongoose.connect(process.env.MONGODB_URI); const count = await User.countDocuments(); console.log(count); process.exit(0); } catch (e) { console.error('Error comprobando usuarios:', e); process.exit(2); } })();" | grep -Eo '^[0-9]+$' | tail -1)
echo "MONGODB_URI: $MONGODB_URI"
echo "Número de usuarios encontrados: $USER_COUNT"
if [ "$USER_COUNT" = "0" ]; then
  echo "No hay usuarios, ejecutando seed..."
  node src/utils/seedUsers.js
else
  echo "Usuarios ya existen, no se ejecuta seed."
fi

# Arranca el backend
exec npm run dev
