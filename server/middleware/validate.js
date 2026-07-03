/**
 * Validation Middleware
 * Zod schema validation for request body, query, and params
 */

const { AppError } = require('./errorHandler');

/**
 * Creates validation middleware for a Zod schema
 * @param {Object} schema - Zod schema with optional body, query, params keys
 */
const validate = (schema) => {
  return (req, _res, next) => {
    try {
      if (schema.body) {
        req.body = schema.body.parse(req.body);
      }
      if (schema.query) {
        req.query = schema.query.parse(req.query);
      }
      if (schema.params) {
        req.params = schema.params.parse(req.params);
      }
      next();
    } catch (error) {
      next(error); // ZodError handled by errorHandler
    }
  };
};

module.exports = { validate };
