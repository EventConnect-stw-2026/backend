const axios = require("axios");
const logger = require("../utils/logger");

const BASE_URL = process.env.ZARAGOZA_API_URL;

const client = axios.create({
  baseURL: BASE_URL,
  headers: {
    Accept: "application/json"
  },
  //timeout: 10000 // ⏱ evita cuelgues infinitos
});

async function getEvents(start = 0, rows = 10) {
  try {
    const res = await client.get("/list", {
      params: { start, rows },
    });

    return res.data;

  } catch (err) {
    logger.error('[ZARAGOZA] Error getEvents', { error: err.message });
    throw err;
  }
}

async function getEventById(id) {
  try {
    const res = await client.get(`/${id}`);
    return res.data;
  } catch (err) {
    logger.error('[ZARAGOZA] Error getEventById', { error: err.message });
    throw err;
  }
}

async function getTodayEvents() {
  try {
    const res = await client.get("/hoy");
    return res.data;
  } catch (err) {
    logger.error('[ZARAGOZA] Error getTodayEvents', { error: err.message });
    throw err;
  }
}

async function searchEvents(text) {
  try {
    const res = await client.get("/list", {
      params: { q: text }
    });

    return res.data;

  } catch (err) {
    logger.error('[ZARAGOZA] Error searchEvents', { error: err.message });
    throw err;
  }
}

module.exports = {
  getEvents,
  getEventById,
  getTodayEvents,
  searchEvents
};