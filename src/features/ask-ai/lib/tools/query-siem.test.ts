import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { querySiem, SIEM_TOOL_DISCLAIMER } from './query-siem'

/**
 * `querySiem` llama a la seam `getSiemFeedData()` directamente (sin HTTP a
 * sí misma). `cachedData` degrada a llamada directa fuera del contexto de
 * Next, así que con el `fetch` global sustituido ejercitamos el builder
 * real de `siem-feed.ts`: mismos helpers que route.test.ts.
 */
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

let handlers: Array<{ match: (url: string) => boolean; respond: (url: string) => Response }> = []

function on(match: (url: string) => boolean, respond: (url: string) => Response) {
  handlers.push({ match, respond })
}

const feodo = (
  entries: Array<{
    ip_address?: string
    port?: number
    status?: 'online' | 'offline'
    malware?: string
    country?: string
  }>,
) => on((url) => url.includes('feodotracker.abuse.ch'), () => json(entries))

const topPorts = (rows: Record<string, Record<string, unknown>>) =>
  on((url) => url.includes('/topports/records/'), () => json(rows))

const topIps = (items: Array<{ source: string; reports: number; targets?: number }>) =>
  on((url) => url.includes('/topips/records/'), () => json(items))

const allDown = () => {
  on((url) => url.includes('feodotracker.abuse.ch'), () => json({ error: 'boom' }, 500))
  on((url) => url.includes('/topports/records/'), () => json({ error: 'boom' }, 500))
  on((url) => url.includes('/topips/records/'), () => json({ error: 'boom' }, 500))
}

beforeEach(() => {
  handlers = []
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      const handler = handlers.find((h) => h.match(url))
      if (!handler) return json({ error: 'unexpected fetch', url }, 404)
      return handler.respond(url)
    }),
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('querySiem tool', () => {
  it('carries the honest disclaimer about global intel, not private logs', async () => {
    allDown()
    const result = await querySiem({ focus: 'summary' })

    expect(result.disclaimer).toBe(SIEM_TOOL_DISCLAIMER)
    // El disclaimer es explícito: NO son logs de la red del visitante.
    expect(SIEM_TOOL_DISCLAIMER).toContain("NOT logs from the user's private network")
  })

  it('summarizes the aggregates derived from the live providers', async () => {
    feodo([
      { ip_address: '45.123.45.67', port: 8080, status: 'online', malware: 'AsyncRAT', country: 'NL' },
      { ip_address: '44.22.33.44', status: 'online', malware: 'AsyncRAT', country: 'US' },
    ])
    topPorts({ 0: { rank: 1, targetport: 445, records: 1_200_000, targets: 2, sources: 300 } })
    topIps([{ source: '185.220.101.34', reports: 250_000 }])

    const result = await querySiem({ focus: 'summary' })

    expect(result.error).toBeUndefined()
    expect(result.counts).toEqual({ critical: 2, alert: 0, warn: 2, info: 0 })
    expect(result.summary).toContain('2 CRITICAL events (active C2)')
    expect(result.topSources).toHaveLength(2)
    expect(result.topTargetedPorts).toEqual([{ port: 445, records: 1_200_000 }])
    expect(result.botnetFamilies).toEqual([{ label: 'AsyncRAT', count: 2 }])
    expect(result.feedsStatus).toEqual({ feodo: 'live', dshield: 'live' })
    expect(result.source).toContain('Abuse.ch')
  })

  it('exposes recent logs with the publishing feed declared per entry', async () => {
    feodo([{ ip_address: '45.123.45.67', status: 'online', malware: 'AsyncRAT' }])
    topPorts({})
    topIps([{ source: '185.220.101.34', reports: 250_000 }])

    const result = await querySiem({ focus: 'logs' })

    expect(result.recentLogs).toHaveLength(2)
    expect(
      result.recentLogs?.every((l) =>
        ['Abuse.ch Feodo Tracker', 'DShield (SANS ISC)'].includes(l.feed),
      ),
    ).toBe(true)
    expect(result.topTargetedPorts).toBeUndefined()
    expect(result.botnetFamilies).toBeUndefined()
  })

  it("'all' combines the logs with the aggregates", async () => {
    feodo([{ ip_address: '45.123.45.67', status: 'online', malware: 'AsyncRAT' }])
    topPorts({ 0: { rank: 1, targetport: 445, records: 1_200_000, targets: 2, sources: 300 } })
    topIps([])

    const result = await querySiem({ focus: 'all' })

    expect(result.recentLogs?.length).toBeGreaterThan(0)
    expect(result.topTargetedPorts?.[0]).toEqual({ port: 445, records: 1_200_000 })
    expect(result.botnetFamilies?.length).toBeGreaterThan(0)
  })

  it('reports honestly when no provider responds', async () => {
    allDown()

    const result = await querySiem({ focus: 'summary' })

    expect(result.error).toContain('No threat-intel feed responded')
    expect(result.feedsStatus).toEqual({ feodo: 'unavailable', dshield: 'unavailable' })
    expect(result.summary).toBeUndefined()
    expect(result.counts).toBeUndefined()
    expect(result.recentLogs).toBeUndefined()
  })
})
