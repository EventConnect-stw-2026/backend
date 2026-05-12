/**
 * Aplicación: EventConnect - Plataforma de gestión de eventos
 * Archivo: meetup.validators.js
 * Descripción: Validadores para las rutas de gestión de quedadas.
 * Autor: Pablo Báscones, Mario Caudevilla, Mario Hernández y David Borrel
 */
const { body, param } = require('express-validator');

const createMeetupValidator = [
  body('eventId')
    .notEmpty().withMessage('El eventId es obligatorio')
    .isMongoId().withMessage('El eventId debe ser un ObjectId válido'),

  body('friendIds')
    .isArray({ min: 1 }).withMessage('Debes seleccionar al menos un amigo'),

  body('friendIds.*')
    .isMongoId().withMessage('Todos los friendIds deben ser ObjectId válidos'),

  body('meetupDateTime')
    .notEmpty().withMessage('La fecha y hora de la quedada es obligatoria')
    .isISO8601().withMessage('La fecha y hora debe tener formato válido'),

  body('meetupPlace')
    .trim()
    .notEmpty().withMessage('El lugar de la quedada es obligatorio')
    .isLength({ max: 200 }).withMessage('El lugar no puede superar los 200 caracteres')
];

const meetupIdValidator = [
  param('meetupId')
    .isMongoId().withMessage('El meetupId debe ser un ObjectId válido')
];

const respondMeetupValidator = [
  ...meetupIdValidator,
  body('response')
    .isIn(['accepted', 'rejected']).withMessage('La respuesta debe ser accepted o rejected')
];

module.exports = {
  createMeetupValidator,
  meetupIdValidator,
  respondMeetupValidator
};