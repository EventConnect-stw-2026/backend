const express = require('express');
const cookieParser = require('cookie-parser');

const requireAuth = require('../middlewares/auth.middleware');
const requireAdmin = require('../middlewares/admin.middleware');
const { 
  getDashboard, 
  getUsers, 
  getEvents, 
  getReportsSummary, 
  getReports,
  getSettings,
  updateGeneralSettings,
  updateModerationSettings,
  updateNotificationSettings,
  getSystemStatus,
  clearCache,
  optimizeDatabase,
  downloadBackup
} = require('../controllers/admin.controller');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Administración
 *   description: Endpoints de administración (requieren permisos de admin)
 */

router.use(cookieParser());

/**
 * @swagger
 * /api/admin/dashboard:
 *   get:
 *     summary: Obtener dashboard de administración
 *     tags: [Administración]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Datos del dashboard
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No autorizado
 */
router.get('/dashboard', requireAuth, requireAdmin, getDashboard);

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Listar todos los usuarios
 *     tags: [Administración]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuarios
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No autorizado
 */
router.get('/users', requireAuth, requireAdmin, getUsers);

/**
 * @swagger
 * /api/admin/events:
 *   get:
 *     summary: Listar todos los eventos
 *     tags: [Administración]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de eventos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Event'
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No autorizado
 */
router.get('/events', requireAuth, requireAdmin, getEvents);

/**
 * @swagger
 * /api/admin/reports/summary:
 *   get:
 *     summary: Obtener resumen de reportes
 *     tags: [Administración]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Resumen de reportes por categoría
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No autorizado
 */
router.get('/reports/summary', requireAuth, requireAdmin, getReportsSummary);

/**
 * @swagger
 * /api/admin/reports:
 *   get:
 *     summary: Listar todos los reportes
 *     tags: [Administración]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filtrar por categoría (Contenido, Usuarios, Eventos)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de reportes
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No autorizado
 */
router.get('/reports', requireAuth, requireAdmin, getReports);

/**
 * @swagger
 * /api/admin/settings:
 *   get:
 *     summary: Obtener configuración global
 *     tags: [Administración]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Configuración global del sistema
 */
router.get('/settings', requireAuth, requireAdmin, getSettings);

/**
 * @swagger
 * /api/admin/settings/general:
 *   put:
 *     summary: Actualizar configuración general
 *     tags: [Administración]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Configuración actualizada
 */
router.put('/settings/general', requireAuth, requireAdmin, updateGeneralSettings);

/**
 * @swagger
 * /api/admin/settings/moderation:
 *   put:
 *     summary: Actualizar políticas de moderación
 *     tags: [Administración]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Configuración de moderación actualizada
 */
router.put('/settings/moderation', requireAuth, requireAdmin, updateModerationSettings);

/**
 * @swagger
 * /api/admin/settings/notifications:
 *   put:
 *     summary: Actualizar configuración de notificaciones
 *     tags: [Administración]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Configuración de notificaciones actualizada
 */
router.put('/settings/notifications', requireAuth, requireAdmin, updateNotificationSettings);

/**
 * @swagger
 * /api/admin/system/status:
 *   get:
 *     summary: Obtener estado del sistema
 *     tags: [Administración]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estado actual del sistema
 */
router.get('/system/status', requireAuth, requireAdmin, getSystemStatus);

/**
 * @swagger
 * /api/admin/system/cache:
 *   post:
 *     summary: Limpiar caché del sistema
 *     tags: [Administración]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Caché limpiado
 */
router.post('/system/cache', requireAuth, requireAdmin, clearCache);

/**
 * @swagger
 * /api/admin/system/optimize:
 *   post:
 *     summary: Optimizar base de datos
 *     tags: [Administración]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Base de datos optimizada
 */
router.post('/system/optimize', requireAuth, requireAdmin, optimizeDatabase);

/**
 * @swagger
 * /api/admin/backup:
 *   post:
 *     summary: Descargar respaldo de datos
 *     tags: [Administración]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Respaldo generado
 */
router.post('/backup', requireAuth, requireAdmin, downloadBackup);

module.exports = router;
