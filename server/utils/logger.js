/**
 * Winston Logger — Structured Logging
 * Request IDs, log levels, JSON format for production
 */

const winston = require('winston');
const path = require('path');

const isProduction = process.env.NODE_ENV === 'production';

// Custom format for development (readable)
const devFormat = winston.format.combine(
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} ${level}: ${message}${metaStr}`;
  })
);

// JSON format for production (structured, parseable)
const prodFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const logger = winston.createLogger({
  level: isProduction ? 'info' : 'debug',
  format: isProduction ? prodFormat : devFormat,
  defaultMeta: { service: 'stayfinder-api' },
  transports: [
    new winston.transports.Console(),
    // File transport for errors (always)
    new winston.transports.File({
      filename: path.join(__dirname, '..', 'logs', 'error.log'),
      level: 'error',
      maxsize: 5 * 1024 * 1024, // 5MB
      maxFiles: 3,
    }),
    // File transport for all logs (production)
    ...(isProduction ? [
      new winston.transports.File({
        filename: path.join(__dirname, '..', 'logs', 'combined.log'),
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5,
      }),
    ] : []),
  ],
});

/**
 * Express middleware: attach request ID and log requests
 */
const requestLogger = (req, res, next) => {
  const requestId = req.headers['x-request-id'] || 
    `req_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  
  req.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);

  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      requestId,
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.headers['user-agent']?.substring(0, 80),
      ...(req.user && { userId: req.user.id }),
    };

    if (res.statusCode >= 500) {
      logger.error('Server error', logData);
    } else if (res.statusCode >= 400) {
      logger.warn('Client error', logData);
    } else {
      logger.info('Request completed', logData);
    }
  });

  next();
};

module.exports = { logger, requestLogger };
