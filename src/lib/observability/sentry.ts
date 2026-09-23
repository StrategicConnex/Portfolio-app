/**
 * Sentry SDK loader for error tracking.
 *
 * The SDK is imported lazily and only when a DSN is actually configured —
 * its bundle (which pulls in session-replay machinery) must never land in
 * the initial page payload of deployments that don't use Sentry.
 */
type SentryLike = {
  init: (opts: Record<string, unknown>) => void
  captureException: (e: Error, ctx?: Record<string, unknown>) => void
  captureMessage: (m: string, level?: string) => void
}

const DSN = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN

/** Initialize Sentry error tracking (no-op without a configured DSN). */
export async function initSentry(): Promise<void> {
  if (!DSN) return;
  try {
    const Sentry = (await import('@sentry/nextjs')) as unknown as SentryLike;
    Sentry.init({
      dsn: DSN,
      tracesSampleRate: 0.1,
      environment: process.env.NODE_ENV || 'development',
      beforeSend: (event: unknown) => {
        if (process.env.NODE_ENV === 'development') return null;
        return event;
      },
    });
  } catch {
    // Sentry not configured — silently skip
  }
}

/** Capture an exception with optional context (no-op without a DSN). */
export async function captureError(error: Error, context?: Record<string, unknown>): Promise<void> {
  if (!DSN) return;
  try {
    const Sentry = (await import('@sentry/nextjs')) as unknown as SentryLike;
    Sentry.captureException(error, { extra: context });
  } catch {
    // Silently fail
  }
}

/** Capture a message (no-op without a DSN). */
export async function captureMessage(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info',
): Promise<void> {
  if (!DSN) return;
  try {
    const Sentry = (await import('@sentry/nextjs')) as unknown as SentryLike;
    Sentry.captureMessage(message, level);
  } catch {
    // Silently fail
  }
}
