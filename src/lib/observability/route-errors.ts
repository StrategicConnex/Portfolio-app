import { captureError } from './sentry'

/**
 * Reports an unexpected route-handler failure to Sentry.
 *
 * Contract:
 * - **Server-only** and fire-and-forget: reporting must never delay, alter or
 *   crash the response that is already being built.
 * - No-op when no DSN is configured (`captureError` owns that check).
 * - Accepts `unknown` so both `Error` and thrown values (strings, framework
 *   errors) are captured with the same shape.
 */
export function reportRouteError(
  route: string,
  error: unknown,
  context: Record<string, unknown> = {},
): void {
  const normalized = error instanceof Error ? error : new Error(String(error))
  void captureError(normalized, { route, ...context })
}
