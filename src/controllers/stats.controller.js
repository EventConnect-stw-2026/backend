/**
 * Aplicación: EventConnect - Plataforma de gestión de eventos
 * Archivo: stats.controller.js
 * Descripción: Controlador para gestionar estadísticas.
 * Autor: Pablo Báscones, Mario Caudevilla, Mario Hernández y David Borrel
 */
const User = require("../models/User");
const Event = require("../models/Event");

// 1. Estadísticas Globales
const getGlobalStats = async (req, res, next) => {
  try {
    const events = await Event.find();
    
    const categoryCount = {};
    const dayCount = { 'Dom': 0, 'Lun': 0, 'Mar': 0, 'Mié': 0, 'Jue': 0, 'Vie': 0, 'Sáb': 0 };
    const daysMap = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    events.forEach(event => {
      if (event.category) {
        categoryCount[event.category] = (categoryCount[event.category] || 0) + 1;
      }
      if (event.startDate) {
        const dayName = daysMap[new Date(event.startDate).getDay()];
        dayCount[dayName]++;
      }
    });

    const shortNames = {
      'Teatro y Artes Escénicas': 'Teatro',
      'Artes plásticas': 'Artes',
      'Cursos y Talleres': 'Talleres',
      'Ocio y Juegos': 'Ocio',
      'Desarrollo personal': 'Desarrollo',
      'Medio Ambiente y Naturaleza': 'Naturaleza',
      'Ciencia y Tecnología': 'Ciencia',
      'Ferias y Fiestas': 'Ferias',
      'Imagen y sonido': 'Imagen',
      'Visitas Turísticas': 'Turismo',
      'Conferencias y Congresos': 'Congresos',
      'Empleo y Empresa': 'Empleo',
      'Actividades vacacionales': 'Vacacional',
      'Aire Libre y Excursiones': 'Aire Libre',
    };

    const categoryStats = Object.keys(categoryCount).map(key => ({
      label: shortNames[key] || key,   // nombre corto si existe, si no el original
      value: categoryCount[key],
      color: '#' + Math.floor(Math.random() * 16777215).toString(16)
    })).sort((a, b) => b.value - a.value);

    const dayStats = Object.keys(dayCount).map(key => ({
      day: key,
      count: dayCount[key]
    }));

    res.status(200).json({ success: true, data: { categoryStats, dayStats } });
  } catch (error) {
    next(error);
  }
};

// 2. Estadísticas Personales del Usuario Logueado
const getPersonalStats = async (req, res, next) => {
  try {
    const userId = req.user.sub;
    const user = await User.findById(userId).populate("attendedEvents");

    if (!user) {
      return res.status(404).json({ success: false, message: "Usuario no encontrado" });
    }

    const events = user.attendedEvents || [];
    const friendsMet = user.friends ? user.friends.length : 0;
    const eventsAttended = events.length;

    const categoryCount = {};
    const dayCount = { 'Dom': 0, 'Lun': 0, 'Mar': 0, 'Mié': 0, 'Jue': 0, 'Vie': 0, 'Sáb': 0 };
    const daysMap = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    const getColor = () => {
      let color;
      do {
        const r = Math.floor(Math.random() * 256);
        const g = Math.floor(Math.random() * 256);
        const b = Math.floor(Math.random() * 256);
        // Descartamos colores demasiado claros (luminancia alta)
        const luminance = (r * 299 + g * 587 + b * 114) / 1000;
        if (luminance < 160) {
          color = `rgb(${r},${g},${b})`;
        }
      } while (!color);
      return color;
    };

    events.forEach(event => {
      if (event.category) categoryCount[event.category] = (categoryCount[event.category] || 0) + 1;
      if (event.startDate) {
        const dayName = daysMap[new Date(event.startDate).getDay()];
        dayCount[dayName]++;
      }
    });

    const topCategory = Object.keys(categoryCount).sort((a, b) => categoryCount[b] - categoryCount[a])[0] || null;
    const busiestDay = Object.keys(dayCount).sort((a, b) => dayCount[b] - dayCount[a])[0] || null;

    // Arrays para las gráficas — igual que en global pero del usuario
    const categoryStats = Object.keys(categoryCount).map(key => ({
      label: key,
      value: categoryCount[key],
      color: getColor()
    })).sort((a, b) => b.value - a.value);

    const dayStats = Object.keys(dayCount).map(key => ({
      day: key,
      count: dayCount[key]
    }));

    res.status(200).json({
      success: true,
      data: {
        friendsMet,
        eventsAttended,
        topCategory,
        busiestDay,
        categoryStats,   // nuevo
        dayStats         // nuevo
      }
    });

  } catch (error) {
    next(error);
  }
};

// 3. Estadísticas Generales del Sistema
const getSystemUserStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    res.status(200).json({
      success: true,
      data: { totalUsers }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getGlobalStats,
  getPersonalStats,
  getSystemUserStats
};