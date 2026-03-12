const { body } = require("express-validator");

const registerValidator = [
  body("name")
    .notEmpty()
    .withMessage("El nombre es obligatorio")
    .isLength({ min: 2, max: 100 })
    .withMessage("El nombre debe tener entre 2 y 100 caracteres"),

  body("username")
    .notEmpty()
    .withMessage("El nombre de usuario es obligatorio")
    .isLength({ min: 3, max: 30 })
    .withMessage("El nombre de usuario debe tener entre 3 y 30 caracteres"),
    
  body("email")
    .notEmpty()
    .withMessage("El email es obligatorio")
    .isEmail()
    .withMessage("Debe ser un email válido")
    .normalizeEmail(),

  body("password")
    .notEmpty()
    .withMessage("La contraseña es obligatoria")
    .isLength({ min: 6 })
    .withMessage("La contraseña debe tener al menos 6 caracteres")
];

const loginValidator = [
  body("email")
    .notEmpty()
    .withMessage("El email es obligatorio")
    .isEmail()
    .withMessage("Debe ser un email válido")
    .normalizeEmail(),

  body("password")
    .notEmpty()
    .withMessage("La contraseña es obligatoria")
];

module.exports = {
  registerValidator,
  loginValidator
};