import { cookies, headers } from 'next/headers'
import { LANGUAGE_COOKIE, detectLanguageServer, type Language } from './language'

/**
 * Locale seam for Server Components / metadata, where the client
 * `LanguageContext` does not exist.
 *
 * Rule (shared with the root layout and the proxy): cookie → Accept-Language
 * → Spanish. The proxy also forwards `?lang=en` as a request cookie, so the
 * hreflang URLs in `seo.ts` render in the target language even for crawlers
 * that do not keep cookies.
 */
export type Locale = Language

export async function getServerLocale(): Promise<Locale> {
  try {
    const [cookieStore, headerList] = await Promise.all([cookies(), headers()])
    return detectLanguageServer(
      cookieStore.get(LANGUAGE_COOKIE)?.value,
      headerList.get('accept-language'),
    )
  } catch {
    // cookies()/headers() can throw in static contexts and unit tests.
    return 'es'
  }
}
