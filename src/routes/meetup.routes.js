const express = require('express');
const router = express.Router();
const cookieParser = require('cookie-parser');
const requireAuth = require('../middlewares/auth.middleware');
const validateRequest = require('../middlewares/validateRequest');

const {
  createMeetup,
  getOrganizedMeetups,
  getInvitedMeetups,
  respondToMeetup,
  cancelMeetup,
  getPendingMeetupInvitationsCount
} = require('../controllers/meetup.controller');

const {
  createMeetupValidator,
  meetupIdValidator,
  respondMeetupValidator
} = require('../validators/meetup.validators');

/**
 * @swagger
 * tags:
 *   name: Quedadas
 *   description: Gestión de quedadas entre amigos
 */

router.use(cookieParser());
router.use(requireAuth);

/**
 * @swagger
 * /api/meetups:
 *   post:
 *     summary: Crear una quedada
 *     description: Crea una nueva quedada e invita a los amigos seleccionados.
 *     tags: [Quedadas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - invitedUsers
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Cena de amigos"
 *               description:
 *                 type: string
 *                 example: "Quedada para cenar juntos el viernes"
 *               date:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-05-15T20:00:00Z"
 *               location:
 *                 type: string
 *                 example: "Restaurante El Tubo, Zaragoza"
 *               invitedUsers:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["664b1f4e8f1b2c001c8e4e1b", "664b1f4e8f1b2c001c8e4e1c"]
 *     responses:
 *       201:
 *         description: Quedada creada correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Quedada creada
 *                 meetup:
 *                   $ref: '#/components/schemas/Meetup'
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autenticado
 *       500:
 *         description: Error del servidor
 */
router.post('/', createMeetupValidator, validateRequest, createMeetup);

/**
 * @swagger
 * /api/meetups/organized:
 *   get:
 *     summary: Obtener quedadas organizadas por el usuario
 *     description: Devuelve todas las quedadas que el usuario autenticado ha creado.
 *     tags: [Quedadas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de quedadas organizadas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 meetups:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Meetup'
 *       401:
 *         description: No autenticado
 *       500:
 *         description: Error del servidor
 */
router.get('/organized', getOrganizedMeetups);

/**
 * @swagger
 * /api/meetups/invited:
 *   get:
 *     summary: Obtener quedadas a las que el usuario ha sido invitado
 *     description: Devuelve todas las quedadas en las que el usuario autenticado figura como invitado.
 *     tags: [Quedadas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de quedadas recibidas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 meetups:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Meetup'
 *       401:
 *         description: No autenticado
 *       500:
 *         description: Error del servidor
 */
router.get('/invited', getInvitedMeetups);

/**
 * @swagger
 * /api/meetups/pending-invitations-count:
 *   get:
 *     summary: Obtener número de invitaciones a quedadas pendientes
 *     description: Devuelve el conteo de invitaciones a quedadas que el usuario aún no ha respondido.
 *     tags: [Quedadas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Conteo obtenido correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *                   example: 3
 *       401:
 *         description: No autenticado
 *       500:
 *         description: Error del servidor
 */
router.get('/pending-invitations-count', getPendingMeetupInvitationsCount);

/**
 * @swagger
 * /api/meetups/{meetupId}/respond:
 *   put:
 *     summary: Responder a una invitación de quedada
 *     description: Acepta o rechaza una invitación a una quedada.
 *     tags: [Quedadas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: meetupId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la quedada
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - response
 *             properties:
 *               response:
 *                 type: string
 *                 enum: [accepted, rejected]
 *                 example: accepted
 *     responses:
 *       200:
 *         description: Respuesta registrada correctamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No tienes permiso para responder a esta quedada
 *       404:
 *         description: Quedada no encontrada
 *       500:
 *         description: Error del servidor
 */
router.put('/:meetupId/respond', respondMeetupValidator, validateRequest, respondToMeetup);

/**
 * @swagger
 * /api/meetups/{meetupId}/cancel:
 *   put:
 *     summary: Cancelar una quedada
 *     description: Cancela una quedada organizada por el usuario autenticado.
 *     tags: [Quedadas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: meetupId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la quedada a cancelar
 *     responses:
 *       200:
 *         description: Quedada cancelada correctamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No tienes permiso para cancelar esta quedada
 *       404:
 *         description: Quedada no encontrada
 *       500:
 *         description: Error del servidor
 */
router.put('/:meetupId/cancel', meetupIdValidator, validateRequest, cancelMeetup);

/**
 * @swagger
 * components:
 *   schemas:
 *     Meetup:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         title:
 *           type: string
 *           example: "Cena de amigos"
 *         description:
 *           type: string
 *           example: "Quedada para cenar juntos el viernes"
 *         date:
 *           type: string
 *           format: date-time
 *         location:
 *           type: string
 *           example: "Restaurante El Tubo, Zaragoza"
 *         organizer:
 *           type: string
 *           description: ID del usuario organizador
 *         invitedUsers:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               user:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [pending, accepted, rejected]
 *         status:
 *           type: string
 *           enum: [active, cancelled]
 *         createdAt:
 *           type: string
 *           format: date-time
 *       example:
 *         _id: "664b1f4e8f1b2c001c8e4e1a"
 *         title: "Cena de amigos"
 *         date: "2026-05-15T20:00:00Z"
 *         location: "Restaurante El Tubo, Zaragoza"
 *         status: "active"
 */

module.exports = router;