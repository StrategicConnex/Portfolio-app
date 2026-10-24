import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { countryNameFromIso } from '@/data/countryCoords'

/**
 * La agregación vive en `src/lib/siem-feed.ts`; la ruta es solo transporte.
 * Aquí se sustituye `fetch` global por un enrutador por URL para ejercitar
 * el parseo real (envelope indexado de topports, degradación por feed) sin
 * tocar la red. `cachedData` degrada a llamada directa fuera del contexto
 * de Next, así que el builder corre completo en cada `callGet`.
 */
async function callGet(): Promise<Response> {
  const { GET } = await import('./route')
  return GET()
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

let handlers: Array<{ match: (url: string) => boolean; respond: (url: string) => Response }> = []

function on(match: (url: string) => boolean, respond: (url: string) => Response) {
  handlers.push({ match, respond })
}

/** Feodo responde un array plano (contraste verificado contra el API real). */
const feodo = (
  entries: Array<{
    ip_address?: string
    port?: number
    status?: 'online' | 'offline'
    malware?: string
    country?: string
    last_online?: string
  }>,
) => on((url) => url.includes('feodotracker.abuse.ch'), () => json(entries))

/** topports responde un objeto indexado por fila, NO un array. */
const topPorts = (rows: Record<string, unknown>) =>
  on((url) => url.includes('/topports/records/'), () => json(rows))

const topIps = (items: Array<{ source: string; reports: number; targets?: number }>) =>
  on((url) => url.includes('/topips/records/'), () => json(items))

beforeEach(() => {
  handlers = []
  vi.resetModules()
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

describe('GET /api/siem-feed', () => {
  it('aggregates Feodo C2 entries with real IPs and byte-level honesty', async () => {
    feodo([
      {
        ip_address: '45.123.45.67',
        port: 8080,
        status: 'online',
        malware: 'AsyncRAT',
        country: 'NL',
      },
      {
        ip_address: '103.10.11.12',
        port: 443,
        status: 'offline',
        malware: 'RhinoBlare',
        country: 'US',
        last_online: '2026-10-24 08:00:00',
      },
    ])
    topPorts({})
    topIps([])

    const body = await (await callGet()).json()

    expect(body.usingLiveData).toBe(true)
    expect(body.feedsStatus.feodo).toBe('live')
    const c2 = body.logs.filter((l: { id: string }) => l.id.startsWith('feodo-'))
    expect(c2).toHaveLength(2)
    // La infra C2 activa y la meramente reportada son dos realidades distintas.
    expect(c2.map((l: { level: string }) => l.level)).toEqual(['CRITICAL', 'ALERT'])
    expect(body.summary.critical).toBe(1)
    expect(body.summary.alert).toBe(1)
    expect(body.summary.c2Unique).toBe(2)
  })

  it('parses the indexed topports envelope and never invents a source IP', async () => {
    feodo([])
    topPorts({
      0: { rank: 1, targetport: 445, records: 1_200_000, targets: 5, sources: 900 },
      1: { rank: 2, targetport: 22, records: 700_000, targets: 3, sources: 800 },
      date: 'Oct 24 2026 12:00 UTC',
      limit: 5,
    })
    topIps([])

    const body = await (await callGet()).json()

    expect(body.feedsStatus.dshield).toBe('live')
    // Las claves de metadatos (`date`, `limit`) caen y el rank manda.
    expect(body.ports).toEqual([
      { port: 445, records: 1_200_000, sources: 900 },
      { port: 22, records: 700_000, sources: 800 },
    ])
    const portLogs = body.logs.filter((l: { id: string }) => l.id.startsWith('dshield-port-'))
    expect(portLogs).toHaveLength(2)
    for (const log of portLogs) {
      // Agregado explícito: SANS no publica la IP de cada escaneo.
      expect(log.src).toBe('SANS ISC (aggregate)')
      expect(log.feed).toBe('DShield (SANS ISC)')
    }
    // El volumen define severidad: ≥1M WARN, el resto INFO.
    expect(portLogs[0].level).toBe('WARN')
    expect(portLogs[1].level).toBe('INFO')
  })

  it('publishes the countries and malware families present in the real cycle', async () => {
    feodo([
      { ip_address: '45.123.45.67', status: 'online', malware: 'AsyncRAT', country: 'NL' },
      { ip_address: '44.22.33.44', status: 'online', malware: 'AsyncRAT', country: 'NL' },
      { ip_address: '103.10.11.12', status: 'online', malware: 'Glupteba', country: 'US' },
    ])
    topPorts({})
    topIps([
      { source: '185.220.101.34', reports: 150_000 },
      { source: '13.94.254.200', reports: 4_000 },
    ])

    const body = await (await callGet()).json()

    expect(body.attackers).toContainEqual(
      expect.objectContaining({ label: countryNameFromIso('NL'), count: 2 }),
    )
    expect(body.malware[0]).toEqual({ label: 'AsyncRAT', count: 2 })
    const topIp = body.logs.find((l: { id: string }) => l.id === 'dshield-185.220.101.34')
    // Volumen extenso de escaneo → WARN; reportes menores → INFO.
    expect(topIp?.level).toBe('WARN')
    expect(body.summary.scanReports).toBe(154_000)
  })

  it('degrades one feed while the other stays live', async () => {
    on((url) => url.includes('feodotracker.abuse.ch'), () => json({ error: 'boom' }, 500))
    topPorts({ 0: { rank: 1, targetport: 8080, records: 500_000, targets: 2, sources: 300 } })
    topIps([])

    const body = await (await callGet()).json()

    expect(body.feedsStatus).toEqual({ feodo: 'unavailable', dshield: 'live' })
    // SANS sí entregó datos: el payload sigue siendo vivo.
    expect(body.usingLiveData).toBe(true)
    expect(body.logs.filter((l: { id: string }) => l.id.startsWith('feodo-'))).toHaveLength(0)
    expect(body.malware).toEqual([])
  })

  it('never pretends to have data: all feeds down means an honest empty payload', async () => {
    on((url) => url.includes('feodotracker.abuse.ch'), () => json({ error: 'boom' }, 500))
    on((url) => url.includes('/topports/records/'), () => json({ error: 'boom' }, 500))
    on((url) => url.includes('/topips/records/'), () => json({ error: 'boom' }, 500))

    const body = await (await callGet()).json()

    expect(body.usingLiveData).toBe(false)
    expect(body.logs).toEqual([])
    expect(body.feedsStatus).toEqual({ feodo: 'unavailable', dshield: 'unavailable' })
    expect(body.summary).toEqual({
      critical: 0,
      alert: 0,
      warn: 0,
      info: 0,
      c2Unique: 0,
      targetedPorts: 0,
      scanReports: 0,
    })
  })

  it('publishes the applied cache TTLs so caching stays auditable', async () => {
    feodo([])
    topPorts({})
    topIps([])

    const body = await (await callGet()).json()

    expect(body.cacheTtlSeconds).toEqual({ feodo: 60, dshield: 300, payload: 30 })
  })
})
