/**
 * Aplicación: EventConnect - Plataforma de gestión de eventos
 * Archivo: notFound.js
 * Descripción: Middleware para manejar rutas no encontradas.
 * Autor: Pablo Báscones, Mario Caudevilla, Mario Hernández y David Borrel
 */

// Middleware para manejar rutas no encontradas
const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: "Ruta no encontrada"
  });
};

module.exports = notFound;