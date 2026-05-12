/**
 * Aplicación: EventConnect - Plataforma de gestión de eventos
 * Archivo: seedSettings.js
 * Descripción: Script para poblar la base de datos con configuraciones de ejemplo.
 * Autor: Pablo Báscones, Mario Caudevilla, Mario Hernández y David Borrel
 */

const mongoose = require('mongoose');
const Settings = require('../models/Settings');
require('dotenv').config();

// Configuración de ejemplo para la aplicación, incluyendo información de contacto, opciones de moderación y programación de tareas de mantenimiento y backup
async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Conectado a MongoDB');

    // Eliminar settings existentes
    await Settings.deleteMany({});
    console.log('Configuraciones existentes eliminadas');

    // Crear configuración inicial
    const initialSettings = {
      appName: 'Evento Zaragoza',
      description: 'Plataforma para descubrir y conectar en eventos de Zaragoza',
      contactEmail: 'admin@eventozaragoza.es',
      contactPhone: '+34 676 545 210',
      timezone: 'Europe/Madrid',
      defaultLanguage: 'es',
      moderation: {
        requireEventApproval: true,
        autoDetectWords: true,
        autoBanAfterReports: false,
        notifyModeratorsOnReports: true,
        reportThresholdForBan: 5,
        bannedWords: ['spam', 'open', 'ofertas', 'impulsado']
      },
      notifications: {
        notifyReportedUsers: true,
        notifyFlaggedContent: true,
        weeklySummary: true,
        systemAlerts: true
      },
      backup: {
        lastBackup: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        nextScheduledBackup: new Date(Date.now() + 24 * 60 * 60 * 1000),
        frequency: 'daily',
        backupTime: '03:00',
        retentionDays: 90
      },
      maintenance: {
        lastUpdate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        maintenanceSchedule: 'daily',
        maintenanceTime: '02:00',
        autoOptimize: true
      }
    };

    await Settings.create(initialSettings);
    console.log('Configuraciones iniciales insertadas correctamente');
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();
