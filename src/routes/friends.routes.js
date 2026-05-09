const express = require('express');
const router = express.Router();
const requireAuth = require('../middlewares/auth.middleware');
const cookieParser = require('cookie-parser');

const {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  getPendingRequests,
  getFriends,
  removeFriend,
  getSuggestedFriends,
  getSearchableUsers,
  getUsersBySearch,
  getSentRequests
} = require('../controllers/friends.controller');

/**
 * @swagger
 * tags:
 *   name: Amigos
 *   description: Gestión de solicitudes y lista de amigos
 */

router.use(cookieParser());
router.use(requireAuth);

/**
 * @swagger
 * /api/friends/request:
 *   post:
 *     summary: Enviar solicitud de amistad
 *     description: Envía una solicitud de amistad a otro usuario. No se puede enviar si ya existe una solicitud pendiente o ya sois amigos.
 *     tags: [Amigos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - friendId
 *             properties:
 *               friendId:
 *                 type: string
 *                 description: ID del usuario al que se envía la solicitud
 *                 example: "664b1f4e8f1b2c001c8e4e1b"
 *     responses:
 *       201:
 *         description: Solicitud enviada correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Solicitud de amistad enviada
 *                 friendRequest:
 *                   $ref: '#/components/schemas/FriendRequest'
 *       400:
 *         description: Solicitud inválida o ya existe una solicitud entre estos usuarios
 *       401:
 *         description: No autenticado
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error del servidor
 */
router.post('/request', sendFriendRequest);

/**
 * @swagger
 * /api/friends/pending:
 *   get:
 *     summary: Obtener solicitudes de amistad pendientes recibidas
 *     description: Devuelve las solicitudes de amistad que el usuario ha recibido y aún no ha respondido.
 *     tags: [Amigos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de solicitudes pendientes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 pendingRequests:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/FriendRequest'
 *       401:
 *         description: No autenticado
 *       500:
 *         description: Error del servidor
 */
router.get('/pending', getPendingRequests);

/**
 * @swagger
 * /api/friends/sent:
 *   get:
 *     summary: Obtener solicitudes de amistad enviadas
 *     description: Devuelve las solicitudes de amistad que el usuario ha enviado y están pendientes de respuesta.
 *     tags: [Amigos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de solicitudes enviadas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sentRequests:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/FriendRequest'
 *       401:
 *         description: No autenticado
 *       500:
 *         description: Error del servidor
 */
router.get('/sent', getSentRequests);

/**
 * @swagger
 * /api/friends/list:
 *   get:
 *     summary: Obtener lista de amigos
 *     description: Devuelve todos los usuarios con los que el usuario tiene una relación de amistad aceptada.
 *     tags: [Amigos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de amigos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 friends:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/UserPublic'
 *                 count:
 *                   type: integer
 *                   example: 5
 *       401:
 *         description: No autenticado
 *       500:
 *         description: Error del servidor
 */
router.get('/list', getFriends);

/**
 * @swagger
 * /api/friends/suggested:
 *   get:
 *     summary: Obtener sugerencias de amigos
 *     description: Devuelve entre 3 y 5 usuarios sugeridos basándose en amigos en común. Excluye usuarios ya amigos o con solicitud pendiente.
 *     tags: [Amigos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de sugerencias
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 suggestedFriends:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - $ref: '#/components/schemas/UserPublic'
 *                       - type: object
 *                         properties:
 *                           mutualFriends:
 *                             type: integer
 *                             example: 2
 *                             description: Número de amigos en común
 *       401:
 *         description: No autenticado
 *       500:
 *         description: Error del servidor
 */
router.get('/suggested', getSuggestedFriends);

/**
 * @swagger
 * /api/friends/searchable:
 *   get:
 *     summary: Obtener todos los usuarios buscables
 *     description: Devuelve todos los usuarios de la plataforma excepto el propio usuario autenticado.
 *     tags: [Amigos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuarios
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/UserPublic'
 *       401:
 *         description: No autenticado
 *       500:
 *         description: Error del servidor
 */
router.get('/searchable', getSearchableUsers);

/**
 * @swagger
 * /api/friends/search:
 *   get:
 *     summary: Buscar usuarios por nombre, username o email
 *     description: Devuelve hasta 20 usuarios que coincidan con el texto de búsqueda. Excluye al propio usuario.
 *     tags: [Amigos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Texto de búsqueda (nombre, username o email)
 *         example: mario
 *     responses:
 *       200:
 *         description: Resultados de búsqueda
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/UserPublic'
 *       401:
 *         description: No autenticado
 *       500:
 *         description: Error del servidor
 */
router.get('/search', getUsersBySearch);

/**
 * @swagger
 * /api/friends/{requestId}/accept:
 *   put:
 *     summary: Aceptar solicitud de amistad
 *     description: Acepta una solicitud de amistad pendiente. Solo puede hacerlo el usuario destinatario.
 *     tags: [Amigos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la solicitud a aceptar
 *     responses:
 *       200:
 *         description: Solicitud aceptada correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Solicitud aceptada, ¡ahora sois amigos!"
 *                 friendRequest:
 *                   $ref: '#/components/schemas/FriendRequest'
 *       400:
 *         description: La solicitud ya ha sido procesada
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No tienes permiso para aceptar esta solicitud
 *       404:
 *         description: Solicitud no encontrada
 *       500:
 *         description: Error del servidor
 */
router.put('/:requestId/accept', acceptFriendRequest);

/**
 * @swagger
 * /api/friends/{requestId}/reject:
 *   put:
 *     summary: Rechazar solicitud de amistad
 *     description: Rechaza una solicitud de amistad pendiente. Solo puede hacerlo el usuario destinatario.
 *     tags: [Amigos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la solicitud a rechazar
 *     responses:
 *       200:
 *         description: Solicitud rechazada correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Solicitud rechazada
 *       400:
 *         description: La solicitud ya ha sido procesada
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No tienes permiso para rechazar esta solicitud
 *       404:
 *         description: Solicitud no encontrada
 *       500:
 *         description: Error del servidor
 */
router.put('/:requestId/reject', rejectFriendRequest);

/**
 * @swagger
 * /api/friends/{friendId}:
 *   delete:
 *     summary: Eliminar amigo
 *     description: Elimina la relación de amistad con el usuario especificado.
 *     tags: [Amigos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: friendId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del amigo a eliminar
 *     responses:
 *       200:
 *         description: Amigo eliminado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Amigo eliminado
 *       400:
 *         description: Datos incompletos
 *       401:
 *         description: No autenticado
 *       404:
 *         description: No sois amigos
 *       500:
 *         description: Error del servidor
 */
router.delete('/:friendId', removeFriend);

/**
 * @swagger
 * components:
 *   schemas:
 *     FriendRequest:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         fromUser:
 *           $ref: '#/components/schemas/UserPublic'
 *         toUser:
 *           $ref: '#/components/schemas/UserPublic'
 *         status:
 *           type: string
 *           enum: [pending, accepted, rejected]
 *           example: pending
 *         createdAt:
 *           type: string
 *           format: date-time
 *     UserPublic:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         name:
 *           type: string
 *           example: Mario García
 *         username:
 *           type: string
 *           example: mariogarcia
 *         email:
 *           type: string
 *           example: mario@example.com
 *         avatarUrl:
 *           type: string
 *         bio:
 *           type: string
 *         location:
 *           type: string
 */

module.exports = router;