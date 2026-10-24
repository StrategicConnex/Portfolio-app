import { describe, expect, it, vi } from 'vitest'

vi.mock('@/features/threat-intel/server', () => ({
  getThreatIntelSnapshot: vi.fn(),
}))

import { getThreatIntelSnapshot } from '@/features/threat-intel/server'
import { summarizeThreatIntel, threatIntelTool } from '../threat-intel'

const snapshot = {
  events: [
    { id: '1', source: 'DShield (SANS ISC)', type: 'Port Scan / Probe', originCountry: 'China', originIp: '1.2.3.4', severity: 'high' as const, reports: 1200, timestamp: '2026-10-24T10:00:00.000Z' },
    { id: '2', source: 'DShield (SANS ISC)', type: 'Port Scan / Probe', originCountry: 'China', originIp: '1.2.3.5', severity: 'medium' as const, reports: 10, timestamp: '2026-10-24T10:00:00.000Z' },
    { id: '3', source: 'CISA KEV', type: 'Known Exploited Vulnerability', severity: 'critical' as const, timestamp: '2026-10-24T10:00:00.000Z' },
  ],
  generatedAt: '2026-10-24T10:00:00.000Z',
  dataSource: 'live' as const,
  geolocatedCount: 2,
  sourceStatus: { dshield: 'live' as const, kev: 'live' as const },
  cacheTtlSeconds: { dshield: 300, kev: 3600 },
}

describe('summarizeThreatIntel', () => {
  it('summarizes totals, top countries and top types with live provenance', () => {
    const summary = summarizeThreatIntel(snapshot)

    expect(summary.totals).toEqual({ events: 3, kev: 1 })
    expect(summary.topCountries[0]).toEqual({ country: 'China', count: 2 })
    expect(summary.topTypes[0]).toEqual({ type: 'Port Scan / Probe', count: 2 })
    expect(summary.events).toHaveLength(3)
    expect(summary.provenance).toEqual([
      { source: 'DShield (SANS ISC)', mode: 'live', fetchedAt: snapshot.generatedAt },
      { source: 'CISA KEV', mode: 'live', fetchedAt: snapshot.generatedAt },
    ])
    expect(summary.warnings).toBeUndefined()
  })

  it('caps events and warns when the feed is degraded', () => {
    const summary = summarizeThreatIntel({ ...snapshot, dataSource: 'degraded' }, 1)
    expect(summary.events).toHaveLength(1)
    expect(summary.warnings?.[0]).toMatch(/degraded/i)
  })

  it('exposes a tool that returns the ToolResult envelope', async () => {
    vi.mocked(getThreatIntelSnapshot).mockResolvedValue(snapshot)
    const result = await threatIntelTool.execute!({}, {})
    expect(result).toMatchObject({ data: { totals: { events: 3 } }, provenance: expect.any(Array) })
  })
})
