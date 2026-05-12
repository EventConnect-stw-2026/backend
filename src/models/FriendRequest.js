/**
 * Aplicación: EventConnect - Plataforma de gestión de eventos
 * Archivo: FriendRequest.js
 * Descripción: Modelo para representar una solicitud de amistad.
 * Autor: Pablo Báscones, Mario Caudevilla, Mario Hernández y David Borrel
 */
const mongoose = require('mongoose');

const friendRequestSchema = new mongoose.Schema(
  {
    fromUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    toUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// Índice para evitar duplicados y mejorar búsquedas
friendRequestSchema.index({ fromUser: 1, toUser: 1 }, { unique: true });

module.exports = mongoose.model('FriendRequest', friendRequestSchema);
