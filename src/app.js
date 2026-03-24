const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const eventRoutes = require("./routes/event.routes");
const authRoutes = require('./routes/auth.routes');
const friendsRoutes = require('./routes/friends.routes');
const chatRoutes = require('./routes/chat.routes');
const adminRoutes = require('./routes/admin.routes');

const notFound = require("./middlewares/notFound");
const errorHandler = require("./middlewares/errorHandler");
const zaragozaRoutes = require("./routes/zaragoza.routes");

const app = express();

app.use(helmet());
app.use(cors({
  origin: 'http://localhost:4200', // Cambia si tu frontend está en otro puerto/origen
  credentials: true
}));
app.use(morgan("dev"));
app.use(express.json({ limit: '10mb' }));

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
app.use('/api/admin', adminRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;