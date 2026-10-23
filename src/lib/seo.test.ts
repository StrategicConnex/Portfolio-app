import { describe, expect, it, vi } from 'vitest'
import { SITE } from './constants'

const localeState = vi.hoisted(() => ({ current: 'es' as 'es' | 'en' }))

vi.mock('./i18n-server', () => ({
  getServerLocale: async () => localeState.current,
}))

import { buildPageMetadata, absoluteUrl, localizedUrl } from './seo'

describe('seo.buildPageMetadata', () => {
  it('builds localized canonical, hreflang, Open Graph and Twitter metadata (es)', async () => {
    localeState.current = 'es'
    const meta = await buildPageMetadata('home')

    expect(meta.title).toBe('Juan Felipe Palacios — Ciberseguridad Industrial IT/OT · Neuquén')
    expect(meta.description).toContain('Oil & Gas')
    expect(meta.alternates?.canonical).toBe(SITE.url)
    expect(meta.alternates?.languages).toEqual({
      'es-AR': `${SITE.url}?lang=es`,
      en: `${SITE.url}?lang=en`,
    })
    expect(meta.openGraph?.locale).toBe('es_AR')
    expect(meta.openGraph?.alternateLocale).toBe('en_US')
    expect(meta.openGraph?.siteName).toBe(SITE.name)
    expect(meta.twitter).toMatchObject({ card: 'summary_large_image', creator: '@juanfpalacios' })
    expect(meta.robots).toMatchObject({ index: true, follow: true })
  })

  it('switches title, description and OG locale when the seam resolves en', async () => {
    localeState.current = 'en'
    const meta = await buildPageMetadata('home')
    expect(meta.title).toContain('Industrial IT/OT Cybersecurity')
    expect(meta.openGraph?.locale).toBe('en_US')
    expect(meta.openGraph?.alternateLocale).toBe('es_AR')
  })

  it('scopes the canonical to the page path', async () => {
    localeState.current = 'es'
    const meta = await buildPageMetadata('cyber-attack-map')
    expect(meta.alternates?.canonical).toBe(`${SITE.url}/cyber-attack-map`)
    expect(meta.openGraph?.url).toBe(`${SITE.url}/cyber-attack-map`)
    const rec = await buildPageMetadata('recursos')
    expect(rec.alternates?.canonical).toBe(`${SITE.url}/recursos`)
    const stats = await buildPageMetadata('estadisticas')
    expect(stats.alternates?.canonical).toBe(`${SITE.url}/estadisticas`)
  })

  it('maps home to the bare origin and localized URLs to ?lang=', () => {
    expect(absoluteUrl('/')).toBe(SITE.url)
    expect(absoluteUrl('/recursos')).toBe(`${SITE.url}/recursos`)
    expect(localizedUrl('en', '/recursos')).toBe(`${SITE.url}/recursos?lang=en`)
  })
})
