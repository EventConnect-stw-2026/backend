const User = require('../models/User');
const Event = require('../models/Event');
const Report = require('../models/Report');
const Settings = require('../models/Settings');

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

    return res.status(200).json({
      stats: {
        totalUsers,
        activeEvents,
        pendingModeration: blockedUsers,
        totalRegistrations: totalEvents
      },
      upcomingEvents
    });
  } catch (error) {
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

module.exports = {
  getDashboard,
  getUsers,
  getEvents,
  getReportsSummary,
  getReports,
  getSettings,
  updateGeneralSettings,
  updateModerationSettings,
  updateNotificationSettings,
  getSystemStatus,
  clearCache,
  optimizeDatabase,
  downloadBackup
};
