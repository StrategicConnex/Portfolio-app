import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ReportViewer } from './ReportViewer'
import { finalizeReportSpec } from '@/features/ask-ai/lib/reports/schema'

vi.mock('@/context/LanguageContext', () => ({
  useLanguage: () => ({ language: 'es', t: (k: string) => k }),
}))
vi.mock('./report-export', () => ({ downloadReport: vi.fn() }))

const spec = finalizeReportSpec(
  {
    type: 'threat-landscape',
    summary: 'Resumen',
    sections: [{ heading: 'Orígenes', body: 'China', evidence: [{ source: 'DShield (SANS ISC)', mode: 'live' }] }],
  },
  { locale: 'es', generatedAt: '2026-10-24T12:00:00.000Z' },
)

describe('ReportViewer', () => {
  it('renders title, sections, evidence and disclaimers with export buttons', () => {
    render(<ReportViewer spec={spec} />)
    expect(screen.getByText('Orígenes')).toBeDefined()
    expect(screen.getAllByText(/DShield/).length).toBeGreaterThan(0)
    expect(screen.getByText(/no provienen de una red propia/i)).toBeDefined()
    fireEvent.click(screen.getByRole('button', { name: /markdown/i }))
    fireEvent.click(screen.getByRole('button', { name: /json/i }))
    const pdfBtn = screen.getByRole('button', { name: /pdf/i })
    expect(pdfBtn.getAttribute('disabled')).toBe('')
  })

  it('labels the panel for assistive technology', () => {
    render(<ReportViewer spec={spec} />)
    expect(screen.getByRole('region', { name: 'Informe generado' })).toBeDefined()
  })
})