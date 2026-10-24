import { describe, expect, it } from 'vitest'
import {
  finalizeReportSpec,
  reportInputSchema,
  reportSpecSchema,
} from './schema'
import { renderReportMarkdown } from './render-markdown'
import { renderReportJson } from './render-json'

const input = {
  type: 'threat-landscape' as const,
  summary: 'Resumen del feed.',
  sections: [
    {
      heading: 'Orígenes',
      body: 'China lidera los reportes.',
      evidence: [{ source: 'DShield (SANS ISC)', mode: 'live' as const, fetchedAt: '2026-10-24T10:00:00.000Z' }],
    },
  ],
}

describe('ReportSpec', () => {
  it('validates a minimal input and rejects unknown fields', () => {
    expect(reportInputSchema.safeParse(input).success).toBe(true)
    expect(reportInputSchema.safeParse({ ...input, extra: 1 }).success).toBe(false)
  })

  it('adds server-owned locale/date/provenance/disclaimers', () => {
    const spec = finalizeReportSpec(input, {
      locale: 'es',
      generatedAt: '2026-10-24T12:00:00.000Z',
    })
    expect(spec.locale).toBe('es')
    expect(spec.generatedAt).toBe('2026-10-24T12:00:00.000Z')
    expect(spec.provenance).toHaveLength(1)
    expect(spec.disclaimers[0]).toMatch(/feed/i)
    expect(reportSpecSchema.safeParse(spec).success).toBe(true)
  })

  it('always adds the compliance disclaimer', () => {
    const spec = finalizeReportSpec(
      { type: 'compliance-reference', summary: 'Marco', sections: [{ heading: 'IEC', body: 'x', evidence: [] }] },
      { locale: 'en', generatedAt: '2026-10-24T12:00:00.000Z' },
    )
    expect(spec.disclaimers.join(' ')).toMatch(/reference framework/i)
  })

  it('renders markdown with sections, evidence and disclaimers', () => {
    const spec = finalizeReportSpec(input, { locale: 'es', generatedAt: '2026-10-24T12:00:00.000Z' })
    const md = renderReportMarkdown(spec)
    expect(md).toContain('# ')
    expect(md).toContain('## Orígenes')
    expect(md).toContain('DShield (SANS ISC)')
    expect(md).toContain('2026-10-24T12:00:00.000Z')
  })

  it('renders valid JSON that round-trips', () => {
    const spec = finalizeReportSpec(input, { locale: 'en', generatedAt: '2026-10-24T12:00:00.000Z' })
    expect(JSON.parse(renderReportJson(spec))).toEqual(spec)
  })
})
