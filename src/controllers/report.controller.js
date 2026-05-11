const Report = require('../models/Report');
const EventMessage = require('../models/EventMessage');
const Event = require('../models/Event');
const User = require('../models/User');
const logger = require('../utils/logger');

// POST /api/reports
async function createReport(req, res) {
  try {
    const reporterId = req.user?.sub;
    const { type, relatedId, description, reason, category, involvedUserId } = req.body;

    if (!type || !['comment', 'message', 'user', 'event'].includes(type)) {
      return res.status(400).json({ message: 'Tipo de reporte inválido' });
    }

    if (!description || description.trim().length === 0) {
      return res.status(400).json({ message: 'La descripción es obligatoria' });
    }

    if (!reason) {
      return res.status(400).json({ message: 'La razón es obligatoria' });
    }

    const reportData = {
      type,
      description: description.trim(),
      reason,
      category: category || (type === 'user' ? 'Usuarios' : type === 'event' ? 'Eventos' : 'Contenido'),
      reportedBy: reporterId
    };

    // Resolver involvedUser y relatedContent según tipo
    if (type === 'message') {
      if (!relatedId) return res.status(400).json({ message: 'Falta id del mensaje a reportar' });
      const msg = await EventMessage.findById(relatedId);
      if (!msg) return res.status(404).json({ message: 'Mensaje no encontrado' });
      reportData.involvedUser = msg.sender;
      reportData.relatedContent = msg._id;
    } else if (type === 'user') {
      const targetId = involvedUserId || relatedId;
      if (!targetId) return res.status(400).json({ message: 'Falta id del usuario a reportar' });
      const user = await User.findById(targetId);
      if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
      reportData.involvedUser = user._id;
      reportData.relatedContent = user._id;
    } else if (type === 'event') {
      if (!relatedId) return res.status(400).json({ message: 'Falta id del evento a reportar' });
      const event = await Event.findById(relatedId);
      if (!event) return res.status(404).json({ message: 'Evento no encontrado' });
      // Event may not have an owner; involvedUser optional
      reportData.relatedContent = event._id;
    } else if (type === 'comment') {
      // For future use (e.g., comments on posts). Try to resolve involvedUser if provided
      if (involvedUserId) {
        const u = await User.findById(involvedUserId);
        if (u) reportData.involvedUser = u._id;
      }
      if (relatedId) reportData.relatedContent = relatedId;
    }

    const newReport = await Report.create(reportData);

    return res.status(201).json({ success: true, data: newReport });
  } catch (error) {
    logger.error('CREATE REPORT ERROR', { error });
    return res.status(500).json({ message: 'Error al crear reporte' });
  }
}

// GET /api/reports/my
async function getMyReports(req, res) {
  try {
    const userId = req.user?.sub;
    const reports = await Report.find({ reportedBy: userId })
      .populate('involvedUser', 'name username')
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, data: reports });
  } catch (error) {
    logger.error('GET MY REPORTS ERROR', { error });
    return res.status(500).json({ message: 'Error al obtener tus reportes' });
  }
}

module.exports = { createReport, getMyReports };
