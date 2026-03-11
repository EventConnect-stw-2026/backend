const express = require("express");
const router = express.Router();
const controller = require("../controllers/zaragoza.controller");

router.get("/events", controller.getExternalEvents);

module.exports = router;