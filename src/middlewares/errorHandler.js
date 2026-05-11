const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  logger.error('Unhandled error', {
    error: err,
    method: req.method,
    url: req.originalUrl
  });
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Error interno del servidor"
  });
};

module.exports = errorHandler;