/**
 * Authentication Middleware
 * JWT verification and role-based access control
 */

const jwt = require('jsonwebtoken');
const { AppError } = require('./errorHandler');

/**
 * Verify JWT access token from Authorization header
 */
const authenticate = (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Access denied. No token provided.', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    next(error); // Let errorHandler handle JWT errors
  }
};

/**
 * Optional authentication — sets req.user if token present, but doesn't fail
 */
const optionalAuth = (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
      };
    }
  } catch {
    // Token invalid — continue as unauthenticated
    req.user = null;
  }
  next();
};

/**
 * Role-based authorization middleware factory
 * @param {...string} roles - Allowed roles
 */
const authorize = (...roles) => {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new AppError('Access denied. Not authenticated.', 401));
    }
    if (!roles.includes(req.user.role)) {
      return next(new AppError('Access denied. Insufficient permissions.', 403));
    }
    next();
  };
};

module.exports = { authenticate, optionalAuth, authorize };
