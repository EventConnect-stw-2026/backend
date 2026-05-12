/**
 * Aplicación: EventConnect - Plataforma de gestión de eventos
 * Archivo: Conversation.js
 * Descripción: Modelo para representar una conversación entre usuarios.
 * Autor: Pablo Báscones, Mario Caudevilla, Mario Hernández y David Borrel
 */

const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    participants: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true
        }
      ],
      validate: {
        validator: function (value) {
          return Array.isArray(value) && value.length === 2;
        },
        message: 'Una conversación privada debe tener exactamente 2 participantes'
      }
    },
    participantsKey: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    lastMessage: {
      type: String,
      default: '',
      maxlength: 1000
    },
    lastMessageAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

conversationSchema.index({ participantsKey: 1 }, { unique: true });
conversationSchema.index({ participants: 1 });
conversationSchema.index({ lastMessageAt: -1 });

module.exports = mongoose.model('Conversation', conversationSchema);