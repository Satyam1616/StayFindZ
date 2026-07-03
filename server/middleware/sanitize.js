/**
 * XSS Sanitization Middleware
 * Strips dangerous HTML/script tags from user-generated text fields.
 * Applied to routes that accept free-text input (listings, reviews, profiles).
 */

const xss = require('xss');

// Fields that should be sanitized (user-generated text content)
const TEXT_FIELDS = ['title', 'description', 'comment', 'name', 'address', 'city', 'country'];

/**
 * Recursively sanitize string values in an object
 */
function sanitizeObject(obj, fields = TEXT_FIELDS) {
  if (!obj || typeof obj !== 'object') return obj;

  const sanitized = { ...obj };
  for (const key of Object.keys(sanitized)) {
    if (typeof sanitized[key] === 'string' && fields.includes(key)) {
      sanitized[key] = xss(sanitized[key], {
        whiteList: {},          // Strip ALL HTML tags
        stripIgnoreTag: true,   // Remove unknown tags entirely
        stripIgnoreTagBody: ['script', 'style'], // Remove script/style content
      });
    }
  }
  return sanitized;
}

/**
 * Express middleware — sanitizes req.body text fields
 */
const sanitizeInput = (req, _res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  next();
};

module.exports = { sanitizeInput, sanitizeObject };
