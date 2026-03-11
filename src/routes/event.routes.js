const express = require("express");
const router = express.Router();

const {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent
} = require("../controllers/event.controller");

const validateRequest = require("../middlewares/validateRequest");
const {
  createEventValidator,
  updateEventValidator,
  eventIdValidator
} = require("../validators/event.validator");

router.get("/", getAllEvents);

router.get("/:id", eventIdValidator, validateRequest, getEventById);

router.post("/", createEventValidator, validateRequest, createEvent);

router.put("/:id", updateEventValidator, validateRequest, updateEvent);

router.delete("/:id", eventIdValidator, validateRequest, deleteEvent);

module.exports = router;