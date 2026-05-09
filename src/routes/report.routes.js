const express = require('express');
const router = express.Router();
const requireAuth = require('../middlewares/auth.middleware');
const { createReport, getMyReports } = require('../controllers/report.controller');

/**
 * @swagger
 * tags:
 *   name: Reportes
 *   description: Gestión de reportes de contenido inapropiado
 */

/**
 * @swagger
 * /api/reports:
 *   post:
 *     summary: Crear un reporte
 *     description: >
 *       Crea un reporte sobre un contenido inapropiado. Los tipos soportados son:
 *       `message` (mensaje del chat de un evento), `user` (usuario), `event` (evento) y `comment` (comentario, uso futuro).
 *     tags: [Reportes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - reason
 *               - description
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [message, user, event, comment]
 *                 example: message
 *               reason:
 *                 type: string
 *                 enum: [spam, offensive_content, inappropriate, needs_urgent_review, other]
 *                 example: offensive_content
 *               description:
 *                 type: string
 *                 example: "Este usuario está enviando mensajes ofensivos"
 *               relatedId:
 *                 type: string
 *                 description: ID del mensaje, evento o comentario reportado
 *                 example: "664b1f4e8f1b2c001c8e4e1b"
 *               involvedUserId:
 *                 type: string
 *                 description: ID del usuario reportado (requerido si type es 'user')
 *                 example: "664b1f4e8f1b2c001c8e4e1c"
 *     responses:
 *       201:
 *         description: Reporte creado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Report'
 *       400:
 *         description: Tipo inválido, descripción vacía o faltan campos requeridos
 *       401:
 *         description: No autenticado
 *       404:
 *         description: Mensaje, usuario o evento no encontrado
 *       500:
 *         description: Error del servidor
 */
router.post('/', requireAuth, createReport);

/**
 * @swagger
 * /api/reports/my:
 *   get:
 *     summary: Obtener mis reportes enviados
 *     description: Devuelve todos los reportes creados por el usuario autenticado, ordenados del más reciente al más antiguo.
 *     tags: [Reportes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de reportes del usuario
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Report'
 *       401:
 *         description: No autenticado
 *       500:
 *         description: Error del servidor
 */
router.get('/my', requireAuth, getMyReports);

/**
 * @swagger
 * components:
 *   schemas:
 *     Report:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         type:
 *           type: string
 *           enum: [message, user, event, comment]
 *         reason:
 *           type: string
 *           enum: [spam, offensive_content, inappropriate, needs_urgent_review, other]
 *         description:
 *           type: string
 *         category:
 *           type: string
 *           example: Usuarios
 *         reportedBy:
 *           type: string
 *           description: ID del usuario que envió el reporte
 *         involvedUser:
 *           type: string
 *           description: ID del usuario reportado (si aplica)
 *         relatedContent:
 *           type: string
 *           description: ID del contenido reportado
 *         status:
 *           type: string
 *           enum: [pending, reviewed, resolved, rejected]
 *           example: pending
 *         createdAt:
 *           type: string
 *           format: date-time
 */

module.exports = router;