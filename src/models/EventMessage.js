/**
 * Aplicación: EventConnect - Plataforma de gestión de eventos
 * Archivo: EventMessage.js
 * Descripción: Modelo para representar un mensaje en una conversación sobre un evento.
 * Autor: Pablo Báscones, Mario Caudevilla, Mario Hernández y David Borrel
 */

const mongoose = require('mongoose');

const eventMessageSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 1000
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

eventMessageSchema.index({ eventId: 1, createdAt: 1 });

module.exports = mongoose.model('EventMessage', eventMessageSchema);