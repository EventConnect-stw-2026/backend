const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");

const eventRoutes = require("./routes/event.routes");
const authRoutes = require('./routes/auth.routes');
const friendsRoutes = require('./routes/friends.routes');
const chatRoutes = require('./routes/chat.routes');
const statsRoutes = require("./routes/stats.routes");
const adminRoutes = require('./routes/admin.routes');

const notFound = require("./middlewares/notFound");
const errorHandler = require("./middlewares/errorHandler");
const zaragozaRoutes = require("./routes/zaragoza.routes");

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
      url: 'http://localhost:3000',
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

app.use(helmet());
app.use(cors({
  origin: 'http://localhost:4200', // Cambia si tu frontend está en otro puerto/origen
  credentials: true
}));
app.use(morgan("dev"));
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

app.use(notFound);
app.use(errorHandler);

module.exports = app;