const Event = require("../models/Event");

const getAllEvents = async (req, res, next) => {
  try {
    const events = await Event.find().sort({ startDate: 1 });

    res.status(200).json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (error) {
    next(error);
  }
};

const getEventById = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Evento no encontrado"
      });
    }

    res.status(200).json({
      success: true,
      data: event
    });
  } catch (error) {
    next(error);
  }
};

const createEvent = async (req, res, next) => {
  try {
    const existingEvent = await Event.findOne({ externalId: req.body.externalId });

    if (existingEvent) {
      return res.status(409).json({
        success: false,
        message: "Ya existe un evento con ese externalId"
      });
    }

    const event = await Event.create(req.body);

    res.status(201).json({
      success: true,
      message: "Evento creado correctamente",
      data: event
    });
  } catch (error) {
    next(error);
  }
};

const updateEvent = async (req, res, next) => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Evento no encontrado"
      });
    }

    res.status(200).json({
      success: true,
      message: "Evento actualizado correctamente",
      data: event
    });
  } catch (error) {
    next(error);
  }
};

const deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Evento no encontrado"
      });
    }

    res.status(200).json({
      success: true,
      message: "Evento eliminado correctamente"
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent
};