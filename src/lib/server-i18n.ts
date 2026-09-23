import { cookies, headers } from 'next/headers'
import { detectLanguageServer, type Language } from '@/lib/language'
import { translations } from '@/context/translations'

/**
 * Server-side t() for Server Components. Resolves the language exactly as the
 * root layout does (cookie → Accept-Language → default) so SSR-painted pages
 * agree with the client on first paint.
 */
export async function getServerT(): Promise<{
  language: Language
  t: (key: string) => string
  dict: Record<string, string>
}> {
  const [cookieStore, headerList] = await Promise.all([cookies(), headers()])
  const language = detectLanguageServer(
    cookieStore.get('portfolio_lang')?.value,
    headerList.get('accept-language'),
  )
  const dict = translations[language]
  return { language, t: (key: string) => dict[key] || key, dict }
}
