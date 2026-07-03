/**
 * Sentry Error Monitoring
 * 
 * Initializes Sentry for error tracking in production.
 * Gracefully no-ops when SENTRY_DSN is not set.
 * 
 * Setup:
 *   1. Create a Sentry project at https://sentry.io
 *   2. Get the DSN from Settings > Client Keys
 *   3. Add SENTRY_DSN to your .env
 */

const Sentry = require('@sentry/node');
const { logger } = require('./logger');

const isConfigured = !!process.env.SENTRY_DSN;

function initSentry(app) {
  if (!isConfigured) {
    logger.info('Sentry not configured — error monitoring disabled');
    return;
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
    integrations: [
      Sentry.httpIntegration(),
      Sentry.expressIntegration({ app }),
    ],
  });

  logger.info('Sentry initialized', { environment: process.env.NODE_ENV });
}

/**
 * Sentry error handler middleware (must be added after all routes)
 */
function sentryErrorHandler() {
  if (!isConfigured) {
    return (_err, _req, _res, next) => next(_err);
  }
  return Sentry.expressErrorHandler();
}

/**
 * Manually capture an exception (for use in catch blocks)
 */
function captureException(error, context = {}) {
  if (isConfigured) {
    Sentry.captureException(error, { extra: context });
  }
}

module.exports = { initSentry, sentryErrorHandler, captureException, isConfigured };
