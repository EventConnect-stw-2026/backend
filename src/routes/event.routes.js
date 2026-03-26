const express = require("express");
const router = express.Router();

const {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  toggleAttendance
} = require("../controllers/event.controller");

const validateRequest = require("../middlewares/validateRequest");
const requireAuth = require("../middlewares/auth.middleware");
const {
  createEventValidator,
  updateEventValidator,
  eventIdValidator
} = require("../validators/event.validators");

/**
 * @swagger
 * tags:
 *   name: Eventos
 *   description: Gestión de eventos
 */

/**
 * @swagger
 * /api/events:
 *   get:
 *     summary: Obtener todos los eventos
 *     tags: [Eventos]
 *     responses:
 *       200:
 *         description: Lista de eventos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Event'
 */
router.get("/", getAllEvents);

/**
 * @swagger
 * /api/events/{id}:
 *   get:
 *     summary: Obtener un evento por ID
 *     tags: [Eventos]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del evento
 *     responses:
 *       200:
 *         description: Evento encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Event'
 *       404:
 *         description: Evento no encontrado
 */
router.get("/:id", eventIdValidator, validateRequest, getEventById);

/**
 * @swagger
 * /api/events:
 *   post:
 *     summary: Crear un nuevo evento
 *     tags: [Eventos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EventInput'
 *     responses:
 *       201:
 *         description: Evento creado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Event'
 *       400:
 *         description: Datos inválidos
 */
router.post("/", createEventValidator, validateRequest, createEvent);

/**
 * @swagger
 * /api/events/{id}:
 *   put:
 *     summary: Actualizar un evento
 *     tags: [Eventos]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del evento
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EventInput'
 *     responses:
 *       200:
 *         description: Evento actualizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Event'
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Evento no encontrado
 */
router.put("/:id", updateEventValidator, validateRequest, updateEvent);

/**
 * @swagger
 * /api/events/{id}:
 *   delete:
 *     summary: Eliminar un evento
 *     tags: [Eventos]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del evento
 *     responses:
 *       204:
 *         description: Evento eliminado
 *       404:
 *         description: Evento no encontrado
 */
router.delete("/:id", eventIdValidator, validateRequest, deleteEvent);

router.post("/:id/attend", requireAuth, toggleAttendance);

/**
 * @swagger
 * components:
 *   schemas:
 *     Event:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: ID del evento
 *         title:
 *           type: string
 *           description: Título del evento
 *         description:
 *           type: string
 *           description: Descripción del evento
 *         date:
 *           type: string
 *           format: date-time
 *           description: Fecha y hora del evento
 *         location:
 *           type: string
 *           description: Ubicación del evento
 *         createdBy:
 *           type: string
 *           description: ID del usuario creador
 *         participants:
 *           type: array
 *           items:
 *             type: string
 *           description: IDs de los participantes
 *       example:
 *         _id: "624b1f4e8f1b2c001c8e4e1a"
 *         title: "Concierto de Rock"
 *         description: "Un concierto para los amantes del rock."
 *         date: "2024-05-01T20:00:00Z"
 *         location: "Sala Multiusos, Zaragoza"
 *         createdBy: "624b1f4e8f1b2c001c8e4e1b"
 *         participants: ["624b1f4e8f1b2c001c8e4e1b"]
 *     EventInput:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         date:
 *           type: string
 *           format: date-time
 *         location:
 *           type: string
 *       required:
 *         - title
 *         - date
 *         - location
 *       example:
 *         title: "Concierto de Rock"
 *         description: "Un concierto para los amantes del rock."
 *         date: "2024-05-01T20:00:00Z"
 *         location: "Sala Multiusos, Zaragoza"
 */
module.exports = router;