const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const eventRoutes = require("./routes/event.routes");
const notFound = require("./middlewares/notFound");
const errorHandler = require("./middlewares/errorHandler");

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "API de EventConnect funcionando"
  });
});

app.use("/api/events", eventRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;