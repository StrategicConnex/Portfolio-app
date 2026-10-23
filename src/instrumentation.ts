/**
 * Next.js instrumentation hook (server startup, once per instance).
 *
 * Initializes Sentry for the Node runtime so route handlers can report
 * unexpected 5xx errors through `captureError` / `reportRouteError`
 * (`src/lib/observability/sentry.ts`). The SDK is only imported when a DSN
 * is configured; deployments without Sentry keep zero overhead.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return

  const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN
  if (!dsn) return

  try {
    const Sentry = await import('@sentry/nextjs')
    Sentry.init({
      dsn,
      tracesSampleRate: 0.1,
      environment: process.env.NODE_ENV || 'development',
    })
  } catch {
    // Sentry is optional: never block server startup on telemetry.
  }
}
