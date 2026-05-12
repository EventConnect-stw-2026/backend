/**
 * Aplicación: EventConnect - Plataforma de gestión de eventos
 * Archivo: chat.routes.js
 * Descripción: Rutas para la gestión de chat entre usuarios.
 * Autor: Pablo Báscones, Mario Caudevilla, Mario Hernández y David Borrel
 */

const express = require('express');
const router = express.Router();
const requireAuth = require('../middlewares/auth.middleware');
const cookieParser = require('cookie-parser');

const chatController = require('../controllers/chat.controller');

/**
 * @swagger
 * tags:
 *   name: Chat
 *   description: Gestión de conversaciones y mensajes privados entre amigos
 */

router.use(cookieParser());
router.use(requireAuth);

/**
 * @swagger
 * /api/chat/conversations/{friendId}:
 *   post:
 *     summary: Crear o recuperar una conversación privada con un amigo
 *     description: Si ya existe una conversación con ese amigo la devuelve; si no, la crea. Solo disponible entre usuarios que sean amigos.
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: friendId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del amigo con quien iniciar la conversación
 *     responses:
 *       200:
 *         description: Conversación creada o recuperada correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 conversation:
 *                   $ref: '#/components/schemas/Conversation'
 *       400:
 *         description: Datos incompletos o intento de chat consigo mismo
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Solo puedes chatear con tus amigos
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error del servidor
 */
router.post('/conversations/:friendId', chatController.createOrGetConversation);

/**
 * @swagger
 * /api/chat/conversations:
 *   get:
 *     summary: Obtener todas las conversaciones del usuario
 *     description: Devuelve todas las conversaciones privadas del usuario ordenadas por último mensaje. Incluye el conteo de mensajes no leídos por conversación.
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de conversaciones
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 conversations:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - $ref: '#/components/schemas/Conversation'
 *                       - type: object
 *                         properties:
 *                           unreadCount:
 *                             type: integer
 *                             example: 3
 *                             description: Mensajes no leídos en esta conversación
 *                 count:
 *                   type: integer
 *                   example: 5
 *       401:
 *         description: No autenticado
 *       500:
 *         description: Error del servidor
 */
router.get('/conversations', chatController.getMyConversations);

/**
 * @swagger
 * /api/chat/conversations/{conversationId}/messages:
 *   get:
 *     summary: Obtener mensajes de una conversación
 *     description: Devuelve todos los mensajes de una conversación. Solo accesible por los participantes.
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la conversación
 *     responses:
 *       200:
 *         description: Mensajes obtenidos correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 conversation:
 *                   $ref: '#/components/schemas/Conversation'
 *                 messages:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Message'
 *       400:
 *         description: ID de conversación inválido
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No tienes acceso a esta conversación
 *       404:
 *         description: Conversación no encontrada
 *       500:
 *         description: Error del servidor
 */
router.get('/conversations/:conversationId/messages', chatController.getConversationMessages);

/**
 * @swagger
 * /api/chat/conversations/{conversationId}/messages:
 *   post:
 *     summary: Enviar un mensaje en una conversación
 *     description: Envía un mensaje en la conversación. Solo los participantes pueden enviar mensajes, y ambos deben seguir siendo amigos.
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la conversación
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
 *                 example: "¡Hola! ¿Quedamos el viernes?"
 *     responses:
 *       201:
 *         description: Mensaje enviado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Mensaje enviado correctamente
 *                 chatMessage:
 *                   $ref: '#/components/schemas/Message'
 *       400:
 *         description: Mensaje vacío o ID inválido
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No puedes enviar mensajes — ya no sois amigos o no perteneces a esta conversación
 *       404:
 *         description: Conversación no encontrada
 *       500:
 *         description: Error del servidor
 */
router.post('/conversations/:conversationId/messages', chatController.sendMessage);

/**
 * @swagger
 * /api/chat/conversations/{conversationId}/read:
 *   patch:
 *     summary: Marcar todos los mensajes de una conversación como leídos
 *     description: Marca como leídos todos los mensajes recibidos no leídos en la conversación especificada.
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la conversación
 *     responses:
 *       200:
 *         description: Mensajes marcados como leídos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Mensajes marcados como leídos
 *                 updatedCount:
 *                   type: integer
 *                   example: 4
 *                   description: Número de mensajes actualizados
 *       400:
 *         description: ID de conversación inválido
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No perteneces a esta conversación
 *       404:
 *         description: Conversación no encontrada
 *       500:
 *         description: Error del servidor
 */
router.patch('/conversations/:conversationId/read', chatController.markConversationAsRead);

/**
 * @swagger
 * /api/chat/unread-counts-by-friend:
 *   get:
 *     summary: Obtener conteo de mensajes no leídos por amigo
 *     description: Devuelve un mapa de friendId → número de mensajes no leídos. Útil para mostrar badges en la lista de amigos.
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Conteo de mensajes no leídos por amigo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 unreadMessagesByFriend:
 *                   type: object
 *                   additionalProperties:
 *                     type: integer
 *                   example:
 *                     "664b1f4e8f1b2c001c8e4e1b": 3
 *                     "664b1f4e8f1b2c001c8e4e1c": 0
 *       401:
 *         description: No autenticado
 *       500:
 *         description: Error del servidor
 */
router.get('/unread-counts-by-friend', chatController.getUnreadCountsByFriend);

/**
 * @swagger
 * components:
 *   schemas:
 *     Conversation:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         participants:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/UserPublic'
 *         otherUser:
 *           $ref: '#/components/schemas/UserPublic'
 *         lastMessage:
 *           type: string
 *           example: "¡Nos vemos mañana!"
 *         lastMessageAt:
 *           type: string
 *           format: date-time
 *         createdAt:
 *           type: string
 *           format: date-time
 *     Message:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         conversationId:
 *           type: string
 *         sender:
 *           $ref: '#/components/schemas/UserPublic'
 *         receiver:
 *           $ref: '#/components/schemas/UserPublic'
 *         content:
 *           type: string
 *           example: "¡Hola! ¿Quedamos el viernes?"
 *         isRead:
 *           type: boolean
 *           example: false
 *         createdAt:
 *           type: string
 *           format: date-time
 */

module.exports = router;