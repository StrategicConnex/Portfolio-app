import { getServerLocale } from '@/lib/i18n-server'
import type { Language } from '@/lib/language'
import { translations } from '@/context/translations'

/**
 * Server-side t() for Server Components. Resolves the language through the
 * shared locale seam (`getServerLocale`: cookie → Accept-Language → default)
 * so SSR-painted pages agree with the client on first paint.
 */
export async function getServerT(): Promise<{
  language: Language
  t: (key: string) => string
  dict: Record<string, string>
}> {
  const language = await getServerLocale()
  const dict = translations[language]
  return { language, t: (key: string) => dict[key] || key, dict }
}
