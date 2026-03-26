const express = require("express");
const router = express.Router();
const { 
  getGlobalStats, 
  getPersonalStats, 
  getSystemUserStats 
} = require("../controllers/stats.controller");

// Importamos a nuestro querido portero
const requireAuth = require("../middlewares/auth.middleware"); 

router.get("/global", getGlobalStats);
router.get("/community", getSystemUserStats); 
router.get("/personal", requireAuth, getPersonalStats); 

module.exports = router;