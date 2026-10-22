import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import { COUNTRY_COORDS } from '@/data/countryCoords'

/**
 * La ruta mantiene en memoria el feed de CISA KEV con TTL propio (pesa más de
 * lo que admite la caché de Next). `vi.resetModules()` + import dinámico dan
 * a cada test una instancia limpia de la ruta.
 */
async function callGet(): Promise<Response> {
  const { GET } = await import('./route')
  return GET()
}

/**
 * El route consume tres feeds externos. Aquí se sustituye `fetch` global por
 * un enrutador por URL, de modo que la lógica real de la ruta (resolución de
 * país, severidad, degradación) se ejecuta sin tocar la red.
 */
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

let handlers: Array<{ match: (url: string) => boolean; respond: (url: string) => Response }> = []

function on(match: (url: string) => boolean, respond: (url: string) => Response) {
  handlers.push({ match, respond })
}

const topIps = (items: Array<{ source: string; reports: number; targets?: number }>) =>
  on((url) => url.includes('/topips/records/'), () => json(items))

const dshieldIp = (ip: string, payload: Record<string, unknown>) =>
  on((url) => url.includes(`/api/ip/${ip}?json`), () => json(payload))

const ipWhoIs = (ip: string, payload: Record<string, unknown>) =>
  on((url) => url.startsWith(`https://ipwho.is/${ip}`), () => json(payload))

const kev = (vulnerabilities: Array<{ cveID: string; dateAdded?: string }>) =>
  on((url) => url.includes('known_exploited_vulnerabilities.json'), () => json({ vulnerabilities }))

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

