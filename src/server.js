require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db");

const { startEventSync } = require("./jobs/syncEvents.job");


const PORT = process.env.PORT || 3000;

  const startServer = async () => {
    await connectDB();

    // Import automático solo si la BD está vacía
    await autoImport();

    app.listen(PORT, () => {
      console.log(`Servidor escuchando en http://localhost:${PORT}`);
    });

    startEventSync();
  };

  async function autoImport() {
    try {
      const Event = require('./models/Event');
      const count = await Event.countDocuments();
      if (count === 0) {
        console.log('BD vacía — importando eventos de Zaragoza...');
        const importEvents = require('./services/importEvents.service');
        const result = await importEvents();
        console.log(`Import completado: ${result.imported} importados, ${result.updated} actualizados`);
      } else {
        console.log(`BD ya tiene ${count} eventos — saltando import automático`);
      }
    } catch (err) {
      console.error('Error en import automático:', err.message);
      // No lanzamos el error para que el servidor arranque igualmente
    }
  }

startServer();