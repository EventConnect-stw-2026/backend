const express = require("express");
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const Event = require("../models/Event");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Mapa de categoría IA → categorías reales en la BD
const categoryMap = {
  deporte: ["Deporte"],
  musica: ["Música", "Música y Danza"],
  cultura: ["Teatro y Artes Escénicas", "Artes plásticas", "Cine", "Conferencias y Congresos", "Imagen y sonido", "Turismo"],
  gastronomia: ["Gastronomía"],
  social: ["Desarrollo personal", "Cursos y Talleres", "Formación", "Ocio y Juegos", "Idiomas"],
  naturaleza: ["Aire Libre y Excursiones", "Medio Ambiente y Naturaleza"],
};

router.post("/", async (req, res) => {
  try {
    const { companion, vibe } = req.body;

    console.log("BODY:", req.body);

    if (!companion || !vibe) {
      return res.status(400).json({ message: "Faltan parámetros" });
    }

    const companionText = {
      solo: "solo",
      pareja: "en pareja",
      grupo: "en grupo de amigos",
      familia: "en familia con niños",
    }[companion] ?? companion;

    const vibeText = {
      tranquilo: "algo tranquilo y relajado",
      emocionante: "algo emocionante y con adrenalina",
      exterior: "una actividad al aire libre",
      interior: "un plan bajo techo",
      gastronomico: "algo relacionado con gastronomía o buena comida",
      cultural: "algo cultural, artístico o con historia",
    }[vibe] ?? vibe;

    const prompt = `
Eres SpAlk, un asistente experto en recomendar planes en Zaragoza.

Tu función NO es inventar eventos.
Tu función es interpretar la intención del usuario para filtrar eventos reales en una base de datos.

El usuario quiere:
- Ir: ${companionText}
- Busca: ${vibeText}

Tu tarea:
1. Analiza la intención
2. Devuelve SOLO una categoría de evento de esta lista:
- deporte
- musica
- cultura
- gastronomia
- social
- naturaleza

Reglas:
- Responde SOLO con una palabra
- Sin frases
- Sin explicaciones
- Sin texto adicional
`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const aiCategory = result.response.text().trim().toLowerCase().replace(/[^a-záéíóúñ]/gi, '');

    console.log("IA CATEGORY:", aiCategory);

    const dbCategories = categoryMap[aiCategory] || ["Deporte"];

    const events = await Event.find({
      category: { $in: dbCategories },
      status: "active"
    })
      .sort({ startDate: 1 })
      .limit(6);

    console.log("EVENTS FOUND:", events.length);

    res.json({ events, category: aiCategory });

  } catch (error) {
    console.error("❌ ERROR EN /api/recommend:", error);
    res.status(500).json({ message: "Error interno" });
  }
});

module.exports = router;