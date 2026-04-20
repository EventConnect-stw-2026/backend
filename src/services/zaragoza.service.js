const axios = require("axios");

const BASE_URL = "https://www.zaragoza.es/sede/servicio/cultura/evento";

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
    console.error("[ZARAGOZA] Error getEvents:", err.message);
    throw err;
  }
}

async function getEventById(id) {
  try {
    const res = await client.get(`/${id}`);
    return res.data;
  } catch (err) {
    console.error("[ZARAGOZA] Error getEventById:", err.message);
    throw err;
  }
}

async function getTodayEvents() {
  try {
    const res = await client.get("/hoy");
    return res.data;
  } catch (err) {
    console.error("[ZARAGOZA] Error getTodayEvents:", err.message);
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
    console.error("[ZARAGOZA] Error searchEvents:", err.message);
    throw err;
  }
}

module.exports = {
  getEvents,
  getEventById,
  getTodayEvents,
  searchEvents
};