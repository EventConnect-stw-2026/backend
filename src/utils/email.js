/**
 * Aplicación: EventConnect - Plataforma de gestión de eventos
 * Archivo: email.js
 * Descripción: Funciones para enviar correos electrónicos.
 * Autor: Pablo Báscones, Mario Caudevilla, Mario Hernández y David Borrel
 */
const nodemailer = require('nodemailer');
const logger = require('./logger');

// Configuración del transporte de nodemailer utilizando variables de entorno para mayor seguridad y flexibilidad
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Función para enviar un correo electrónico, con manejo de errores y logging para facilitar el seguimiento de envíos
async function sendEmail({ to, subject, html }) {
  logger.info('Enviando email', { to });

  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html
  });

  logger.info('Email enviado', { to, messageId: info.messageId });

  return info;
}

module.exports = { sendEmail };