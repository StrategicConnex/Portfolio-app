import { describe, expect, it } from 'vitest'
import { finalizeReportSpec } from './schema'
import { extractReportsFromParts } from './from-message'

const spec = finalizeReportSpec(
  { type: 'executive-brief', summary: 'S', sections: [{ heading: 'H', body: 'B', evidence: [] }] },
  { locale: 'es', generatedAt: '2026-10-24T12:00:00.000Z' },
)

describe('extractReportsFromParts', () => {
  it('extracts completed report tool results', () => {
    const reports = extractReportsFromParts([
      { type: 'tool-invocation', toolInvocation: { toolName: 'generateReport', state: 'result', result: { data: spec } } },
    ])
    expect(reports).toHaveLength(1)
    expect(reports[0].type).toBe('executive-brief')
  })

  it('ignores pending/other tools', () => {
    expect(
      extractReportsFromParts([
        { type: 'tool-invocation', toolInvocation: { toolName: 'generateReport', state: 'call' } },
        { type: 'tool-invocation', toolInvocation: { toolName: 'dnsAnalyzer', state: 'result', result: {} } },
      ]),
    ).toEqual([])
  })

  it('ignores malformed payloads without sections', () => {
    expect(
      extractReportsFromParts([
        { type: 'tool-invocation', toolInvocation: { toolName: 'generateReport', state: 'result', result: { data: { type: 'x' } } } },
      ]),
    ).toEqual([])
  })
})