describe('GET /api/threat-intel', () => {
  it('geolocates the real DShield top talkers with the ASN country reported by SANS', async () => {
    topIps([{ source: '13.94.254.200', reports: 319739, targets: 1 }])
    dshieldIp('13.94.254.200', {
      ip: { asname: 'MICROSOFT-CORP-MSN-AS-BLOCK', ascountry: 'US', threatfeeds: { a: {}, b: {} } },
    })
    kev([])

    const res = await callGet()
    expect(res.status).toBe(200)
    const body = await res.json()

    expect(body.dataSource).toBe('live')
    expect(body.geolocatedCount).toBe(1)
    expect(body.events).toHaveLength(1)

    const event = body.events[0]
    expect(event.originIp).toBe('13.94.254.200')
    expect(event.originCountry).toBe('United States')
    expect(event.originCountryCode).toBe('US')
    expect(event.originAs).toBe('MICROSOFT-CORP-MSN-AS-BLOCK')
    expect(event.reports).toBe(319739)
    expect(event.geoSource).toBe('dshield-as')
    expect(event.blocklistCount).toBe(2)
    expect(event.source).toBe('DShield (SANS ISC)')
  })

  it('falls back to IP geolocation when SANS does not know the ASN country', async () => {
    topIps([{ source: '89.248.163.109', reports: 96279 }])
    dshieldIp('89.248.163.109', { ip: { asname: 'INT-NETWORK', ascountry: 'ZZ' } })
    ipWhoIs('89.248.163.109', { success: true, country_code: 'SC', country: 'Seychelles' })
    kev([])

    const body = await (await callGet()).json()
    const event = body.events[0]

    expect(event.originCountry).toBe('Seychelles')
    expect(event.originCountryCode).toBe('SC')
    expect(event.geoSource).toBe('ipwhois')
  })

  it('scales severity with the reported volume', async () => {
    topIps([
      { source: '1.1.1.1', reports: 400 },
      { source: '2.2.2.2', reports: 5_000 },
      { source: '3.3.3.3', reports: 50_000 },
    ])
    for (const ip of ['1.1.1.1', '2.2.2.2', '3.3.3.3']) {
      dshieldIp(ip, { ip: { ascountry: 'DE' } })
    }
    kev([])

    const body = await (await callGet()).json()
    const byIp = Object.fromEntries(body.events.map((e: { originIp: string; severity: string }) => [e.originIp, e.severity]))

    expect(byIp['1.1.1.1']).toBe('low')
    expect(byIp['2.2.2.2']).toBe('medium')
    expect(byIp['3.3.3.3']).toBe('high')
  })

  it('never attributes a country to CISA KEV entries', async () => {
    topIps([{ source: '13.94.254.200', reports: 319739 }])
    dshieldIp('13.94.254.200', { ip: { ascountry: 'US' } })
    kev([{ cveID: 'CVE-2024-3094', dateAdded: '2024-04-12' }])

    const body = await (await callGet()).json()
    const kevEvent = body.events.find((e: { source: string }) => e.source === 'CISA KEV')

    expect(kevEvent).toBeDefined()
    expect(kevEvent.originCountry).toBeUndefined()
    expect(kevEvent.originIp).toBeUndefined()
    expect(kevEvent.type).toContain('origen no atribuido')
  })

  it('degrades to labelled sample data when the live feeds fail', async () => {
    on((url) => url.includes('/topips/records/'), () => json({ error: 'boom' }, 500))
    on((url) => url.includes('known_exploited_vulnerabilities.json'), () => json({ error: 'boom' }, 500))

    const body = await (await callGet()).json()

    expect(body.dataSource).toBe('degraded')
    expect(body.geolocatedCount).toBe(0)
    expect(body.events.length).toBeGreaterThan(0)
    for (const event of body.events) {
      expect(event.source).toBe('Muestra (feed no disponible)')
    }
  })

  it('only publishes countries that exist in the coordinate table', async () => {
    topIps([
      { source: '1.1.1.1', reports: 10 },
      { source: '2.2.2.2', reports: 20 },
    ])
    dshieldIp('1.1.1.1', { ip: { ascountry: 'US' } })
    // País que no existe en la tabla: cae a la geolocalización de la IP.
    dshieldIp('2.2.2.2', { ip: { ascountry: 'ZZ' } })
    ipWhoIs('2.2.2.2', { success: true, country_code: 'HK' })
    kev([])

    const body = await (await callGet()).json()

    for (const event of body.events) {
      if (event.originCountry) {
        expect(COUNTRY_COORDS[event.originCountry], event.originCountry).toBeDefined()
      }
    }
    expect(body.events.map((e: { originCountry?: string }) => e.originCountry)).toContain('Hong Kong')
  })

  it('lists only the sources it actually consumes', async () => {
    topIps([{ source: '13.94.254.200', reports: 10 }])
    dshieldIp('13.94.254.200', { ip: { ascountry: 'US' } })
    kev([])

    const body = await (await callGet()).json()

    expect(body.sources).toContain('DShield (SANS ISC)')
    expect(body.sources).toContain('CISA KEV')
    expect(body.sources.join(' ')).not.toContain('Abuse.ch')
  })

  it('publishes the cache TTLs it applies so the caching is auditable', async () => {
    topIps([{ source: '13.94.254.200', reports: 10 }])
    dshieldIp('13.94.254.200', { ip: { ascountry: 'US' } })
    kev([])

    const body = await (await callGet()).json()

    expect(body.cacheTtlSeconds).toEqual({ dshield: 300, kev: 3600 })
  })

  it('coalesces concurrent requests into a single upstream query', async () => {
    topIps([{ source: '13.94.254.200', reports: 319739 }])
    dshieldIp('13.94.254.200', { ip: { ascountry: 'US' } })
    kev([])

    const { GET } = await import('./route')
    const fetchMock = vi.mocked(globalThis.fetch)

    const [first, second] = await Promise.all([GET(), GET()])
    const [bodyA, bodyB] = await Promise.all([first.json(), second.json()])

    // Ambas respuestas coinciden...
    expect(bodyA.events).toEqual(bodyB.events)
    expect(bodyA.lastUpdated).toBe(bodyB.lastUpdated)

    // ...pero el proveedor solo recibió una consulta por feed.
    const topIpsCalls = fetchMock.mock.calls.filter(([url]) =>
      String(url).includes('/topips/records/'),
    )
    const ipCalls = fetchMock.mock.calls.filter(([url]) =>
      String(url).includes('/api/ip/13.94.254.200'),
    )
    expect(topIpsCalls).toHaveLength(1)
    expect(ipCalls).toHaveLength(1)
  })

  it('keeps serving data after a failed upstream call', async () => {
    on((url) => url.includes('/topips/records/'), () => json({ error: 'boom' }, 500))
    on((url) => url.includes('known_exploited_vulnerabilities.json'), () => json({ error: 'boom' }, 500))

    const body = await (await callGet()).json()

    expect(body.dataSource).toBe('degraded')
    expect(body.events.length).toBeGreaterThan(0)
  })

  it('publishes the real status of each source', async () => {
    topIps([{ source: '13.94.254.200', reports: 10 }])
    dshieldIp('13.94.254.200', { ip: { ascountry: 'US' } })
    kev([{ cveID: 'CVE-2024-3094', dateAdded: '2024-04-12' }])

    const body = await (await callGet()).json()

    expect(body.sourceStatus).toEqual({ dshield: 'live', kev: 'live' })
  })

  it('reports a KEV feed that is down instead of pretending it delivered data', async () => {
    topIps([{ source: '13.94.254.200', reports: 10 }])
    dshieldIp('13.94.254.200', { ip: { ascountry: 'US' } })
    on((url) => url.includes('known_exploited_vulnerabilities.json'), () => json({ error: 'boom' }, 500))

    const body = await (await callGet()).json()

    expect(body.sourceStatus.kev).toBe('unavailable')
    expect(body.sourceStatus.dshield).toBe('live')
    expect(body.events.some((e: { source: string }) => e.source === 'CISA KEV')).toBe(false)
  })

  it('does not cache a failed KEV feed: the next cycle brings the data back', async () => {
    // Un fallo puntual del proveedor no puede dejar el feed sin KEV cacheado
    // durante una hora: la caché de Next no guarda errores, así que el
    // siguiente ciclo vuelve a consultar a CISA.
    topIps([{ source: '13.94.254.200', reports: 10 }])
    dshieldIp('13.94.254.200', { ip: { ascountry: 'US' } })
    on((url) => url.includes('known_exploited_vulnerabilities.json'), () => json({ error: 'boom' }, 500))

    const failed = await (await callGet()).json()
    expect(failed.sourceStatus.kev).toBe('unavailable')

    // El proveedor se recupera.
    handlers = handlers.filter(
      (h) => !h.match('known_exploited_vulnerabilities.json'),
    )
    kev([{ cveID: 'CVE-2024-3094', dateAdded: '2024-04-12' }])

    const recovered = await (await callGet()).json()
    expect(recovered.sourceStatus.kev).toBe('live')
    expect(
      recovered.events.some((e: { source: string }) => e.source === 'CISA KEV'),
    ).toBe(true)
  })
})
