/**
 * Aplicación: EventConnect - Plataforma de gestión de eventos
 * Archivo: ai.routes.js
 * Descripción: Rutas para la inteligencia artificial.
 * Autor: Pablo Báscones, Mario Caudevilla, Mario Hernández y David Borrel
 */

const express = require("express");
const router = express.Router();

const { getSummary } = require("../controllers/ai.controller");


/**
 * @swagger
 * tags:
 *   name: IA
 *   description: Endpoints de inteligencia artificial
 */

/**
 * @swagger
 * /api/ai/summary:
 *   post:
 *     summary: Generar resumen inteligente de eventos
 *     tags: [IA]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               category:
 *                 type: string
 *                 nullable: true
 *                 example: "Deporte"
 *                 description: Categoría a filtrar. Null para todas.
 *               date:
 *                 type: string
 *                 nullable: true
 *                 format: date-time
 *                 example: "2026-04-29T00:00:00.000Z"
 *                 description: Fecha a filtrar. Null para todos.
 *     responses:
 *       200:
 *         description: Resumen generado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 summary:
 *                   type: string
 *                   example: "Esta semana predominan los eventos deportivos..."
 *                 highlights:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       text:
 *                         type: string
 *                         example: "Ruta por el Canal"
 *                       eventId:
 *                         type: string
 *                         example: "69f100b0df3b0b193388ca0c"
 *                 events:
 *                   type: array
 *                   items:
 *                     type: object
 *       500:
 *         description: Error generando resumen
 */
router.post("/summary", getSummary);

module.exports = router;