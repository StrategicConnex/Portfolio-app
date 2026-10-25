import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ToolCallCard } from './ToolCallCard'
import { finalizeReportSpec } from '@/features/ask-ai/lib/reports/schema'

vi.mock('@/context/LanguageContext', () => ({
  useLanguage: () => ({ language: 'es', t: (key: string) => key }),
}))

vi.mock('../reports/report-export', () => ({ downloadReport: vi.fn() }))

const reportSpec = finalizeReportSpec(
  {
    type: 'threat-landscape',
    title: 'Panorama de amenazas',
    summary: 'Resumen',
    sections: [
      {
        heading: 'Orígenes',
        body: 'China lidera.',
        evidence: [{ source: 'DShield (SANS ISC)', mode: 'live' }],
      },
    ],
  },
  { locale: 'es', generatedAt: '2026-10-24T12:00:00.000Z' },
)

const threatSummary = {
  fetchedAt: '2026-10-25T12:00:00.000Z',
  dataSource: 'live' as const,
  sourceStatus: { dshield: 'live' as const, kev: 'live' as const },
  cacheTtlSeconds: { dshield: 60, kev: 60 },
  totals: { events: 12, kev: 3 },
  topCountries: [{ country: 'China', count: 4 }],
  topTypes: [{ type: 'Port Scan / Probe', count: 5 }],
  events: [
    {
      id: 'e1',
      source: 'DShield',
      type: 'Port Scan / Probe',
      originCountry: 'China',
      originIp: '203.0.113.7',
      timestamp: '2026-10-25T11:59:00.000Z',
      severity: 'critical' as const,
    },
  ],
  provenance: [{ source: 'DShield (SANS ISC)', mode: 'live' as const }],
}

describe('ToolCallCard rich results', () => {
  it('renders the generated report with its export actions', () => {
    render(
      <ToolCallCard
        toolInvocation={{
          toolName: 'generateReport',
          state: 'result',
          result: { data: reportSpec },
        }}
      />,
    )

    expect(screen.getByText('Panorama de amenazas')).toBeDefined()
    expect(screen.getByText('Orígenes')).toBeDefined()
    expect(screen.getByRole('button', { name: /markdown/i })).toBeDefined()
    expect(screen.getByRole('button', { name: /json/i })).toBeDefined()
    expect(screen.getByRole('button', { name: /pdf/i })).toHaveProperty('disabled', true)
  })

  it('renders the live threat-intel card with provenance and a VirusTotal link', () => {
    render(
      <ToolCallCard
        toolInvocation={{
          toolName: 'getThreatIntel',
          state: 'result',
          result: { data: threatSummary },
        }}
      />,
    )

    expect(screen.getByRole('region', { name: 'Inteligencia de amenazas en vivo' })).toBeDefined()
    expect(screen.getByText('EN VIVO')).toBeDefined()
    expect(screen.getByText(/DShield · CISA KEV/)).toBeDefined()
    const link = screen.getByRole('link', { name: /203\.0\.113\.7 en VirusTotal/i })
    expect(link.getAttribute('href')).toBe(
      'https://www.virustotal.com/gui/ip-address/203.0.113.7',
    )
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.getAttribute('rel')).toBe('noopener noreferrer')
  })

  it('labels degraded data as a sample instead of live events', () => {
    render(
      <ToolCallCard
        toolInvocation={{
          toolName: 'getThreatIntel',
          state: 'result',
          result: { data: { ...threatSummary, dataSource: 'degraded' } },
        }}
      />,
    )

    expect(screen.getByText('DEGRADADO')).toBeDefined()
    expect(screen.getByText(/Muestra del proveedor \(no son eventos en vivo\)/i)).toBeDefined()
  })

  it('falls back to the generic card when the payload does not match the contract', () => {
    render(
      <ToolCallCard
        toolInvocation={{
          toolName: 'generateReport',
          state: 'result',
          result: { data: { title: 'sin contrato' } },
        }}
      />,
    )

    expect(screen.queryByRole('region', { name: 'Informe generado' })).toBeNull()
    // El fallback muestra el JSON del resultado en lugar de inventar un informe.
    expect(screen.getByText(/sin contrato/)).toBeDefined()
  })
})
