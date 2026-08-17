/**
 * Language detection seam.
 *
 * Single source of truth for the portfolio's language rule, shared by the
 * three sides that must never drift apart:
 *
 *   server  (layout.tsx + proxy.ts):  cookie → Accept-Language → default
 *   client  (LanguageContext):        cookie → navigator.language → default
 *
 * The cookie is the agreement channel between both sides: `src/proxy.ts`
 * guarantees it exists on every page response (the layout cannot set cookies
 * during Server Component rendering), so the value the client reads from
 * `document.cookie` always matches what SSR painted. On hydration the client
 * renders that same language — the first paint never flips.
 *
 * The localStorage value is the user's *deferred* preference: when it differs
 * from the cookie (cookie expired/cleared while the choice persisted),
 * `resolveHydrationLanguage` keeps the SSR first paint but re-establishes the
 * cookie from the stored choice, so the NEXT request honors it — without ever
 * flashing a language change on the current one.
 *
 * All rules are pure functions here — unit-testable without Next.js or a
 * browser.
 */

export type Language = 'es' | 'en'

export const LANGUAGES: readonly Language[] = ['es', 'en']

/** Default when nothing hints otherwise. */
export const DEFAULT_LANGUAGE: Language = 'es'

/** Cookie name used to persist language preference for SSR. */
export const LANGUAGE_COOKIE = 'portfolio_lang'

/** Max-age for the persistence cookie (1 year). */
export const LANGUAGE_COOKIE_MAX_AGE = 31536000

/** True when a raw value (cookie, localStorage) is a supported language. */
export function isLanguage(value: unknown): value is Language {
  return value === 'es' || value === 'en'
}

/**
 * Server-side detection: cookie → Accept-Language → default.
 *
 * Purely functional: both arguments come from `cookies()` / `headers()` in
 * the root layout (and from the request in `proxy.ts`). An explicit `es`
 * cookie wins over an English Accept-Language header (user choice beats
 * browser hint).
 */
export function detectLanguageServer(
  cookieValue: string | null | undefined,
  acceptLanguage: string | null | undefined,
): Language {
  if (cookieValue === 'en') return 'en'
  if (cookieValue === 'es') return 'es'
  if (!cookieValue && (acceptLanguage ?? '').startsWith('en')) return 'en'
  return DEFAULT_LANGUAGE
}

/**
 * Client-side detection: cookie → navigator.language → default.
 *
 * The cookie is the same signal SSR used, so both sides agree. localStorage
 * is deliberately NOT consulted here: it is the deferred-preference channel
 * (see `resolveHydrationLanguage`), and letting it win on first paint is
 * exactly what produced the post-hydration language flash.
 */
export function detectLanguageClient(
  cookieValue: string | null | undefined,
): Language {
  if (cookieValue === 'en') return 'en'
  if (cookieValue === 'es') return 'es'
  try {
    const navLang = navigator.language?.toLowerCase() || ''
    if (navLang.startsWith('en')) return 'en'
  } catch {
    // navigator unavailable — fall through to default
  }
  return DEFAULT_LANGUAGE
}

/** Read the language cookie from `document.cookie` (browser only). */
export function readLanguageCookie(): string | null {
  if (typeof document === 'undefined') return null
  const prefix = `${LANGUAGE_COOKIE}=`
  const found = document.cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix))
  return found ? found.slice(prefix.length) : null
}

/** Read the user's stored (localStorage) preference, if any. */
export function readStoredPreference(): Language | null {
  try {
    const saved = localStorage.getItem(LANGUAGE_COOKIE)
    return isLanguage(saved) ? saved : null
  } catch {
    // Storage unavailable (private mode, blocked) — no stored preference
    return null
  }
}

export interface HydrationDecision {
  /**
   * Language for the first painted render — always agrees with what SSR
   * painted, so hydration never flips the visible language.
   */
  language: Language
  /**
   * Language to persist (re-establish the agreement channel) so the NEXT
   * request honors the user's stored choice. Null when nothing to write.
   */
  persist: Language | null
}

/**
 * Decide the flash-free hydration language.
 *
 * - No stored preference (first visit): adopt the resolved language as the
 *   user's choice so future requests agree.
 * - Stored preference agrees with the cookie: nothing to write.
 * - Stored preference diverges (cookie expired/cleared): keep the SSR first
 *   paint (no flash) but re-establish the cookie from the stored choice for
 *   the next request.
 */
export function resolveHydrationLanguage(
  cookieValue: string | null | undefined,
  storedPreference: string | null | undefined,
): HydrationDecision {
  const language = detectLanguageClient(cookieValue)
  const stored = isLanguage(storedPreference) ? storedPreference : null
  if (stored === null) return { language, persist: language }
  if (stored === language) return { language, persist: null }
  return { language, persist: stored }
}

/** Write both persistence channels so future SSR can agree with the client. */
export function persistLanguage(lang: Language): void {
  try {
    localStorage.setItem(LANGUAGE_COOKIE, lang)
    document.cookie = `${LANGUAGE_COOKIE}=${lang};path=/;max-age=${LANGUAGE_COOKIE_MAX_AGE};SameSite=Lax`
  } catch {
    // Silently ignore storage errors
  }
}
