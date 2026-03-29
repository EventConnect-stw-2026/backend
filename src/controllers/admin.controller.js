const User = require('../models/User');
const Event = require('../models/Event');
const Report = require('../models/Report');
const Settings = require('../models/Settings');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const FriendRequest = require('../models/FriendRequest');

async function getDashboard(req, res) {
  try {
    const [totalUsers, activeEvents, blockedUsers, totalEvents] = await Promise.all([
      User.countDocuments(),
      Event.countDocuments({ status: 'active' }),
      User.countDocuments({ isBlocked: true }),
      Event.countDocuments()
    ]);

    const upcomingEventsRaw = await Event.find({
      startDate: { $ne: null, $gte: new Date() }
    })
      .sort({ startDate: 1 })
      .limit(5)
      .select('title startDate status');

    const upcomingEvents = upcomingEventsRaw.map((event) => ({
      id: event._id,
      name: event.title,
      date: event.startDate,
      status: event.status,
      enrolled: 0
    }));

    // Obtener datos de actividad de los últimos 7 días
    const last7Days = [];
    const dayLabels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(today);
      dayStart.setDate(dayStart.getDate() - i);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      last7Days.push({
        dayStart,
        dayEnd,
        label: dayLabels[(dayStart.getDay() + 6) % 7]
      });
    }

    // Contar eventos creados por día
    const eventSignups = await Promise.all(
      last7Days.map(async (day) => {
        return Event.countDocuments({
          createdAt: { $gte: day.dayStart, $lt: day.dayEnd }
        });
      })
    );

    // Contar usuarios creados por día
    const userRegistrations = await Promise.all(
      last7Days.map(async (day) => {
        return User.countDocuments({
          createdAt: { $gte: day.dayStart, $lt: day.dayEnd }
        });
      })
    );

    // Contar reportes creados por día
    const reportsFiled = await Promise.all(
      last7Days.map(async (day) => {
        return Report.countDocuments({
          createdAt: { $gte: day.dayStart, $lt: day.dayEnd }
        });
      })
    );

    return res.status(200).json({
      stats: {
        totalUsers,
        activeEvents,
        totalRegistrations: totalEvents
      },
      upcomingEvents,
      activityData: {
        labels: last7Days.map((d) => d.label),
        eventSignups,
        userRegistrations,
        reportsFiled
      }
    });
  } catch (error) {
    console.error('Error en getDashboard:', error);
    return res.status(500).json({ message: 'Error al obtener dashboard de admin' });
  }
}

async function getUsers(req, res) {
  try {
    const users = await User.find()
      .sort({ createdAt: -1 })
      .select('name email role isBlocked createdAt');

    const mappedUsers = users.map((user) => ({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isBlocked: user.isBlocked,
      createdAt: user.createdAt
    }));

    return res.status(200).json({ users: mappedUsers });
  } catch (error) {
    return res.status(500).json({ message: 'Error al obtener usuarios de admin' });
  }
}

async function getEvents(req, res) {
  try {
    const events = await Event.find()
      .sort({ startDate: -1 })
      .select('title description category startDate status enrolled');

    const mappedEvents = events.map((event) => ({
      id: event._id,
      name: event.title,
      description: event.description,
      category: event.category || 'General',
      date: event.startDate,
      status: event.status === 'active' ? 'active' : 'pending',
      enrolled: event.enrolled || 0
    }));

    return res.status(200).json({ events: mappedEvents });
  } catch (error) {
    return res.status(500).json({ message: 'Error al obtener eventos de admin' });
  }
}

