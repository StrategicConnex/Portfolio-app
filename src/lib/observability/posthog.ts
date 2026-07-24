/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any */
/**
 * PostHog analytics client for the Ask AI Copilot.
 * Only initializes if NEXT_PUBLIC_POSTHOG_KEY is set.
 */

let posthogClient: any = null;

/**
 * Initialize PostHog analytics (client-side only).
 */
export function initPosthog(): void {
  if (typeof window === 'undefined') return;
  if (posthogClient) return;
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;

  try {
    const posthog = require('posthog-js');
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
      loaded: (ph: any) => {
        posthogClient = ph;
      },
    });
  } catch {
    console.warn('[PostHog] Failed to initialize');
  }
}

/**
 * Capture a telemetry event.
 */
export function captureEvent(event: string, properties?: Record<string, unknown>): void {
  if (!posthogClient) return;
  try {
    posthogClient.capture(event, properties);
  } catch {
    // Silently fail
  }
}

/**
 * Track AI conversation event.
 */
export function trackAiEvent(
  eventType: string,
  data: {
    language?: string;
    mode?: string;
    messageCount?: number;
    hasTools?: boolean;
    latencyMs?: number;
    tokenCount?: number;
    finishReason?: string;
  },
): void {
  captureEvent(`ask_ai_${eventType}`, data as Record<string, unknown>);
}
