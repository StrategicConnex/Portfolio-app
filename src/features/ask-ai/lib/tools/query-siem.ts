import { z } from 'zod'
import { getSiemFeedData } from '@/lib/siem-feed'

/**
 * `querySiem` — el copilot lee el mismo feed SIEM que consume el dashboard
 * (`/api/siem-feed`), sin HTTP sobre sí mismo: llama a la seam
 * `getSiemFeedData()` directamente. Así el chatbot y el panel nunca se
 * contradicen y la respuesta funciona igual en dev que en producción.
 */

export const querySiemSchema = z.object({
  focus: z
    .enum(['logs', 'summary', 'all'])
    .describe('What part of the SIEM feed to query: logs (recent events), summary (aggregates), or all'),
})

export type QuerySiemInput = z.infer<typeof querySiemSchema>

export const SIEM_TOOL_DISCLAIMER =
  'REAL DATA: global threat-intelligence aggregates from Abuse.ch Feodo Tracker and DShield (SANS ISC). They are NOT logs from the user\'s private network — clarify this when answering.'

interface SiemToolResult {
  disclaimer: string
  error?: string
  summary?: string
  counts?: Record<string, number>
  topSources?: string[]
  topTargetedPorts?: Array<{ port: number; records: number }>
  botnetFamilies?: Array<{ label: string; count: number }>
  recentLogs?: Array<{ id: string; time: string; level: string; src: string; msg: string; feed: string }>
  source?: string
  feedsStatus?: Record<string, string>
  lastUpdated?: string
}

export async function querySiem(params: QuerySiemInput): Promise<SiemToolResult> {
  try {
    const data = await getSiemFeedData()

    if (!data.usingLiveData) {
      return {
        disclaimer: SIEM_TOOL_DISCLAIMER,
        error: 'No threat-intel feed responded right now. Report this honestly: there is no live data at the moment.',
        feedsStatus: data.feedsStatus,
        lastUpdated: data.lastUpdated,
      }
    }

    if (params.focus === 'summary') {
      return {
        disclaimer: SIEM_TOOL_DISCLAIMER,
        summary: `Currently ${data.summary.critical} CRITICAL events (active C2), ${data.summary.alert} ALERTs (reported C2), ${data.summary.warn} WARN and ${data.summary.info} INFO. Unique C2 servers: ${data.summary.c2Unique}. Total scan reports from top sources: ${data.summary.scanReports.toLocaleString('en-US')}.`,
        counts: {
          critical: data.summary.critical,
          alert: data.summary.alert,
          warn: data.summary.warn,
          info: data.summary.info,
        },
        topSources: data.attackers.slice(0, 5).map((a) => `${a.label} (${a.count})`),
        botnetFamilies: data.malware.slice(0, 5),
        topTargetedPorts: data.ports.slice(0, 5).map((p) => ({ port: p.port, records: p.records })),
        feedsStatus: data.feedsStatus,
        lastUpdated: data.lastUpdated,
        source: data.source,
      }
    }

    // 'logs' y 'all' devuelven los eventos recientes reales.
    return {
      disclaimer: SIEM_TOOL_DISCLAIMER,
      recentLogs: data.logs.slice(0, 8).map((l) => ({
        id: l.id,
        time: l.time,
        level: l.level,
        src: l.src,
        msg: l.msg,
        feed: l.feed,
      })),
      topTargetedPorts: params.focus === 'all'
        ? data.ports.slice(0, 5).map((p) => ({ port: p.port, records: p.records }))
        : undefined,
      botnetFamilies: params.focus === 'all' ? data.malware.slice(0, 5) : undefined,
      source: data.source,
      feedsStatus: data.feedsStatus,
      lastUpdated: data.lastUpdated,
    }
  } catch (error) {
    return {
      disclaimer: SIEM_TOOL_DISCLAIMER,
      error: 'Could not connect to the threat-intel feed at this moment.',
      ...(error instanceof Error ? { lastUpdated: new Date().toISOString() } : {}),
    }
  }
}
