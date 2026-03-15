const express = require("express");
const router = express.Router();

const { register, login, loginWithGoogle, refreshToken, logout, getProfile, updateProfile } = require("../controllers/auth.controller");
const cookieParser = require('cookie-parser');
const requireAuth = require('../middlewares/auth.middleware');
router.use(cookieParser());
router.get("/profile", requireAuth, getProfile);
router.put("/profile", requireAuth, updateProfile);
router.post("/refresh", refreshToken);
router.post("/logout", logout);

const validateRequest = require("../middlewares/validateRequest");

const {
  registerValidator,
  loginValidator
} = require("../validators/auth.validators");

router.post(
  "/register",
  registerValidator,
  validateRequest,
  register
);

router.post(
  "/login",
  loginValidator,
  validateRequest,
  login
);

router.post("/google", loginWithGoogle);

module.exports = router;