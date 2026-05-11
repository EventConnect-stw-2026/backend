const nodemailer = require('nodemailer');
const logger = require('./logger');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

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