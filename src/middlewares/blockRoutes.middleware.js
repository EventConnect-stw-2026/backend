// Middleware para bloquear rutas según el estado de sesión (JavaScript puro)
function blockRoutesForAuthenticated(allowedForUnauthenticated = []) {
  return function (req, res, next) {
    const isAuthenticated = !!req.user; // req.user debe estar definido si hay sesión
    const path = req.path;

    // Si está autenticado y la ruta está en la lista de solo para no autenticados
    if (isAuthenticated && allowedForUnauthenticated.includes(path)) {
      return res.status(403).json({ message: 'No puedes acceder a esta ruta estando autenticado.' });
    }

    // Si NO está autenticado y la ruta requiere autenticación
    if (!isAuthenticated && !allowedForUnauthenticated.includes(path)) {
      return res.status(401).json({ message: 'Debes iniciar sesión para acceder a esta ruta.' });
    }

    next();
  };
}

module.exports = { blockRoutesForAuthenticated };
