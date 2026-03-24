const express = require('express');
const cookieParser = require('cookie-parser');

const requireAuth = require('../middlewares/auth.middleware');
const requireAdmin = require('../middlewares/admin.middleware');
const { getDashboard, getUsers } = require('../controllers/admin.controller');

const router = express.Router();
router.use(cookieParser());

router.get('/dashboard', requireAuth, requireAdmin, getDashboard);
router.get('/users', requireAuth, requireAdmin, getUsers);

module.exports = router;
