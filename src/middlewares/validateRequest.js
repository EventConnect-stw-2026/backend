/**
 * Aplicación: EventConnect - Plataforma de gestión de eventos
 * Archivo: validateRequest.js
 * Descripción: Middleware para validar la solicitud entrante.
 * Autor: Pablo Báscones, Mario Caudevilla, Mario Hernández y David Borrel
 */

const { validationResult } = require("express-validator");

// Middleware para validar la solicitud entrante
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Errores de validación",
      errors: errors.array()
    });
  }

  next();
};

module.exports = validateRequest;