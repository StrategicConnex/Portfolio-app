import { z } from 'zod'
import {
  getThreatIntelSnapshot,
  type ThreatEvent,
  type ThreatIntelSnapshot,
} from '@/features/threat-intel/server'
import type { Provenance, ToolResult } from './result'

export const threatIntelSchema = z.object({
  summary: z.boolean().optional().default(true),
})

export interface ThreatIntelSummary {
  fetchedAt: string
  dataSource: 'live' | 'degraded'
  sourceStatus: ThreatIntelSnapshot['sourceStatus']
  cacheTtlSeconds: ThreatIntelSnapshot['cacheTtlSeconds']
  totals: { events: number; kev: number }
  topCountries: Array<{ country: string; count: number }>
  topTypes: Array<{ type: string; count: number }>
  events: ThreatEvent[]
  provenance: Provenance[]
  warnings?: string[]
}

function countBy(
  events: ThreatEvent[],
  key: 'originCountry' | 'type',
): Array<{ value: string; count: number }> {
  const counts = new Map<string, number>()
  for (const event of events) {
    const value = event[key]
    if (!value) continue
    counts.set(value, (counts.get(value) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value))
}

export function summarizeThreatIntel(
  snapshot: ThreatIntelSnapshot,
  limit = 10,
): ThreatIntelSummary {
  const provenance: Provenance[] = [
    { source: 'DShield (SANS ISC)', mode: 'live', fetchedAt: snapshot.generatedAt },
    { source: 'CISA KEV', mode: 'live', fetchedAt: snapshot.generatedAt },
  ]
  const warnings =
    snapshot.dataSource === 'degraded'
      ? ['The threat feed is degraded: no live DShield events are available right now.']
      : undefined

  return {
    fetchedAt: snapshot.generatedAt,
    dataSource: snapshot.dataSource,
    sourceStatus: snapshot.sourceStatus,
    cacheTtlSeconds: snapshot.cacheTtlSeconds,
    totals: {
      events: snapshot.events.length,
      kev: snapshot.events.filter((event) => event.source === 'CISA KEV').length,
    },
    topCountries: countBy(snapshot.events, 'originCountry')
      .slice(0, 5)
      .map(({ value, count }) => ({ country: value, count })),
    topTypes: countBy(snapshot.events, 'type')
      .slice(0, 5)
      .map(({ value, count }) => ({ type: value, count })),
    events: snapshot.events.slice(0, limit),
    provenance,
    warnings,
  }
}

export interface ThreatIntelTool {
  description: string
  inputSchema: typeof threatIntelSchema
  execute: (
    input: z.input<typeof threatIntelSchema>,
    options?: unknown,
  ) => Promise<ToolResult<ThreatIntelSummary>>
}

export const threatIntelTool: ThreatIntelTool = {
  description:
    'Read the live cyber-attack map feed (DShield top talkers + CISA KEV). Use it to interpret the 3D map: origins, attack types, severity, KEV count and per-source freshness. Never invent events; if dataSource is degraded, say so.',
  inputSchema: threatIntelSchema,
  execute: async (): Promise<ToolResult<ThreatIntelSummary>> => {
    const snapshot = await getThreatIntelSnapshot()
    const summary = summarizeThreatIntel(snapshot)
    return {
      data: summary,
      provenance: summary.provenance,
      warnings: summary.warnings,
    }
  },
}
