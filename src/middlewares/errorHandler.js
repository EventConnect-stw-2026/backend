const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  if (err.stack) {
    console.error('Stack:', err.stack);
  }
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Error interno del servidor"
  });
};

module.exports = errorHandler;