async function getEventDetail(req, res) {
  try {
    const { id } = req.params;
    const event = await Event.findById(id).select(
      'title description category startDate endDate locationName address imageUrl status enrolled isFree'
    );

    if (!event) {
      return res.status(404).json({ message: 'Evento no encontrado' });
    }

    return res.status(200).json({
      event: {
        id: event._id,
        title: event.title,
        description: event.description,
        category: event.category,
        startDate: event.startDate,
        endDate: event.endDate,
        location: event.locationName,
        address: event.address,
        imageUrl: event.imageUrl,
        status: event.status,
        enrolled: event.enrolled || 0,
        isFree: event.isFree
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error al obtener detalles del evento' });
  }
}

async function createEvent(req, res) {
  try {
    const { title, description, category, startDate, endDate, location, status, isFree } = req.body;

    if (!title || !description || !category || !location) {
      return res.status(400).json({ message: 'Faltan campos requeridos' });
    }

    const event = new Event({
      externalId: `admin-${Date.now()}`,
      title,
      description,
      category,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      locationName: location,
      status: status || 'active',
      isFree: isFree !== undefined ? isFree : true
    });

    await event.save();

    return res.status(201).json({
      message: 'Evento creado exitosamente',
      event: {
        id: event._id,
        title: event.title,
        category: event.category,
        status: event.status
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error al crear evento' });
  }
}

async function updateEvent(req, res) {
  try {
    const { id } = req.params;
    const { title, description, category, startDate, endDate, location, status, isFree } = req.body;

    // Validar que el evento existe
    const event = await Event.findOne({ _id: id });
    if (!event) {
      return res.status(404).json({ message: 'Evento no encontrado' });
    }

    // Actualizar solo los campos proporcionados
    if (title && title.trim()) event.title = title.trim();
    if (description && description.trim()) event.description = description.trim();
    if (category && category.trim()) event.category = category.trim();
    if (startDate && startDate.trim()) event.startDate = new Date(startDate);
    if (endDate && endDate.trim()) event.endDate = new Date(endDate);
    if (location && location.trim()) event.locationName = location.trim();
    if (status && status.trim()) event.status = status.trim();
    if (isFree !== undefined) event.isFree = isFree;

    // Guardar cambios
    await event.save();

    return res.status(200).json({
      message: 'Evento actualizado exitosamente',
      event: {
        id: event._id,
        title: event.title,
        category: event.category,
        status: event.status
      }
    });
  } catch (error) {
    console.error('Error al actualizar evento:', error);
    return res.status(500).json({ message: 'Error al actualizar evento' });
  }
}

async function deleteEvent(req, res) {
  try {
    const { id } = req.params;

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ message: 'Evento no encontrado' });
    }

    await Event.findByIdAndDelete(id);

    return res.status(200).json({ message: 'Evento eliminado exitosamente' });
  } catch (error) {
    return res.status(500).json({ message: 'Error al eliminar evento' });
  }
}

async function getReportsSummary(req, res) {
  try {
    const [totalReports, userReports, contentReports, eventReports] = await Promise.all([
      Report.countDocuments(),
      Report.countDocuments({ category: 'Usuarios' }),
      Report.countDocuments({ category: 'Contenido' }),
      Report.countDocuments({ category: 'Eventos' })
    ]);

    return res.status(200).json({
      summary: {
        totalReports,
        contentReports,
        userReports,
        eventReports
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error al obtener resumen de reportes' });
  }
}

async function getReports(req, res) {
  try {
    const { category } = req.query;

    let filter = {};
    if (category && ['Contenido', 'Usuarios', 'Eventos'].includes(category)) {
      filter.category = category;
    }

    const reports = await Report.find(filter)
      .populate('involvedUser', 'name username')
      .populate('reportedBy', 'name username')
      .sort({ createdAt: -1 })
      .select('type involvedUser reportedBy description reason category status createdAt');

    const mappedReports = reports.map((report) => ({
      id: report._id,
      type: mapReportType(report.type),
      involvedUser: report.involvedUser?.name || 'Usuario desconocido',
      involvedUsername: report.involvedUser?.username || 'unknown',
      description: report.description,
      reportedBy: report.reportedBy?.name || 'Anónimo',
      reason: mapReportReason(report.reason),
      date: new Date(report.createdAt).toLocaleDateString('es-ES'),
      category: report.category,
      status: report.status
    }));

    return res.status(200).json({ reports: mappedReports });
  } catch (error) {
    return res.status(500).json({ message: 'Error al obtener reportes de admin' });
  }
}

function mapReportType(type) {
  const typeMap = {
    'comment': 'Comentario inapropiado',
    'message': 'Mensaje privado',
    'user': 'Actividad sospechosa',
    'event': 'Posible SPAM'
  };
  return typeMap[type] || type;
}

function mapReportReason(reason) {
  const reasonMap = {
    'spam': 'Spam',
    'offensive_content': 'Contenido ofensivo',
    'inappropriate': 'Contenido inapropiado',
    'needs_urgent_review': 'Necesita revisión urgente',
    'other': 'Otro'
  };
  return reasonMap[reason] || reason;
}

async function getReportDetail(req, res) {
  try {
    const { id } = req.params;
    const report = await Report.findById(id)
      .populate('involvedUser', 'name username email role isBlocked createdAt')
      .populate('reportedBy', 'name username email')
      .populate('resolvedBy', 'name username');

    if (!report) {
      return res.status(404).json({ message: 'Reporte no encontrado' });
    }

    return res.status(200).json({
      report: {
        id: report._id,
        type: mapReportType(report.type),
        involvedUser: report.involvedUser?.name || 'Usuario desconocido',
        involvedUserId: report.involvedUser?._id,
        involvedUsername: report.involvedUser?.username,
        involvedUserEmail: report.involvedUser?.email,
        involvedUserRole: report.involvedUser?.role,
        involvedUserBlocked: report.involvedUser?.isBlocked,
        involvedUserCreatedAt: report.involvedUser?.createdAt,
        description: report.description,
        reportedBy: report.reportedBy?.name || 'Anónimo',
        reportedByUsername: report.reportedBy?.username,
        reason: mapReportReason(report.reason),
        reasonRaw: report.reason,
        category: report.category,
        status: report.status,
        resolution: report.resolution,
        resolvedBy: report.resolvedBy?.name || null,
        createdAt: report.createdAt,
        resolvedAt: report.resolvedAt
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error al obtener detalles del reporte' });
  }
}

async function resolveReport(req, res) {
  try {
    const { id } = req.params;
    const { resolution, action } = req.body;
    const adminId = req.user._id;

    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({ message: 'Reporte no encontrado' });
    }

    report.status = 'resolved';
    report.resolution = resolution || 'Reporte resuelto';
    report.resolvedBy = adminId;
    report.resolvedAt = new Date();
    await report.save();

    // Si la acción es banear, bloquear el usuario
    if (action === 'ban') {
      await User.findByIdAndUpdate(report.involvedUser, { isBlocked: true });
    }

    return res.status(200).json({
      message: 'Reporte resuelto exitosamente',
      report: {
        id: report._id,
        status: report.status,
        resolution: report.resolution,
        resolvedAt: report.resolvedAt
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error al resolver reporte' });
  }
}

async function rejectReport(req, res) {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.user._id;

    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({ message: 'Reporte no encontrado' });
    }

    report.status = 'rejected';
    report.resolution = reason || 'Reporte rechazado sin justificación';
    report.resolvedBy = adminId;
    report.resolvedAt = new Date();
    await report.save();

    return res.status(200).json({
      message: 'Reporte rechazado',
      report: {
        id: report._id,
        status: report.status,
        resolution: report.resolution,
        resolvedAt: report.resolvedAt
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error al rechazar reporte' });
  }
}

async function markReportUnderReview(req, res) {
  try {
    const { id } = req.params;
    const report = await Report.findByIdAndUpdate(id, { status: 'under_review' }, { new: true });

    if (!report) {
      return res.status(404).json({ message: 'Reporte no encontrado' });
    }

    return res.status(200).json({
      message: 'Reporte marcado bajo revisión',
      report: {
        id: report._id,
        status: report.status
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error al marcar reporte bajo revisión' });
  }
}

async function getSettings(req, res) {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }

    return res.status(200).json({
      settings: {
        general: {
          appName: settings.appName,
          description: settings.description,
          contactEmail: settings.contactEmail,
          contactPhone: settings.contactPhone,
          timezone: settings.timezone,
          defaultLanguage: settings.defaultLanguage
        },
        moderation: settings.moderation,
        notifications: settings.notifications,
        backup: settings.backup,
        maintenance: settings.maintenance
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error al obtener configuración' });
  }
}

async function updateGeneralSettings(req, res) {
  try {
    const { appName, description, contactEmail, contactPhone, timezone, defaultLanguage } = req.body;

    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }

    settings.appName = appName || settings.appName;
    settings.description = description || settings.description;
    settings.contactEmail = contactEmail || settings.contactEmail;
    settings.contactPhone = contactPhone || settings.contactPhone;
    settings.timezone = timezone || settings.timezone;
    settings.defaultLanguage = defaultLanguage || settings.defaultLanguage;

    await settings.save();

    return res.status(200).json({
      message: 'Configuración general actualizada',
      settings: {
        appName: settings.appName,
        description: settings.description,
        contactEmail: settings.contactEmail,
        contactPhone: settings.contactPhone,
        timezone: settings.timezone,
        defaultLanguage: settings.defaultLanguage
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error al actualizar configuración general' });
  }
}

async function updateModerationSettings(req, res) {
  try {
    const { requireEventApproval, autoDetectWords, autoBanAfterReports, notifyModeratorsOnReports, bannedWords } = req.body;

    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }

    settings.moderation.requireEventApproval = requireEventApproval !== undefined ? requireEventApproval : settings.moderation.requireEventApproval;
    settings.moderation.autoDetectWords = autoDetectWords !== undefined ? autoDetectWords : settings.moderation.autoDetectWords;
    settings.moderation.autoBanAfterReports = autoBanAfterReports !== undefined ? autoBanAfterReports : settings.moderation.autoBanAfterReports;
    settings.moderation.notifyModeratorsOnReports = notifyModeratorsOnReports !== undefined ? notifyModeratorsOnReports : settings.moderation.notifyModeratorsOnReports;

    if (bannedWords) {
      settings.moderation.bannedWords = typeof bannedWords === 'string' 
        ? bannedWords.split(',').map(word => word.trim())
        : bannedWords;
    }

    await settings.save();

    return res.status(200).json({
      message: 'Configuración de moderación actualizada',
      moderation: settings.moderation
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error al actualizar configuración de moderación' });
  }
}

async function updateNotificationSettings(req, res) {
  try {
    const { notifyReportedUsers, notifyFlaggedContent, weeklySummary, systemAlerts } = req.body;

    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }

    settings.notifications.notifyReportedUsers = notifyReportedUsers !== undefined ? notifyReportedUsers : settings.notifications.notifyReportedUsers;
    settings.notifications.notifyFlaggedContent = notifyFlaggedContent !== undefined ? notifyFlaggedContent : settings.notifications.notifyFlaggedContent;
    settings.notifications.weeklySummary = weeklySummary !== undefined ? weeklySummary : settings.notifications.weeklySummary;
    settings.notifications.systemAlerts = systemAlerts !== undefined ? systemAlerts : settings.notifications.systemAlerts;

    await settings.save();

    return res.status(200).json({
      message: 'Configuración de notificaciones actualizada',
      notifications: settings.notifications
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error al actualizar configuración de notificaciones' });
  }
}

async function getSystemStatus(req, res) {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }

    const userCount = await User.countDocuments();
    const eventCount = await Event.countDocuments();

    return res.status(200).json({
      status: {
        isOperational: true,
        systemLoad: '1.5%',
        lastUpdate: settings.maintenance.lastUpdate || new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 días
        lastBackup: settings.backup.lastBackup || new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 día
        nextBackup: new Date(Date.now() + 24 * 60 * 60 * 1000),
        backupFrequency: settings.backup.frequency,
        lastUpdateDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toLocaleDateString('es-ES')
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error al obtener estado del sistema' });
  }
}

async function clearCache(req, res) {
  try {
    // Simulamos limpiar caché - en producción sería con Redis
    return res.status(200).json({ message: 'Caché limpiado exitosamente' });
  } catch (error) {
    return res.status(500).json({ message: 'Error al limpiar caché' });
  }
}

async function optimizeDatabase(req, res) {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }

    settings.maintenance.lastUpdate = new Date();
    await settings.save();

    return res.status(200).json({ 
      message: 'Base de datos optimizada exitosamente',
      lastOptimization: new Date()
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error al optimizar base de datos' });
  }
}

async function downloadBackup(req, res) {
  try {
    // Simulamos descarga de respaldo
    return res.status(200).json({
      message: 'Respaldo generado',
      filename: `backup-${new Date().toISOString().split('T')[0]}.zip`,
      size: '2.3 MB'
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error al generar respaldo' });
  }
}

async function getUserDetail(req, res) {
  try {
    const { id } = req.params;
    const user = await User.findById(id)
      .select('name email username role isBlocked bio location avatarUrl createdAt');

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    return res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role,
        isBlocked: user.isBlocked,
        bio: user.bio,
        location: user.location,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error al obtener detalles del usuario' });
  }
}

async function blockUser(req, res) {
  try {
    const { id } = req.params;
    
    // No permitir bloquear a otro admin (solo a usuarios)
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    if (user.role === 'admin') {
      return res.status(403).json({ message: 'No puedes bloquear a otro admin' });
    }

    user.isBlocked = true;
    await user.save();

    return res.status(200).json({
      message: 'Usuario bloqueado exitosamente',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isBlocked: user.isBlocked
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error al bloquear usuario' });
  }
}

async function unblockUser(req, res) {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    user.isBlocked = false;
    await user.save();

    return res.status(200).json({
      message: 'Usuario desbloqueado exitosamente',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isBlocked: user.isBlocked
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error al desbloquear usuario' });
  }
}

async function deleteUser(req, res) {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // No permitir eliminar a otro admin
    if (user.role === 'admin') {
      return res.status(403).json({ message: 'No puedes eliminar a un admin' });
    }

    // Eliminar referencias del usuario en otras colecciones
    await Promise.all([
      Conversation.deleteMany({ participants: id }),
      Message.deleteMany({ sender: id }),
      Report.deleteMany({ involvedUserId: id }),
      Report.deleteMany({ reportedBy: id }),
      FriendRequest.deleteMany({ $or: [{ sender: id }, { receiver: id }] })
    ]);

    await User.findByIdAndDelete(id);

    return res.status(200).json({ message: 'Usuario eliminado exitosamente' });
  } catch (error) {
    return res.status(500).json({ message: 'Error al eliminar usuario' });
  }
}

module.exports = {
  getDashboard,
  getUsers,
  getEvents,
  getEventDetail,
  createEvent,
  updateEvent,
  deleteEvent,
  getReportsSummary,
  getReports,
  getReportDetail,
  resolveReport,
  rejectReport,
  markReportUnderReview,
  getUserDetail,
  blockUser,
  unblockUser,
  deleteUser,
  getSettings,
  updateGeneralSettings,
  updateModerationSettings,
  updateNotificationSettings,
  getSystemStatus,
  clearCache,
  optimizeDatabase,
  downloadBackup
};
