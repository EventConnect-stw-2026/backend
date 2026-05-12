/**
 * Aplicación: EventConnect - Plataforma de gestión de eventos
 * Archivo: event-chat.routes.js
 * Descripción: Rutas para el chat de eventos.
 * Autor: Pablo Báscones, Mario Caudevilla, Mario Hernández y David Borrel
 */
const express = require('express');
const router = express.Router();
const cookieParser = require('cookie-parser');
const requireAuth = require('../middlewares/auth.middleware');
const { getEventMessages, sendEventMessage, getFriendsAttending } = require('../controllers/event-chat.controller');

router.use(cookieParser());

/**
 * @swagger
 * tags:
 *   name: Chat de eventos
 *   description: Chat grupal y amigos asistentes por evento
 */

/**
 * @swagger
 * /api/event-chat/{eventId}/messages:
 *   get:
 *     summary: Obtener mensajes del chat de un evento
 *     description: Devuelve los últimos 50 mensajes del chat grupal del evento, ordenados cronológicamente. No requiere autenticación.
 *     tags: [Chat de eventos]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del evento
 *     responses:
 *       200:
 *         description: Mensajes obtenidos correctamente
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
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       eventId:
 *                         type: string
 *                       sender:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           username:
 *                             type: string
 *                           avatarUrl:
 *                             type: string
 *                       content:
 *                         type: string
 *                         example: "¡Nos vemos allí!"
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *       500:
 *         description: Error del servidor
 */
router.get('/:eventId/messages', getEventMessages);

/**
 * @swagger
 * /api/event-chat/{eventId}/messages:
 *   post:
 *     summary: Enviar un mensaje al chat de un evento
 *     description: Envía un mensaje al chat grupal del evento. El usuario debe estar autenticado y apuntado al evento para poder escribir.
 *     tags: [Chat de eventos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del evento
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 1000
 *                 example: "¡Nos vemos allí!"
 *     responses:
 *       201:
 *         description: Mensaje enviado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     eventId:
 *                       type: string
 *                     sender:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         username:
 *                           type: string
 *                         avatarUrl:
 *                           type: string
 *                     content:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Mensaje vacío
 *       401:
 *         description: No autenticado
 *       403:
 *         description: El usuario no está apuntado al evento
 *       500:
 *         description: Error del servidor
 */
router.post('/:eventId/messages', requireAuth, sendEventMessage);

/**
 * @swagger
 * /api/event-chat/{eventId}/friends:
 *   get:
 *     summary: Obtener amigos del usuario que van al evento
 *     description: Devuelve la lista de amigos del usuario autenticado que tienen el evento en su lista de asistencia.
 *     tags: [Chat de eventos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del evento
 *     responses:
 *       200:
 *         description: Amigos obtenidos correctamente
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
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       username:
 *                         type: string
 *                       avatarUrl:
 *                         type: string
 *       401:
 *         description: No autenticado
 *       500:
 *         description: Error del servidor
 */
router.get('/:eventId/friends', requireAuth, getFriendsAttending);

/**
 * @swagger
 * components:
 *   schemas:
 *     EventMessage:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         eventId:
 *           type: string
 *           description: ID del evento al que pertenece el mensaje
 *         sender:
 *           $ref: '#/components/schemas/UserPublic'
 *         content:
 *           type: string
 *           example: "¡Nos vemos allí a las 10!"
 *           minLength: 1
 *           maxLength: 1000
 *         createdAt:
 *           type: string
 *           format: date-time
 */

module.exports = router;