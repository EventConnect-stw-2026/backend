const express = require("express");
const router = express.Router();

const {
  register,
  login,
  loginWithGoogle,
  refreshToken,
  logout,
  getProfile,
  updateProfile,
  requestPasswordReset,
  resetPassword,
  getHistory,
  getAttending,
  getRecommendations
} = require("../controllers/auth.controller");

const cookieParser = require('cookie-parser');
const requireAuth = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Autenticación
 *   description: Registro, login y gestión de usuarios
 */

router.use(cookieParser());

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Obtener perfil del usuario autenticado
 *     tags: [Autenticación]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil del usuario
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: No autenticado
 */
router.get("/profile", requireAuth, getProfile);

/**
 * @swagger
 * /api/auth/profile:
 *   put:
 *     summary: Actualizar perfil del usuario autenticado
 *     tags: [Autenticación]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserUpdate'
 *     responses:
 *       200:
 *         description: Perfil actualizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autenticado
 */
router.put("/profile", requireAuth, updateProfile);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Renovar token de acceso
 *     tags: [Autenticación]
 *     responses:
 *       200:
 *         description: Nuevo token generado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 */
router.post("/refresh", refreshToken);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Cerrar sesión
 *     tags: [Autenticación]
 *     responses:
 *       200:
 *         description: Sesión cerrada correctamente
 */
router.post("/logout", logout);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Solicitar restablecimiento de contraseña
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email de recuperación enviado
 */
router.post("/forgot-password", requestPasswordReset);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Restablecer contraseña
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Contraseña restablecida
 *       400:
 *         description: Token inválido o expirado
 */
router.post("/reset-password", resetPassword);

const validateRequest = require("../middlewares/validateRequest");

const {
  registerValidator,
  loginValidator
} = require("../validators/auth.validators");

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Registrar un nuevo usuario
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserRegister'
 *     responses:
 *       201:
 *         description: Usuario registrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Datos inválidos
 */
router.post(
  "/register",
  registerValidator,
  validateRequest,
  register
);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Iniciar sesión
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserLogin'
 *     responses:
 *       200:
 *         description: Sesión iniciada correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *       400:
 *         description: Credenciales inválidas
 */
router.post(
  "/login",
  loginValidator,
  validateRequest,
  login
);

/**
 * @swagger
 * /api/auth/google:
 *   post:
 *     summary: Iniciar sesión con Google
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Sesión iniciada correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *       400:
 *         description: Token inválido
 */
router.post("/google", loginWithGoogle);

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       description: Datos del usuario autenticado (perfil propio)
 *       properties:
 *         _id:
 *           type: string
 *         name:
 *           type: string
 *           example: Juan Pérez
 *         username:
 *           type: string
 *           example: juanperez
 *         email:
 *           type: string
 *           example: juan@example.com
 *         role:
 *           type: string
 *           enum: [user, admin]
 *           example: user
 *         avatarUrl:
 *           type: string
 *           example: "https://example.com/avatar.jpg"
 *         bio:
 *           type: string
 *           example: "Amante de los eventos culturales"
 *         location:
 *           type: string
 *           example: "Zaragoza"
 *         interests:
 *           type: array
 *           items:
 *             type: string
 *           example: ["sports", "culture", "gastronomy"]
 *         isBlocked:
 *           type: boolean
 *           example: false
 *         attendedEvents:
 *           type: array
 *           items:
 *             type: string
 *           description: IDs de eventos a los que ha asistido
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     UserRegister:
 *       type: object
 *       required:
 *         - name
 *         - username
 *         - email
 *         - password
 *       properties:
 *         name:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *           example: Juan Pérez
 *         username:
 *           type: string
 *           minLength: 3
 *           maxLength: 30
 *           example: juanperez
 *         email:
 *           type: string
 *           format: email
 *           example: juan@example.com
 *         password:
 *           type: string
 *           minLength: 6
 *           example: "micontraseña123"
 *     UserLogin:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: juan@example.com
 *         password:
 *           type: string
 *           example: "micontraseña123"
 *     UserUpdate:
 *       type: object
 *       description: Campos actualizables del perfil. Todos son opcionales.
 *       properties:
 *         name:
 *           type: string
 *           example: Juan Pérez
 *         username:
 *           type: string
 *           example: juanperez
 *         avatarUrl:
 *           type: string
 *           example: "https://example.com/avatar.jpg"
 *         interests:
 *           type: array
 *           items:
 *             type: string
 *           example: ["sports", "culture"]
 *         passwordChange:
 *           type: object
 *           description: Incluir solo si se quiere cambiar la contraseña
 *           properties:
 *             currentPassword:
 *               type: string
 *             newPassword:
 *               type: string
 *               minLength: 6
 */

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * /api/auth/history:
 *   get:
 *     summary: Obtener historial de eventos asistidos
 *     description: Devuelve los últimos 20 eventos a los que el usuario ha asistido, ordenados del más reciente al más antiguo con los datos del evento populados.
 *     tags: [Autenticación]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Historial obtenido correctamente
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
 *                     $ref: '#/components/schemas/Event'
 *       401:
 *         description: No autenticado
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error del servidor
 */
router.get("/history", requireAuth, getHistory);
 
/**
 * @swagger
 * /api/auth/attending:
 *   get:
 *     summary: Obtener eventos futuros a los que el usuario va a asistir
 *     description: Devuelve los eventos con fecha futura (o sin fecha) en los que el usuario ha confirmado asistencia, con los datos del evento populados.
 *     tags: [Autenticación]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Eventos de asistencia obtenidos correctamente
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
 *                     $ref: '#/components/schemas/Event'
 *       401:
 *         description: No autenticado
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error del servidor
 */
router.get("/attending", requireAuth, getAttending);

/**
 * @swagger
 * /api/auth/recommendations:
 *   get:
 *     summary: Obtener recomendaciones personalizadas de eventos
 *     description: >
 *       Devuelve hasta `limit` eventos recomendados combinando dos fuentes con pesos distintos:
 *       categorías de eventos asistidos (peso 2, preferencia demostrada) e intereses del perfil (peso 1, preferencia declarada).
 *       Los slots por categoría son proporcionales al peso. Los eventos ya asistidos quedan excluidos.
 *       Los resultados se intercalan entre categorías para garantizar variedad.
 *       La sección aparece si el usuario tiene eventos asistidos O intereses declarados.
 *     tags: [Autenticación]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Número máximo de eventos a devolver
 *     responses:
 *       200:
 *         description: Recomendaciones obtenidas correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   example: 10
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Event'
 *                 categories:
 *                   type: array
 *                   description: Categorías usadas con su peso y slots asignados
 *                   items:
 *                     type: object
 *                     properties:
 *                       category:
 *                         type: string
 *                         example: Deporte
 *                       weight:
 *                         type: integer
 *                         example: 6
 *                         description: Peso total (2 por evento asistido + 1 por interés)
 *                       slots:
 *                         type: integer
 *                         example: 8
 *                         description: Número de eventos asignados a esta categoría
 *       401:
 *         description: No autenticado
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error del servidor
 */
router.get("/recommendations", requireAuth, getRecommendations);

module.exports = router;