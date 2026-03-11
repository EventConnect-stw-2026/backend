const axios = require("axios");

const BASE_URL = "https://www.zaragoza.es/sede/servicio/cultura/evento.json";

async function fetchEvents({ start = 0, rows = 50, q = "" }) {

  const response = await axios.get(BASE_URL, {
    params: {
      start,
      rows,
      srsname: "wgs84",
      ...(q && { q })
    }
  });

  return response.data;
}

module.exports = {
  fetchEvents
};