const express = require("express");
const router = express.Router();

const { register, login, loginWithGoogle} = require("../controllers/auth.controller");

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