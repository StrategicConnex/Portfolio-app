import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import ArcTooltipPanel from './ArcTooltipPanel'

/**
 * El panel toma sus rótulos del diccionario real (no de un mock fijo): así
 * el test falla si una clave se renombra, se pierde o deja de traducirse.
 */
const state = vi.hoisted(() => ({ lang: 'es' as 'es' | 'en' }))

vi.mock('@/context/LanguageContext', async () => {
  const { translations } = await import('@/context/translations')
  return {
    useLanguage: () => ({
      language: state.lang,
      setLanguage: vi.fn(),
      t: (key: string) => translations[state.lang][key] ?? key,
    }),
  }
})

describe('ArcTooltipPanel', () => {
  beforeEach(() => {
    state.lang = 'es'
  })

  it('muestra la IP, el ASN, los reportes y el país de origen del arco', () => {
    render(
      <ArcTooltipPanel
        attack={{
          start: 'United States',
          originIp: '13.94.254.200',
          originAs: 'MICROSOFT-CORP-MSN-AS-BLOCK',
          reports: 319739,
          originIsIllustrative: false,
          type: 'Port Scan / Probe',
          source: 'DShield (SANS ISC)',
        }}
      />,
    )

    expect(screen.getByText('IP real')).toBeDefined()
    expect(screen.getByText('13.94.254.200')).toBeDefined()
    expect(screen.getByText('ASN')).toBeDefined()
    expect(screen.getByText('MICROSOFT-CORP-MSN-AS-BLOCK')).toBeDefined()
    expect(screen.getByText('Reportes')).toBeDefined()
    expect(screen.getByText('País de origen')).toBeDefined()
    expect(screen.getByText('United States')).toBeDefined()
    expect(screen.getByText('Port Scan / Probe')).toBeDefined()
    expect(screen.getByText('DShield (SANS ISC)')).toBeDefined()
  })

  it('avisa de que el origen del arco es ilustrativo', () => {
    render(
      <ArcTooltipPanel
        attack={{ start: 'China', originIsIllustrative: true, type: 'DDoS / Flood' }}
      />,
    )

    expect(screen.getByText('China (ilustrativo)')).toBeDefined()
    expect(screen.getByText(/Origen ilustrativo/)).toBeDefined()
  })

  it('traduce los rótulos cuando el sitio está en inglés', () => {
    state.lang = 'en'
    render(
      <ArcTooltipPanel
        attack={{
          start: 'United States',
          originIp: '13.94.254.200',
          originAs: 'MICROSOFT-CORP-MSN-AS-BLOCK',
          reports: 319739,
          originIsIllustrative: false,
          type: 'Port Scan / Probe',
          source: 'DShield (SANS ISC)',
        }}
      />,
    )

    expect(screen.getByText('Real IP')).toBeDefined()
    expect(screen.getByText('Reports')).toBeDefined()
    expect(screen.getByText('Origin country')).toBeDefined()
    expect(screen.getByText('13.94.254.200')).toBeDefined()
    // Los datos del proveedor no se traducen: son literales.
    expect(screen.getByText('DShield (SANS ISC)')).toBeDefined()
  })
})
