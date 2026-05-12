/**
 * Aplicación: EventConnect - Plataforma de gestión de eventos
 * Archivo: event.validators.js
 * Descripción: Validadores para las rutas de gestión de eventos.
 * Autor: Pablo Báscones, Mario Caudevilla, Mario Hernández y David Borrel
 */
const { body, param } = require("express-validator");

const createEventValidator = [
  body("externalId")
    .notEmpty()
    .withMessage("externalId es obligatorio")
    .isString()
    .withMessage("externalId debe ser string"),

  body("title")
    .notEmpty()
    .withMessage("title es obligatorio")
    .isString()
    .withMessage("title debe ser string")
    .isLength({ max: 200 })
    .withMessage("title no puede superar 200 caracteres"),

  body("description")
    .notEmpty()
    .withMessage("description es obligatorio")
    .isString()
    .withMessage("description debe ser string")
    .isLength({ max: 5000 })
    .withMessage("description no puede superar 5000 caracteres"),

  body("category")
    .notEmpty()
    .withMessage("category es obligatoria")
    .isString()
    .withMessage("category debe ser string"),

  body("subcategory")
    .optional({ nullable: true })
    .isString()
    .withMessage("subcategory debe ser string"),

  body("startDate")
    .notEmpty()
    .withMessage("startDate es obligatorio")
    .isISO8601()
    .withMessage("startDate debe ser una fecha válida ISO8601"),

  body("endDate")
    .notEmpty()
    .withMessage("endDate es obligatorio")
    .isISO8601()
    .withMessage("endDate debe ser una fecha válida ISO8601"),

  body("locationName")
    .notEmpty()
    .withMessage("locationName es obligatorio")
    .isString()
    .withMessage("locationName debe ser string"),

  body("address")
    .optional({ nullable: true })
    .isString()
    .withMessage("address debe ser string"),

  body("latitude")
    .optional({ nullable: true })
    .isFloat({ min: -90, max: 90 })
    .withMessage("latitude debe ser un número válido entre -90 y 90"),

  body("longitude")
    .optional({ nullable: true })
    .isFloat({ min: -180, max: 180 })
    .withMessage("longitude debe ser un número válido entre -180 y 180"),

  body("imageUrl")
    .optional({ nullable: true })
    .isURL()
    .withMessage("imageUrl debe ser una URL válida"),

  body("sourceUrl")
    .optional({ nullable: true })
    .isURL()
    .withMessage("sourceUrl debe ser una URL válida"),

  body("status")
    .optional()
    .isIn(["active", "expired", "cancelled"])
    .withMessage("status no válido"),

  body("isFree")
    .optional()
    .isBoolean()
    .withMessage("isFree debe ser boolean")
];

const updateEventValidator = [
  param("id").isMongoId().withMessage("ID no válido"),

  body("externalId").optional().isString().withMessage("externalId debe ser string"),
  body("title")
    .optional()
    .isString()
    .withMessage("title debe ser string")
    .isLength({ max: 200 })
    .withMessage("title no puede superar 200 caracteres"),
  body("description")
    .optional()
    .isString()
    .withMessage("description debe ser string")
    .isLength({ max: 5000 })
    .withMessage("description no puede superar 5000 caracteres"),
  body("category").optional().isString().withMessage("category debe ser string"),
  body("subcategory").optional({ nullable: true }).isString().withMessage("subcategory debe ser string"),
  body("startDate").optional().isISO8601().withMessage("startDate debe ser una fecha válida"),
  body("endDate").optional().isISO8601().withMessage("endDate debe ser una fecha válida"),
  body("locationName").optional().isString().withMessage("locationName debe ser string"),
  body("address").optional({ nullable: true }).isString().withMessage("address debe ser string"),
  body("latitude").optional({ nullable: true }).isFloat({ min: -90, max: 90 }).withMessage("latitude no válida"),
  body("longitude").optional({ nullable: true }).isFloat({ min: -180, max: 180 }).withMessage("longitude no válida"),
  body("imageUrl").optional({ nullable: true }).isURL().withMessage("imageUrl debe ser una URL válida"),
  body("sourceUrl").optional({ nullable: true }).isURL().withMessage("sourceUrl debe ser una URL válida"),
  body("status").optional().isIn(["active", "expired", "cancelled"]).withMessage("status no válido"),
  body("isFree").optional().isBoolean().withMessage("isFree debe ser boolean")
];

const eventIdValidator = [
  param("id").isMongoId().withMessage("ID no válido")
];

module.exports = {
  createEventValidator,
  updateEventValidator,
  eventIdValidator
};