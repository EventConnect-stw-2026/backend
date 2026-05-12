/**
 * Aplicación: EventConnect - Plataforma de gestión de eventos
 * Archivo: Event.js
 * Descripción: Modelo para representar un evento.
 * Autor: Pablo Báscones, Mario Caudevilla, Mario Hernández y David Borrel
 */

const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    externalId: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000
    },
    category: {
      type: String,
      required: true,
      trim: true
    },
    subcategory: {
      type: String,
      trim: true,
      default: null
    },
    startDate: {
      type: Date,
      default: null, // Algunos eventos no tienen fecha
    },
    endDate: {
      type: Date,
      default: null, // Algunos eventos no tienen fecha
    },
    locationName: {
      type: String,
      required: true,
      trim: true
    },
    address: {
      type: String,
      trim: true,
      default: null
    },
    latitude: {
      type: Number,
      default: null
    },
    longitude: {
      type: Number,
      default: null
    },
    imageUrl: {
      type: String,
      trim: true,
      default: null
    },
    sourceUrl: {
      type: String,
      trim: true,
      default: null
    },
    status: {
      type: String,
      enum: ["active", "expired", "cancelled"],
      default: "active"
    },
    isFree: {
      type: Boolean,
      default: true
    },
    expiredAt: {
      type: Date,
      default: null
    },
    syncedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

eventSchema.index({ title: "text", description: "text" });
eventSchema.index({ category: 1 });
eventSchema.index({ startDate: 1 });
eventSchema.index({ status: 1 });

module.exports = mongoose.model("Event", eventSchema);