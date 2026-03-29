const express = require("express");
const router = express.Router();
const controller = require("../controllers/zaragoza.controller");

/**
 * @swagger
 * tags:
 *   name: Zaragoza
 *   description: Endpoints para eventos externos de Zaragoza
 */

/**
 * @swagger
 * /api/zaragoza:
 *   get:
 *     summary: Obtener eventos de Zaragoza
 *     tags: [Zaragoza]
 *     parameters:
 *       - in: query
 *         name: start
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Índice de inicio para paginación
 *       - in: query
 *         name: rows
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Número de resultados a devolver
 *       - in: query
 *         name: today
 *         schema:
 *           type: boolean
 *         description: Si es true, devuelve solo los eventos de hoy
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Texto para buscar eventos
 *       - in: query
 *         name: id
 *         schema:
 *           type: string
 *         description: ID del evento concreto a obtener
 *     responses:
 *       200:
 *         description: Eventos obtenidos correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *             examples:
 *               lista:
 *                 summary: Lista de eventos
 *                 value: { totalCount: 100, result: [] }
 *               evento:
 *                 summary: Evento concreto
 *                 value: { id: "12345", title: "Evento ejemplo" }
 *       500:
 *         description: Error del servidor
 */
router.get("/", controller.getEvents);

/**
 * @swagger
 * /api/zaragoza/import:
 *   put:
 *     summary: Importar eventos desde la API de Zaragoza a la BD
 *     tags: [Zaragoza]
 *     responses:
 *       200:
 *         description: Eventos importados correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 imported:
 *                   type: integer
 *                   description: Número de eventos nuevos importados
 *                 updated:
 *                   type: integer
 *                   description: Número de eventos actualizados
 *       500:
 *         description: Error del servidor
 */
router.put("/import", controller.importFromZaragoza);

/**
 * @swagger
 * /api/zaragoza/sync:
 *   put:
 *     summary: Sincronizar manualmente eventos de Zaragoza
 *     tags: [Zaragoza]
 *     responses:
 *       200:
 *         description: Sincronización completada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       500:
 *         description: Error del servidor
 */
router.put("/sync", controller.manualSync);

module.exports = router;