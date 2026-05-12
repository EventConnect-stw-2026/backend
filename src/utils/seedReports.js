/**
 * Aplicación: EventConnect - Plataforma de gestión de eventos
 * Archivo: seedReports.js
 * Descripción: Script para poblar la base de datos con reportes de ejemplo, incluyendo diferentes tipos y razones de reporte.
 * Autor: Pablo Báscones, Mario Caudevilla, Mario Hernández y David Borrel
 */

const mongoose = require('mongoose');
const Report = require('../models/Report');
const User = require('../models/User');
const Event = require('../models/Event');
require('dotenv').config();

// Array de reportes de ejemplo, con diferentes combinaciones de tipo, razón y categoría para cubrir casos comunes en la plataforma
async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Conectado a MongoDB');

    // Obtener usuarios y eventos para crear referencias
    const users = await User.find().limit(3);
    const events = await Event.find().limit(2);

    if (users.length < 2) {
      console.log('Se necesitan al menos 2 usuarios en la BD');
      process.exit(1);
    }

    const reports = [
      {
        type: 'comment',
        involvedUser: users[0]._id,
        reportedBy: users[1]._id,
        description: 'Este evento es una basura de siempre yo no entiendo por qué la recomiendan...',
        reason: 'offensive_content',
        category: 'Contenido',
        status: 'pending'
      },
      {
        type: 'message',
        involvedUser: users[1]._id,
        reportedBy: users[0]._id,
        description: 'Hola Marta, ¿y tus padres dejaron encerrado en el sábado??',
        reason: 'spam',
        category: 'Contenido',
        status: 'pending'
      },
      {
        type: 'user',
        involvedUser: users[2]._id,
        reportedBy: users[0]._id,
        description: 'Actividad: 45 eventos creados en 1 hora',
        reason: 'needs_urgent_review',
        category: 'Usuarios',
        status: 'under_review'
      },
      {
        type: 'event',
        involvedUser: users[1]._id,
        reportedBy: users[0]._id,
        relatedContent: events.length > 0 ? events[0]._id : undefined,
        description: 'Eventos inventados y promociones comerciales sin solicitud',
        reason: 'spam',
        category: 'Eventos',
        status: 'pending'
      },
      {
        type: 'event',
        involvedUser: users[2]._id,
        reportedBy: users[1]._id,
        relatedContent: events.length > 1 ? events[1]._id : undefined,
        description: 'Eventos ficticios, promociones comerciales sin solicitud',
        reason: 'spam',
        category: 'Eventos',
        status: 'pending'
      },
      {
        type: 'user',
        involvedUser: users[0]._id,
        reportedBy: users[2]._id,
        description: 'Chico/envíos, móviles, promociones sin solicitud',
        reason: 'spam',
        category: 'Contenido',
        status: 'pending'
      }
    ];

    // Eliminar reportes existentes
    await Report.deleteMany({});
    console.log('Reportes existentes eliminados');

    // Insertar nuevos reportes
    await Report.insertMany(reports);
    console.log('Reportes insertados correctamente');
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();
