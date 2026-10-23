/**
 * Consent seam (M-05).
 *
 * Single source of truth for the analytics/RUM consent decision. The portfolio
 * runs two non-essential trackers — PostHog and the SCAudit RUM script — and
 * neither may load until the visitor explicitly grants consent:
 *
 * - `readConsent()` → `unknown` | `granted` | `denied` (cookie-backed, so SSR
 *   and client agree and the choice survives navigation).
 * - `writeConsent()` persists the choice and notifies subscribers, so the
 *   tracker can start without a reload.
 * - `subscribeConsent()` is how `ObservabilityProvider` / `RumScript` react.
 * - `openConsentPreferences()` re-opens the banner (footer link) so a decision
 *   can be changed at any time.
 *
 * `unknown` is treated as **denied**: nothing loads before an explicit choice.
 * Essential error reporting (Sentry) is not gated by this seam.
 */

export type ConsentDecision = 'granted' | 'denied'
export type ConsentState = ConsentDecision | 'unknown'

export const CONSENT_COOKIE = 'portfolio_consent'
export const CONSENT_MAX_AGE = 31536000
export const CONSENT_CHANGE_EVENT = 'portfolio-consent-change'
export const CONSENT_OPEN_EVENT = 'portfolio-consent-open'

/** Normalizes any raw value (cookie, event detail) to a valid state. */
export function parseConsent(value: unknown): ConsentState {
  return value === 'granted' || value === 'denied' ? value : 'unknown'
}

/** Reads the persisted decision from the consent cookie. */
export function readConsent(): ConsentState {
  if (typeof document === 'undefined') return 'unknown'
  try {
    const match = document.cookie.match(
      new RegExp(`(?:^|;\\s*)${CONSENT_COOKIE}=([^;]*)`),
    )
    return parseConsent(match?.[1])
  } catch {
    return 'unknown'
  }
}

/** Persists a decision (1 year) and notifies live subscribers. */
export function writeConsent(decision: ConsentDecision): void {
  if (typeof document === 'undefined') return
  try {
    document.cookie = `${CONSENT_COOKIE}=${decision};path=/;max-age=${CONSENT_MAX_AGE};SameSite=Lax`
  } catch {
    // Storage blocked (private mode): the in-memory event still updates the UI.
  }
  notifyConsent(decision)
}

/** Broadcasts the current decision to listeners (same-tab, no reload). */
export function notifyConsent(state: ConsentState): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent<ConsentState>(CONSENT_CHANGE_EVENT, { detail: state }),
  )
}

/** Subscribes to consent changes. Returns the unsubscribe function. */
export function subscribeConsent(
  listener: (state: ConsentState) => void,
): () => void {
  if (typeof window === 'undefined') return () => {}
  const handler = (event: Event) => {
    listener(parseConsent((event as CustomEvent).detail))
  }
  window.addEventListener(CONSENT_CHANGE_EVENT, handler)
  return () => window.removeEventListener(CONSENT_CHANGE_EVENT, handler)
}

/** Re-opens the banner so the visitor can change a previous decision. */
export function openConsentPreferences(): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(CONSENT_OPEN_EVENT))
}
