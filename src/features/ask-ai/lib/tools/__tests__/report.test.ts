import { describe, expect, it, vi } from 'vitest'
import { createGenerateReportTool } from '../report'

vi.mock('@/features/ask-ai/lib/telemetry', () => ({ emitAskAiEvent: vi.fn() }))

describe('generateReport tool', () => {
  it('validates and finalizes a report for the requested locale', async () => {
    const tool = createGenerateReportTool('en')
    const result = (await tool.execute!(
      {
        type: 'library-brief',
        summary: 'A brief',
        sections: [{ heading: 'Docs', body: 'Body', evidence: [{ source: 'IT/OT Library', mode: 'static' }] }],
      },
      {},
    )) as { data: { locale: string; generatedAt: string; provenance: unknown[]; disclaimers: string[] } }

    expect(result.data.locale).toBe('en')
    expect(result.data.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    expect(result.data.provenance).toEqual([{ source: 'IT/OT Library', mode: 'static' }])
    expect(result.data.disclaimers.length).toBeGreaterThan(0)
  })

  it('rejects an invalid type', () => {
    const tool = createGenerateReportTool('es')
    const parsed = tool.inputSchema.safeParse({ type: 'other', summary: 'x', sections: [] })
    expect(parsed.success).toBe(false)
  })
})
