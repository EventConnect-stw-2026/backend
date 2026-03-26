const Event = require("../models/Event");
const User = require("../models/User");

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

const toggleAttendance = async (req, res, next) => {
  try {
    console.log("ESTO VA DENTRO DEL TOKEN:", req.user);
    const eventId = req.params.id;
    const userId = req.user.sub; 

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "Usuario no encontrado" });
    }
    const isAttending = user.attendedEvents.includes(eventId);

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
module.exports = {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  toggleAttendance
};