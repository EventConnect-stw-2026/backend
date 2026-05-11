/**
 * TEST para comprobar que la API no está caída
 */
const axios = require("axios");

const BASE = process.env.ZARAGOZA_BASE_URL;

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