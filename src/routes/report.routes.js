const express = require('express');
const router = express.Router();
const requireAuth = require('../middlewares/auth.middleware');
const { createReport, getMyReports } = require('../controllers/report.controller');

// Crear un reporte (mensaje de evento, evento, usuario, comentario)
router.post('/', requireAuth, createReport);

// Obtener los reportes creados por el usuario
router.get('/my', requireAuth, getMyReports);

module.exports = router;
