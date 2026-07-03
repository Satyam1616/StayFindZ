/**
 * Frontend Sentry Initialization
 * 
 * Initializes Sentry for client-side error tracking in production.
 * Gracefully no-ops when VITE_SENTRY_DSN is not set.
 *
 * Setup:
 *   1. Create a Sentry project at https://sentry.io
 *   2. Get the DSN from Settings > Client Keys
 *   3. Add VITE_SENTRY_DSN to your client .env
 */

import * as Sentry from '@sentry/react';

const isConfigured = !!import.meta.env.VITE_SENTRY_DSN;

export function initSentry() {
  if (!isConfigured) {
    console.log('[Sentry] Not configured — client error monitoring disabled');
    return;
  }

  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE || 'development',
    tracesSampleRate: import.meta.env.PROD ? 0.2 : 1.0,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: import.meta.env.PROD ? 1.0 : 0,
  });

  console.log('[Sentry] Initialized for', import.meta.env.MODE);
}

export { Sentry, isConfigured };
