/**
 * Aplicación: EventConnect - Plataforma de gestión de eventos
 * Archivo: app.js
 * Descripción: Configuración principal de la aplicación Express, incluyendo middlewares, rutas y documentación Swagger.
 * Autor: Pablo Báscones, Mario Caudevilla, Mario Hernández y David Borrel
 */
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const logger = require("./utils/logger");

const eventRoutes = require("./routes/event.routes");
const authRoutes = require('./routes/auth.routes');
const friendsRoutes = require('./routes/friends.routes');
const chatRoutes = require('./routes/chat.routes');
const statsRoutes = require("./routes/stats.routes");
const adminRoutes = require('./routes/admin.routes');
const meetupRoutes = require('./routes/meetup.routes');

const notFound = require("./middlewares/notFound");
const errorHandler = require("./middlewares/errorHandler");
const zaragozaRoutes = require("./routes/zaragoza.routes");
const recommendRoutes = require('./routes/recommend.routes');
const aiRoutes = require("./routes/ai.routes");
const eventChatRoutes = require('./routes/event-chat.routes');
const reportRoutes = require('./routes/report.routes');

// Swagger
const swaggerUi = require('swagger-ui-express');
const swaggerJSDoc = require('swagger-jsdoc');

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'EventConnect API',
    version: '1.0.0',
    description: 'Documentación de la API REST de EventConnect',
  },
  servers: [
    {
      url: process.env.SERVER_URL || `http://localhost:${process.env.PORT || 3001}`,
      description: 'Servidor local',
    },
  ],
};

const options = {
  swaggerDefinition,
  apis: ['./src/routes/*.js'], // Puedes ajustar el path según tus rutas
};

const swaggerSpec = swaggerJSDoc(options);

const app = express();

app.use(helmet({
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' }
}));

const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.FRONTEND_URL_ALT,
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Permitir requests sin origin (Postman, curl)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true
}));

const morganFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(morgan(morganFormat, { stream: logger.stream }));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// Ruta Swagger UI
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get("/", (req, res) => {
  res.json({
    message: "API de EventConnect funcionando"
  });
});

app.use("/api/events", eventRoutes);
app.use("/api/zaragoza", zaragozaRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/friends", friendsRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/stats", statsRoutes);
app.use('/api/admin', adminRoutes);
app.use("/api/recommend", recommendRoutes);
app.use("/api/meetups", meetupRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/event-chat", eventChatRoutes);
app.use('/api/reports', reportRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;