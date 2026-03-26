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

    const categoryStats = Object.keys(categoryCount).map(key => ({
      label: key,
      value: categoryCount[key],
      color: '#' + Math.floor(Math.random()*16777215).toString(16) // Un colorcito aleatorio
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
    // ¡AQUÍ ESTÁ NUESTRO DESCUBRIMIENTO DE ANTES (.sub)!
    const userId = req.user.sub; 

    // Buscamos al usuario y rellenamos los datos de sus eventos
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

    events.forEach(event => {
      if (event.category) categoryCount[event.category] = (categoryCount[event.category] || 0) + 1;
      if (event.startDate) {
        const dayName = daysMap[new Date(event.startDate).getDay()];
        dayCount[dayName]++;
      }
    });

    const topCategory = Object.keys(categoryCount).sort((a, b) => categoryCount[b] - categoryCount[a])[0] || 'Aún sin eventos';
    const busiestDay = Object.keys(dayCount).sort((a, b) => dayCount[b] - dayCount[a])[0] || 'Aún sin eventos';

    res.status(200).json({
      success: true,
      data: { friendsMet, eventsAttended, topCategory, busiestDay }
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