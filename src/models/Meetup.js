/**
 * Aplicación: EventConnect - Plataforma de gestión de eventos
 * Archivo: Meetup.js
 * Descripción: Modelo para representar una quedada.
 * Autor: Pablo Báscones, Mario Caudevilla, Mario Hernández y David Borrel
 */

const mongoose = require('mongoose');

const meetupParticipantSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    response: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    },
    respondedAt: {
      type: Date,
      default: null
    }
  },
  { _id: false }
);

const meetupSchema = new mongoose.Schema(
  {
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true
    },
    meetupDateTime: {
      type: Date,
      required: true
    },
    meetupPlace: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    participants: {
      type: [meetupParticipantSchema],
      validate: {
        validator: function (value) {
          return Array.isArray(value) && value.length > 0;
        },
        message: 'La quedada debe tener al menos un invitado'
      }
    },
    status: {
      type: String,
      enum: ['active', 'cancelled'],
      default: 'active'
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

meetupSchema.index({ organizer: 1, createdAt: -1 });
meetupSchema.index({ 'participants.user': 1, createdAt: -1 });
meetupSchema.index({ event: 1 });
meetupSchema.index({ meetupDateTime: 1 });

module.exports = mongoose.model('Meetup', meetupSchema);