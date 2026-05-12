/**
 * Aplicación: EventConnect - Plataforma de gestión de eventos
 * Archivo: event.controller.js
 * Descripción: Controlador para gestionar eventos.
 * Autor: Pablo Báscones, Mario Caudevilla, Mario Hernández y David Borrel
 */
const Event = require("../models/Event");
const User = require("../models/User");
const logger = require("../utils/logger");

// GET /api/events
const getAllEvents = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      status = "active",
      search,
      dateFrom, 
      dateTo    
    } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (search) filter.$text = { $search: search };
    if (dateFrom || dateTo) {
      filter.startDate = {};
      
      if (dateFrom) {
        filter.startDate.$gte = new Date(dateFrom); 
      }
      
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setUTCHours(23, 59, 59, 999);
        filter.startDate.$lte = endDate;
      }
    }

    const skip = (page - 1) * limit;

    const [events, total] = await Promise.all([
      Event.find(filter).sort({ startDate: 1 }).skip(skip).limit(Number(limit)),
      Event.countDocuments(filter)
    ]);
    res.status(200).json({
      success: true,
      count: events.length,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
      data: events
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/events/:id
// Función para obtener un evento por su ID
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

// Función para crear un nuevo evento
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

// Función para actualizar un evento existente
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

// Función para eliminar un evento
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

// Función para apuntarse o desapuntarse de un evento
const toggleAttendance = async (req, res, next) => {
  try {
    logger.debug('toggleAttendance - token user', { user: req.user });
    const eventId = req.params.id;
    const userId = req.user.sub; 

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "Usuario no encontrado" });
    }
    // .toString() necesario porque attendedEvents son ObjectIds, no strings
    const isAttending = user.attendedEvents.some(id => id.toString() === eventId);

    if (isAttending) {
      await User.findByIdAndUpdate(userId, { $pull: { attendedEvents: eventId } });
      res.status(200).json({ success: true, message: "Te has desapuntado del evento", isAttending: false });
    } else {
      await User.findByIdAndUpdate(userId, { $addToSet: { attendedEvents: eventId } });
      res.status(200).json({ success: true, message: "¡Apuntado al evento!", isAttending: true });
    }
  } catch (error) {
    next(error);
  }
};

// Función para obtener eventos destacados, próximos, esta semana y recientes
const getEventSections = async (req, res, next) => {
  try {
    const now = new Date();

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const endOfWeek = new Date();
    endOfWeek.setDate(now.getDate() + 7);

    const baseFilter = {
      status: "active",
      startDate: { $ne: null }
    };

    const [featured, today, week, recent] = await Promise.all([

      // TEMPORAL → destacados = próximos
      Event.find(baseFilter)
        .sort({ startDate: 1 })
        .limit(10),

      Event.find({
        ...baseFilter,
        startDate: { $gte: startOfToday, $lte: endOfToday }
      })
        .sort({ startDate: 1 })
        .limit(10),

      Event.find({
        ...baseFilter,
        startDate: { $gte: now, $lte: endOfWeek }
      })
        .sort({ startDate: 1 })
        .limit(10),

      Event.find(baseFilter)
        .sort({ syncedAt: -1 })
        .limit(10)
    ]);

    res.status(200).json({
      success: true,
      data: {
        featured,
        today,
        week,
        recent
      }
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
  deleteEvent,
  toggleAttendance,
  getEventSections
};