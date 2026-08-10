import { Inter, JetBrains_Mono, Space_Grotesk } from 'next/font/google'

/**
 * Fuentes self-hosted (SPEC §4): `next/font/google` descarga en build y sirve
 * desde `/_next/static/media/` (same-origin) — compatible con la CSP del repo
 * (`font-src 'self' data:`). Cero requests externas en runtime. Los nombres de
 * variable coinciden con los tokens del sistema de diseño (--font-sans,
 * --font-heading, --font-mono).
 */
export const fontSans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

export const fontHeading = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
})

export const fontMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})
