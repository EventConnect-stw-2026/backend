const express = require("express");
const router = express.Router();

const { register, login } = require("../controllers/auth.controller");

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

module.exports = router;