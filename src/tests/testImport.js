/**
 * Aplicación: EventConnect - Plataforma de gestión de eventos
 * Archivo: testImport.js
 * Descripción: Script para probar la importación de datos.
 * Autor: Pablo Báscones, Mario Caudevilla, Mario Hernández y David Borrel
 */
const axios = require("axios");

// Prueba de importación de datos desde la API de Zaragoza, verificando que se ejecuta correctamente y devuelve el resultado esperado
async function testImport() {
  const res = await axios.post(`${process.env.SERVER_URL}/api/zaragoza/import`);
  console.log(res.data);
}
testImport();