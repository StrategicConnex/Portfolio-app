import { NextResponse, type NextRequest } from 'next/server'
import {
  LANGUAGE_COOKIE,
  LANGUAGE_COOKIE_MAX_AGE,
  detectLanguageServer,
  isLanguage,
} from '@/lib/language'

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
  const response = NextResponse.next()
  const existing = request.cookies.get(LANGUAGE_COOKIE)?.value

  // Only (re)establish the cookie when it is missing or invalid — a valid
  // cookie is the user's persisted choice and must be left untouched.
  if (!isLanguage(existing)) {
    const lang = detectLanguageServer(
      existing,
      request.headers.get('accept-language'),
    )
    response.cookies.set(LANGUAGE_COOKIE, lang, {
      path: '/',
      maxAge: LANGUAGE_COOKIE_MAX_AGE,
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
