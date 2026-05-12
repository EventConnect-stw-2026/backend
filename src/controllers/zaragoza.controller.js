/**
 * Aplicación: EventConnect - Plataforma de gestión de eventos
 * Archivo: zaragoza.controller.js
 * Descripción: Controlador para gestionar eventos de Zaragoza.
 * Autor: Pablo Báscones, Mario Caudevilla, Mario Hernández y David Borrel
 */
const Zaragoza = require("../services/zaragoza.service");
const importEvents = require("../services/importEvents.service");
const { runSync } = require("../jobs/syncEvents.job");

// Función para obtener eventos de Zaragoza con diferentes filtros
const getEvents = async (req, res, next) => {
  try {
    const { start = 0, rows = 10, today, search, id } = req.query;

    let data;
    if (id) {
      data = await Zaragoza.getEventById(id);
    } else if (today === 'true') {
      data = await Zaragoza.getTodayEvents();
    } else if (search) {
      data = await Zaragoza.searchEvents(search);
    } else {
      data = await Zaragoza.getEvents(start, rows);
    }

    res.json(data);
  } catch (error) {
    next(error);
  }
};

// Función para importar eventos de Zaragoza a nuestra base de datos
const importFromZaragoza = async (req, res, next) => {
  try {
    const result = await importEvents();
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

// Función para ejecutar manualmente la sincronización de eventos con Zaragoza
const manualSync = async (req, res, next) => {
  try {
    await runSync();
    res.json({ success: true, message: "Sync executed" });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getEvents,
  importFromZaragoza,
  manualSync
};