/**
 * Aplicación: EventConnect - Plataforma de gestión de eventos
 * Archivo: aiSummary.service.js
 * Descripción: Servicio para generar resúmenes inteligentes de eventos.
 * Autor: Pablo Báscones, Mario Caudevilla, Mario Hernández y David Borrel
 */

const { GoogleGenerativeAI } = require("@google/generative-ai");
const logger = require("../utils/logger");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function generateSummary(events) {
  try {
    if (!events || events.length === 0) {
      return {
        summary: "No hay eventos para este criterio.",
        highlights: []
      };
    }

    const simplified = events.slice(0, 20).map(e => ({
      id: e._id.toString(),
      titulo: e.title,
      categoria: e.category,
      fecha: e.startDate
    }));

    const prompt = `
Eres un sistema que analiza eventos en Zaragoza.

Tu tarea tiene DOS PARTES:

1. Generar un RESUMEN general (5 a 10 líneas)
- Describe tendencias (categorías, tipos de eventos)
- NO menciones nombres concretos
- NO recomiendes

2. Seleccionar 3 a 5 eventos destacados

FORMATO (JSON PURO, sin markdown, sin bloques de código):

{
  "summary": "texto con saltos de línea",
  "highlights": [
    { "text": "breve descripción", "eventId": "id" }
  ]
}

EVENTOS:
${JSON.stringify(simplified, null, 2)}
`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);

    if (!result || !result.response) throw new Error("Respuesta IA inválida");

    let text = result.response.text();
    if (!text) throw new Error("Texto vacío de IA");

    logger.debug('IA RAW', { text });

    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}') + 1;

    if (jsonStart === -1) throw new Error("No JSON found");

    const cleanJson = text.slice(jsonStart, jsonEnd);

    let parsed;
    try {
      parsed = JSON.parse(cleanJson);
    } catch (err) {
      logger.warn('FALLBACK PARSE ACTIVADO', { error: err.message });
      return {
        summary: text.substring(0, 500),
        highlights: events.slice(0, 3).map(e => ({
          text: e.title,
          eventId: e._id.toString()
        }))
      };
    }

    return {
      summary: parsed.summary || "",
      highlights: (parsed.highlights || []).map(h => ({
        ...h,
        eventId: h.eventId?.toString() || ""
      }))
    };

  } catch (err) {
    logger.error('ERROR IA', { error: err });
    return {
      summary: "No se pudo generar el resumen.",
      highlights: events.slice(0, 3).map(e => ({
        text: e.title,
        eventId: e._id.toString()
      }))
    };
  }
}

module.exports = generateSummary;