/* eslint-disable @typescript-eslint/no-explicit-any */
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
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return;

  try {
    // Dynamic import keeps the posthog bundle (~230 KB) out of the initial
    // page payload; it streams in on idle and events before `loaded` are
    // dropped exactly as they were before any client existed.
    void import('posthog-js')
      .then((mod) => {
        const posthog = (mod as { default: { init: (k: string, o: Record<string, unknown>) => void } }).default;
        posthog.init(key, {
          api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
          loaded: (ph: any) => {
            posthogClient = ph;
          },
        });
      })
      .catch(() => {
        console.warn('[PostHog] Failed to initialize');
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
    /** Telemetry-only fields (opened/message_sent). */
    viewport?: string;
    chars?: number;
    source?: string;
  },
): void {
  captureEvent(`ask_ai_${eventType}`, data as Record<string, unknown>);
}

/**
 * Track library (Recursos) event.
 */
export function trackLibraryEvent(
  eventType: 'download' | 'describe',
  data: {
    /** Path under public/, e.g. 'recursos/estandares/IEC_62443_resumen.docx'. */
    file: string;
    /** Category tab: vol1..vol5 | standards | project. */
    category: string;
    /** File format: DOCX | XLSX. */
    format: string;
    language?: string;
  },
): void {
  captureEvent(`library_${eventType}`, data as Record<string, unknown>);
}
