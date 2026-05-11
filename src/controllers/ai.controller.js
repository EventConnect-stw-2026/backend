const Event = require("../models/Event");
const generateSummary = require("../services/aiSummary.service");
const logger = require("../utils/logger");

async function getSummary(req, res) {
  try {
    const { category, date } = req.body;

    const query = { status: "active" };

    if (category) query.category = category;

    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      query.startDate = { $gte: start, $lte: end };
    }

    const events = await Event.find(query)
      .sort({ startDate: 1 })
      .limit(8);

    const summary = await generateSummary(events);

    res.json({
      summary: summary.summary,
      highlights: summary.highlights,
      events
    });

  } catch (err) {
    logger.error('Error generando resumen', { error: err });
    res.status(500).json({ error: "Error generando resumen" });
  }
}

module.exports = { getSummary };