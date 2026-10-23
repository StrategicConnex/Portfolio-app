import { NextResponse, type NextRequest } from 'next/server'
import {
  LANGUAGE_COOKIE,
  LANGUAGE_COOKIE_MAX_AGE,
  detectLanguageServer,
  isLanguage,
} from '@/lib/language'
import {
  THEME_COOKIE,
  THEME_COOKIE_MAX_AGE,
  detectThemeServer,
  isThemePreference,
} from '@/lib/theme'

/**
 * Proxy (Next 16 — formerly middleware): guarantees the language cookie exists
 * on every page response.
 *
 * The root layout cannot set cookies during Server Component rendering (this
 * Next version does not support it), so the proxy is the only server-side
 * channel that establishes `portfolio_lang`. It derives the missing value with
 * the same seam rule the layout uses (cookie → Accept-Language → default), so
 * the cookie the client reads from `document.cookie` always matches what SSR
 * painted — and the client can render that language on hydration without ever
 * flipping the first paint.
 *
 * API routes are excluded: their responses do not carry the language cookie.
 */
export function proxy(request: NextRequest) {
  const existing = request.cookies.get(LANGUAGE_COOKIE)?.value
  const langParam = request.nextUrl.searchParams.get('lang')
  const requestedLang = isLanguage(langParam) ? langParam : null

  // `?lang=` is the crawlable language variant advertised by hreflang and the
  // sitemap. Crawlers do not keep cookies between requests, so the override is
  // forwarded to THIS render as a request cookie, and also persisted for the
  // browser session (SSR and hydration then agree on the same language).
  const requestHeaders = new Headers(request.headers)
  if (requestedLang) {
    const cookieParts = (requestHeaders.get('cookie') ?? '')
      .split(';')
      .map((part) => part.trim())
      .filter(Boolean)
      .filter((part) => !part.startsWith(`${LANGUAGE_COOKIE}=`))
    cookieParts.push(`${LANGUAGE_COOKIE}=${requestedLang}`)
    requestHeaders.set('cookie', cookieParts.join('; '))
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } })

  // Only (re)establish the cookie when it is missing or invalid — a valid
  // cookie is the user's persisted choice and must be left untouched.
  if (!isLanguage(existing) || requestedLang) {
    const lang =
      requestedLang ??
      detectLanguageServer(existing, request.headers.get('accept-language'))
    response.cookies.set(LANGUAGE_COOKIE, lang, {
      path: '/',
      maxAge: LANGUAGE_COOKIE_MAX_AGE,
      sameSite: 'lax',
    })
  }

  // Theme cookie — same contract as the language cookie: establish it when
  // missing so the inline no-flash script in the layout always has a value.
  // Valid persisted choices are left untouched.
  const existingTheme = request.cookies.get(THEME_COOKIE)?.value
  if (!isThemePreference(existingTheme)) {
    response.cookies.set(THEME_COOKIE, detectThemeServer(existingTheme), {
      path: '/',
      maxAge: THEME_COOKIE_MAX_AGE,
      sameSite: 'lax',
    })
  }

  return response
}

export const config = {
  matcher: [
    // Page routes only: exclude API routes, Next internals and static assets.
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
