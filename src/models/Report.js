/**
 * Aplicación: EventConnect - Plataforma de gestión de eventos
 * Archivo: Report.js
 * Descripción: Modelo para representar un informe de contenido o usuario.
 * Autor: Pablo Báscones, Mario Caudevilla, Mario Hernández y David Borrel
 */

const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['comment', 'message', 'user', 'event'],
      required: true
    },
    involvedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    relatedContent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: function() {
        return this.type === 'event' ? 'Event' : this.type === 'user' ? 'User' : 'Message';
      }
    },
    description: {
      type: String,
      required: true,
      maxlength: 1000
    },
    reason: {
      type: String,
      enum: ['spam', 'offensive_content', 'inappropriate', 'needs_urgent_review', 'other'],
      required: true
    },
    category: {
      type: String,
      enum: ['Contenido', 'Usuarios', 'Eventos'],
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'under_review', 'resolved', 'rejected'],
      default: 'pending'
    },
    resolution: {
      type: String,
      default: null,
      maxlength: 500
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    resolvedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Índices para mejorar búsquedas
reportSchema.index({ involvedUser: 1, createdAt: -1 });
reportSchema.index({ reportedBy: 1, createdAt: -1 });
reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ category: 1, createdAt: -1 });

module.exports = mongoose.model('Report', reportSchema);
