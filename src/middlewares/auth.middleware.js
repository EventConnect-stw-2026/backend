/**
 * Aplicación: EventConnect - Plataforma de gestión de eventos
 * Archivo: auth.middleware.js
 * Descripción: Middleware para verificar la autenticación de usuarios mediante JWT.
 * Autor: Pablo Báscones, Mario Caudevilla, Mario Hernández y David Borrel
 */

const jwt = require('jsonwebtoken');

// Middleware para verificar la autenticación del usuario mediante JWT
function requireAuth(req, res, next) {
  try {
    const token = req.cookies.accessToken;
    if (!token) {
      return res.status(401).json({ message: 'Token no proporcionado' });
    }
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
}

module.exports = requireAuth;