const express = require("express");
const router = express.Router();
const { 
  getGlobalStats, 
  getPersonalStats, 
  getSystemUserStats 
} = require("../controllers/stats.controller");

const requireAuth = require("../middlewares/auth.middleware");

/**
 * @swagger
 * tags:
 *   name: Estadísticas
 *   description: Estadísticas globales, personales y del sistema
 */

/**
 * @swagger
 * /api/stats/global:
 *   get:
 *     summary: Obtener estadísticas globales de eventos
 *     description: >
 *       Devuelve estadísticas globales de todos los eventos de la plataforma:
 *       número de eventos por categoría y por día de la semana. No requiere autenticación.
 *     tags: [Estadísticas]
 *     responses:
 *       200:
 *         description: Estadísticas globales obtenidas correctamente
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
 *                     categoryStats:
 *                       type: array
 *                       description: Eventos agrupados por categoría, ordenados de mayor a menor
 *                       items:
 *                         type: object
 *                         properties:
 *                           label:
 *                             type: string
 *                             example: Deporte
 *                           value:
 *                             type: integer
 *                             example: 42
 *                           color:
 *                             type: string
 *                             example: "#3a7bd5"
 *                     dayStats:
 *                       type: array
 *                       description: Eventos agrupados por día de la semana
 *                       items:
 *                         type: object
 *                         properties:
 *                           day:
 *                             type: string
 *                             example: Vie
 *                           count:
 *                             type: integer
 *                             example: 18
 *       500:
 *         description: Error del servidor
 */
router.get("/global", getGlobalStats);

/**
 * @swagger
 * /api/stats/community:
 *   get:
 *     summary: Obtener estadísticas generales de la comunidad
 *     description: Devuelve el número total de usuarios registrados en la plataforma. No requiere autenticación.
 *     tags: [Estadísticas]
 *     responses:
 *       200:
 *         description: Estadísticas de la comunidad obtenidas correctamente
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
 *                     totalUsers:
 *                       type: integer
 *                       example: 1250
 *       500:
 *         description: Error del servidor
 */
router.get("/community", getSystemUserStats);

/**
 * @swagger
 * /api/stats/personal:
 *   get:
 *     summary: Obtener estadísticas personales del usuario autenticado
 *     description: >
 *       Devuelve estadísticas personales basadas en los eventos a los que ha asistido el usuario:
 *       total de eventos asistidos, amigos conocidos, categoría más frecuente, día más activo,
 *       y gráficas de eventos por categoría y por día de la semana.
 *     tags: [Estadísticas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas personales obtenidas correctamente
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
 *                     eventsAttended:
 *                       type: integer
 *                       example: 12
 *                       description: Total de eventos a los que ha asistido
 *                     friendsMet:
 *                       type: integer
 *                       example: 5
 *                       description: Número de amigos en la plataforma
 *                     topCategory:
 *                       type: string
 *                       example: Deporte
 *                       description: Categoría de evento más frecuente
 *                       nullable: true
 *                     busiestDay:
 *                       type: string
 *                       example: Sáb
 *                       description: Día de la semana con más eventos asistidos
 *                       nullable: true
 *                     categoryStats:
 *                       type: array
 *                       description: Eventos del usuario agrupados por categoría
 *                       items:
 *                         type: object
 *                         properties:
 *                           label:
 *                             type: string
 *                             example: Música
 *                           value:
 *                             type: integer
 *                             example: 4
 *                           color:
 *                             type: string
 *                             example: "rgb(45,120,200)"
 *                     dayStats:
 *                       type: array
 *                       description: Eventos del usuario agrupados por día de la semana
 *                       items:
 *                         type: object
 *                         properties:
 *                           day:
 *                             type: string
 *                             example: Vie
 *                           count:
 *                             type: integer
 *                             example: 3
 *       401:
 *         description: No autenticado
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error del servidor
 */
router.get("/personal", requireAuth, getPersonalStats);

module.exports = router;