/**
 * Error Handling Middleware
 * Centralized error handler for consistent API responses
 */

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

const notFoundHandler = (req, _res, next) => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
};

const errorHandler = (err, _req, res, _next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Prisma known request errors
  if (err.code === 'P2002') {
    statusCode = 409;
    const field = err.meta?.target?.join(', ') || 'field';
    message = `A record with this ${field} already exists.`;
  }

  if (err.code === 'P2025') {
    statusCode = 404;
    message = 'Record not found.';
  }

  // Zod validation errors
  if (err.name === 'ZodError' || err.constructor?.name === 'ZodError') {
    statusCode = 400;
    message = 'Validation error';
    const issues = err.errors || err.issues || [];
    return res.status(statusCode).json({
      status: 'error',
      message,
      errors: issues.map((e) => ({
        field: (e.path || []).join('.'),
        message: e.message,
      })),
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token.';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired.';
  }

  // Log server errors in development
  if (statusCode >= 500 && process.env.NODE_ENV === 'development') {
    console.error('💥 Server Error:', err);
  }

  res.status(statusCode).json({
    status: 'error',
    message,
    ...(process.env.NODE_ENV === 'development' && statusCode >= 500 && {
      stack: err.stack,
    }),
  });
};

module.exports = { AppError, errorHandler, notFoundHandler };
