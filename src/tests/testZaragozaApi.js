/**
 * Aplicación: EventConnect - Plataforma de gestión de eventos
 * Archivo: testZaragozaApi.js
 * Descripción: Script para probar la conexión y respuesta de la API de Zaragoza, verificando los endpoints principales.
 * Autor: Pablo Báscones, Mario Caudevilla, Mario Hernández y David Borrel
 */

const axios = require("axios");

const BASE = process.env.ZARAGOZA_BASE_URL;

// Prueba de conexión a la API de Zaragoza y verificación de endpoints principales
async function testToday() {

  console.log("\nTEST eventos de hoy");

  const res = await axios.get(
    `${BASE}/servicio/cultura/evento/hoy`,
    { headers: { Accept: "application/json" } }
  );

  console.log("status:", res.status);

  console.log("estructura:", Object.keys(res.data));

  console.log("primer evento:", JSON.stringify(res.data.result?.[0] || res.data, null, 2).slice(0,400));

}

// Prueba del endpoint de listado de eventos, verificando paginación y estructura de respuesta
async function testList() {

  console.log("\nTEST listado eventos");

  const res = await axios.get(
    `${BASE}/servicio/cultura/evento/list`,
    {
      params: { rows: 5, start: 0 },
      headers: { Accept: "application/json" }
    }
  );

  console.log("status:", res.status);

  console.log("estructura:", Object.keys(res.data));

}

// Prueba del endpoint de detalle de evento, verificando que se obtiene la información correcta para un ID específico
async function testDetail() {

  console.log("\nTEST detalle evento");

  const id = 304335;

  const res = await axios.get(
    `${BASE}/servicio/cultura/evento/${id}`,
    { headers: { Accept: "application/json" } }
  );

  console.log("status:", res.status);

  console.log("estructura:", Object.keys(res.data));

}

// Ejecución secuencial de las pruebas, con manejo de errores para identificar posibles problemas de conexión o formato de respuesta
async function run() {

  try {

    await testToday();

    await testList();

    await testDetail();

  } catch (err) {

    console.error("ERROR:", err.response?.status, err.message);

  }

}

run();