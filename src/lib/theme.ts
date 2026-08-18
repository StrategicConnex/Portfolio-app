/**
 * Theme seam — single source of truth for the portfolio's light/dark rule,
 * shared by the three sides that must never drift apart:
 *
 *   server  (layout.tsx + proxy.ts):  cookie → 'system' default
 *   client  (ThemeContext):           cookie → localStorage (deferred) → system
 *   head    (inline no-flash script): cookie → matchMedia → class on <html>
 *
 * The cookie (`portfolio_theme`) is the agreement channel: `src/proxy.ts`
 * guarantees it exists on every page response, so the inline script in the
 * head resolves the class BEFORE first paint — no flash, no hydration
 * mismatch. The resolved class is always either `light` or `dark` (never
 * absent), so every page paints one of the two themes deterministically.
 *
 * All rules are pure functions here — unit-testable without Next.js or a
 * browser. The inline script is a self-contained string so the layout can
 * inline it synchronously in `<head>`.
 */

export type ThemePreference = 'system' | 'light' | 'dark'
export type ResolvedTheme = 'light' | 'dark'

export const THEME_PREFERENCES: readonly ThemePreference[] = [
  'system',
  'light',
  'dark',
]

/** Default when nothing hints otherwise. */
export const DEFAULT_THEME_PREFERENCE: ThemePreference = 'system'

/** Cookie name used to persist the theme preference for SSR. */
export const THEME_COOKIE = 'portfolio_theme'

/** Max-age for the persistence cookie (1 year). */
export const THEME_COOKIE_MAX_AGE = 31536000

/** localStorage key — the deferred-preference channel (see below). */
export const THEME_STORAGE_KEY = 'portfolio-theme'

/** True when a raw value (cookie, localStorage) is a supported preference. */
export function isThemePreference(value: unknown): value is ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark'
}

/**
 * Resolve a preference to a concrete theme given the OS preference.
 * Pure: both callers (server, client, inline script) use the same rule.
 */
export function resolveTheme(
  preference: ThemePreference,
  systemPrefersDark: boolean,
): ResolvedTheme {
  if (preference === 'light') return 'light'
  if (preference === 'dark') return 'dark'
  return systemPrefersDark ? 'dark' : 'light'
}

/**
 * Server-side detection: cookie → default. The server cannot know the OS
 * preference, so `system` resolves to the safe default here; the inline
 * script corrects pre-paint on the client.
 */
export function detectThemeServer(
  cookieValue: string | null | undefined,
): ThemePreference {
  return isThemePreference(cookieValue) ? cookieValue : DEFAULT_THEME_PREFERENCE
}

/**
 * Client-side detection: cookie → localStorage (deferred) → default.
 * localStorage is deliberately NOT consulted on first paint (that would
 * reintroduce the flash) — it only re-establishes the cookie on mount when
 * the cookie is missing or stale (see `ThemeContext`).
 */
export function detectThemeClient(
  cookieValue: string | null | undefined,
  storedValue: string | null | undefined,
): ThemePreference {
  if (isThemePreference(cookieValue)) return cookieValue
  if (isThemePreference(storedValue)) return storedValue
  return DEFAULT_THEME_PREFERENCE
}

/** Read the theme cookie from `document.cookie` (browser only). */
export function readThemeCookie(): string | null {
  if (typeof document === 'undefined') return null
  const prefix = `${THEME_COOKIE}=`
  const found = document.cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix))
  return found ? found.slice(prefix.length) : null
}

/** Read the user's stored (localStorage) preference, if any. */
export function readStoredTheme(): ThemePreference | null {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY)
    return isThemePreference(saved) ? saved : null
  } catch {
    // Storage unavailable (private mode, blocked) — no stored preference
    return null
  }
}

export interface ThemeHydrationDecision {
  /** Preference for the current render — always agrees with SSR + the inline script. */
  preference: ThemePreference
  /** Preference to persist (re-establish the cookie) for the NEXT request, or null. */
  persist: ThemePreference | null
}

/**
 * Decide the flash-free hydration preference — same contract as the language
 * seam: stored choice agrees → nothing to write; stored choice diverges
 * (cookie cleared) → keep the SSR paint, re-establish the cookie for next
 * request; no stored choice → adopt the resolved preference as the choice.
 */
export function resolveHydrationTheme(
  cookieValue: string | null | undefined,
  storedValue: string | null | undefined,
): ThemeHydrationDecision {
  const preference = detectThemeClient(cookieValue, storedValue)
  const stored = isThemePreference(storedValue) ? storedValue : null
  if (stored === null) return { preference, persist: preference }
  if (stored === preference) return { preference, persist: null }
  return { preference, persist: stored }
}

/** Write both persistence channels so future SSR can agree with the client. */
export function persistTheme(pref: ThemePreference): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, pref)
    document.cookie = `${THEME_COOKIE}=${encodeURIComponent(pref)};path=/;max-age=${THEME_COOKIE_MAX_AGE};SameSite=Lax`
  } catch {
    // Silently ignore storage errors
  }
}

/**
 * Inline, synchronous no-flash script for `<head>`: reads the cookie (the
 * proxy guarantees it exists), resolves the theme against `matchMedia`, and
 * sets the `light`/`dark` class + `color-scheme` on `<html>` before the
 * browser paints anything. Safe to inline in a Server Component.
 */
export const THEME_INIT_SCRIPT = `(function () {
  try {
    var match = document.cookie.match(/(?:^|; )${THEME_COOKIE}=([^;]+)/);
    var pref = match ? decodeURIComponent(match[1]) : '${DEFAULT_THEME_PREFERENCE}';
    var systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var dark = pref === 'dark' || (pref === 'system' && systemDark);
    var cls = dark ? 'dark' : 'light';
    var el = document.documentElement;
    el.classList.remove('light', 'dark');
    el.classList.add(cls);
    el.style.colorScheme = dark ? 'dark' : 'light';
    var meta = document.querySelector('meta[name="color-scheme"]');
    if (meta) meta.setAttribute('content', dark ? 'dark' : 'light');
  } catch (e) {}
})();`
