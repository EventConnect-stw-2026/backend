/**
 * Aplicación: EventConnect - Plataforma de gestión de eventos
 * Archivo: admin.middleware.js
 * Descripción: Middleware para verificar si el usuario es administrador.
 * Autor: Pablo Báscones, Mario Caudevilla, Mario Hernández y David Borrel
 */

// Middleware para verificar si el usuario tiene rol de administrador
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Acceso denegado: solo administradores' });
  }
  next();
}

module.exports = requireAdmin;
