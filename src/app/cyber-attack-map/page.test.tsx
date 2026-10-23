import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import CyberAttackMapPage, { generateMetadata } from './page'

/**
 * La página del mapa es un Server Component: se renderiza con el idioma que
 * resuelve el seam de servidor (`cookie → Accept-Language → default`).
 *
 * El mapa 3D se sustituye por un stub: en jsdom no hay WebGL y lo que se
 * verifica aquí es el copy, la metadata y el montaje del componente real.
 */
vi.mock('@/features/portfolio/CyberAttackMap3D', () => ({
  default: () => <div data-testid="threat-map" />,
}))

const ES: Record<string, string> = {
  'threatmap.title': 'Mapa Global de Ciberataques en Tiempo Real',
  'threatmap.subtitle': 'Visualización 3D con datos reales de inteligencia de amenazas',
  'threatmap.intro': 'Cada arco parte de la IP real que DShield está reportando.',
  'threatmap.sources.title': 'Fuentes de Datos Reales',
  'threatmap.sources.ipwho': 'ipwho.is (respaldo de geolocalización)',
  'threatmap.features.title': 'Características',
  'threatmap.features.globe': 'Globo 3D interactivo',
  'threatmap.features.arcs': 'Arcos desde IPs reales',
  'threatmap.features.labels': 'Etiquetas de país',
  'threatmap.features.live': 'Actualización en tiempo real',
  'threatmap.features.types': 'Múltiples tipos de amenazas',
  'threatmap.controls.title': 'Controles',
  'threatmap.controls.drag': 'Arrastrar para rotar',
  'threatmap.controls.scroll': 'Scroll para zoom',
  'threatmap.controls.auto': 'Auto-rotación activa',
}

const EN: Record<string, string> = {
  'threatmap.title': 'Global Real-Time Cyber Attack Map',
  'threatmap.subtitle': '3D visualization with real threat intelligence data',
  'threatmap.intro': 'Every arc starts at the real IP DShield is reporting.',
  'threatmap.sources.title': 'Real Data Sources',
  'threatmap.sources.ipwho': 'ipwho.is (geolocation fallback)',
  'threatmap.features.title': 'Features',
  'threatmap.features.globe': 'Interactive 3D globe',
  'threatmap.features.arcs': 'Arcs from real IPs',
  'threatmap.features.labels': 'Country labels',
  'threatmap.features.live': 'Real-time updates',
  'threatmap.features.types': 'Multiple threat types',
  'threatmap.controls.title': 'Controls',
  'threatmap.controls.drag': 'Drag to rotate',
  'threatmap.controls.scroll': 'Scroll to zoom',
  'threatmap.controls.auto': 'Auto-rotation on',
}

const langState = vi.hoisted(() => ({ current: 'es' as 'es' | 'en' }))

vi.mock('@/lib/server-i18n', () => ({
  getServerT: async () => {
    const lang = langState.current
    const dict = lang === 'es' ? ES : EN
    return {
      language: lang,
      t: (key: string) => dict[key] || key,
      dict,
    }
  },
}))

// Metadata is built through the shared SEO seam, which resolves the locale on
// the server via `getServerLocale()`.
vi.mock('@/lib/i18n-server', () => ({
  getServerLocale: async () => langState.current,
}))

describe('/cyber-attack-map', () => {
  beforeEach(() => {
    langState.current = 'es'
  })

  it('paints the copy of the resolved language and mounts the map', async () => {
    const ui = await CyberAttackMapPage()
    render(ui)

    expect(screen.getByText('Mapa Global de Ciberataques en Tiempo Real')).toBeDefined()
    expect(screen.getByText('Fuentes de Datos Reales')).toBeDefined()
    expect(await screen.findByTestId('threat-map')).toBeDefined()
  })

  it('paints the English copy when the seam resolves English', async () => {
    langState.current = 'en'
    const ui = await CyberAttackMapPage()
    render(ui)

    expect(screen.getByText('Global Real-Time Cyber Attack Map')).toBeDefined()
    expect(screen.getByText('Real Data Sources')).toBeDefined()
    expect(screen.queryByText('Fuentes de Datos Reales')).toBeNull()
  })

  it('names the real providers and marks the geolocation fallback', async () => {
    const ui = await CyberAttackMapPage()
    render(ui)

    expect(screen.getByText(/DShield \(SANS Internet Storm Center\)/)).toBeDefined()
    expect(screen.getByText(/CISA KEV/)).toBeDefined()
    expect(screen.getByText(/ipwho\.is/)).toBeDefined()
  })

  it('publishes canonical metadata per language', async () => {
    const meta = await generateMetadata()
    expect(meta.title).toContain('Mapa Global de Ciberataques en Tiempo Real')
    expect(meta.alternates?.canonical).toBe(
      'https://juanpalacios.vercel.app/cyber-attack-map',
    )
    expect(meta.openGraph?.url).toBe('https://juanpalacios.vercel.app/cyber-attack-map')

    langState.current = 'en'
    const metaEn = await generateMetadata()
    expect(metaEn.title).toContain('Global Real-Time Cyber Attack Map')
  })
})

