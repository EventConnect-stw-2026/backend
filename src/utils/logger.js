const path = require('path');
const fs = require('fs');
const winston = require('winston');

const logsDir = path.join(__dirname, '..', '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const { combine, timestamp, errors, json, colorize, printf, splat } = winston.format;

const consoleFormat = printf(({ level, message, timestamp: ts, stack, ...meta }) => {
  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  return `${ts} [${level}] ${stack || message}${metaStr}`;
});

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    splat(),
    json()
  ),
  defaultMeta: { service: 'eventconnect-api' },
  transports: [
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5 * 1024 * 1024,
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5 * 1024 * 1024,
      maxFiles: 5,
    }),
  ],
  exitOnError: false,
});

if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
  logger.add(new winston.transports.Console({
    format: combine(
      colorize(),
      timestamp({ format: 'HH:mm:ss' }),
      errors({ stack: true }),
      splat(),
      consoleFormat
    ),
  }));
}

logger.stream = {
  write: (message) => logger.http(message.trim()),
};

module.exports = logger;
