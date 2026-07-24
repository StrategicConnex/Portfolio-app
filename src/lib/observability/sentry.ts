/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any */
/**
 * Sentry SDK initialization for error tracking.
 * Only initializes if SENTRY_DSN is set.
 */

/**
 * Initialize Sentry error tracking.
 */
export function initSentry(): void {
  if (!process.env.SENTRY_DSN) return;
  try {
    const Sentry = require('@sentry/nextjs');
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      tracesSampleRate: 0.1,
      environment: process.env.NODE_ENV || 'development',
      beforeSend: (event: any) => {
        if (process.env.NODE_ENV === 'development') return null;
        return event;
      },
    });
  } catch {
    // Sentry not configured
  }
}

/**
 * Log an error to Sentry.
 */
export function captureError(error: Error, context?: Record<string, unknown>): void {
  if (!process.env.SENTRY_DSN) return;
  try {
    const Sentry = require('@sentry/nextjs');
    Sentry.captureException(error, { extra: context });
  } catch {
    // Silently fail
  }
}

/**
 * Log a message to Sentry.
 */
export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
  if (!process.env.SENTRY_DSN) return;
  try {
    const Sentry = require('@sentry/nextjs');
    Sentry.captureMessage(message, level);
  } catch {
    // Silently fail
  }
}
