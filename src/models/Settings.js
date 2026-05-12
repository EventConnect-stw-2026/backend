/**
 * Aplicación: EventConnect - Plataforma de gestión de eventos
 * Archivo: Settings.js
 * Descripción: Modelo para representar la configuración de la aplicación.
 * Autor: Pablo Báscones, Mario Caudevilla, Mario Hernández y David Borrel
 */

const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    // Información General
    appName: {
      type: String,
      default: 'Evento Zaragoza'
    },
    description: {
      type: String,
      default: 'Plataforma para descubrir y conectar en eventos de Zaragoza'
    },
    contactEmail: {
      type: String,
      default: 'admin@eventozaragoza.es'
    },
    contactPhone: {
      type: String,
      default: '+34 676 545 210'
    },
    timezone: {
      type: String,
      default: 'Europe/Madrid'
    },
    defaultLanguage: {
      type: String,
      default: 'es'
    },

    // Políticas de Moderación
    moderation: {
      requireEventApproval: {
        type: Boolean,
        default: true
      },
      autoDetectWords: {
        type: Boolean,
        default: true
      },
      autoBanAfterReports: {
        type: Boolean,
        default: false
      },
      notifyModeratorsOnReports: {
        type: Boolean,
        default: true
      },
      reportThresholdForBan: {
        type: Number,
        default: 5
      },
      bannedWords: {
        type: [String],
        default: ['spam', 'open', 'ofertas', 'impulsado']
      }
    },

    // Notificaciones
    notifications: {
      notifyReportedUsers: {
        type: Boolean,
        default: true
      },
      notifyFlaggedContent: {
        type: Boolean,
        default: true
      },
      weeklySummary: {
        type: Boolean,
        default: true
      },
      systemAlerts: {
        type: Boolean,
        default: true
      }
    },

    // Backup Config
    backup: {
      lastBackup: {
        type: Date,
        default: null
      },
      nextScheduledBackup: {
        type: Date,
        default: null
      },
      frequency: {
        type: String,
        enum: ['daily', 'weekly', 'monthly'],
        default: 'daily'
      },
      backupTime: {
        type: String,
        default: '03:00'
      },
      retentionDays: {
        type: Number,
        default: 90
      }
    },

    // Mantenimiento
    maintenance: {
      lastUpdate: {
        type: Date,
        default: null
      },
      maintenanceSchedule: {
        type: String,
        default: 'daily'
      },
      maintenanceTime: {
        type: String,
        default: '02:00'
      },
      autoOptimize: {
        type: Boolean,
        default: true
      }
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Settings', settingsSchema);
