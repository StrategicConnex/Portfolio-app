import { NextResponse } from 'next/server'
import { countryNameFromIso } from '@/data/countryCoords'
import { cachedData } from '@/lib/next-cache'

/**
 * Inteligencia de amenazas en vivo.
 *
 * Fuentes (todas con datos reales, ninguna simulada):
 *  - DShield / SANS ISC — `topips` devuelve las IPs que más reportes
 *    han generado contra los sensores de la red (escaneo masivo).
 *  - DShield / SANS ISC — `ip/<ip>` da el ASN, el país del ASN y en cuántas
 *    listas de bloqueo aparece esa IP.
 *  - CISA KEV — vulnerabilidades con explotación confirmada. No tienen
 *    atribución de origen, por lo que se publican sin país.
 *
 * Caché: el resultado se guarda en la caché de datos de Next (`unstable_cache`)
 * y además las peticiones concurrentes comparten una sola consulta al
 * proveedor, de modo que cargar el portfolio desde varios navegadores a la vez
 * no multiplica el tráfico hacia SANS ni hacia CISA.
 */

/** Segundos que se conserva en caché el bloque de DShield (IPs + geolocalización). */
const DSHIELD_TTL_SECONDS = 300
/** Segundos que se conserva en caché el feed de CISA KEV. */
const KEV_TTL_SECONDS = 3600

const DSHIELD_API = 'https://isc.sans.edu/api'
const IPWHO_API = 'https://ipwho.is'
const USER_AGENT = 'StrategicAudit-SIEM/1.0'

/** Cuántas IPs de "top talkers" se consultan por ciclo. */
const TOP_IP_COUNT = 8
/** Timeout por petición a un proveedor externo. */
const REQUEST_TIMEOUT_MS = 8_000
/**
 * Presupuesto total de la ruta (ver `GET`): nunca mantener la respuesta del
 * home colgada detrás de los feeds externos.
 */
const TOTAL_BUDGET_MS = 12_000

type Severity = 'low' | 'medium' | 'high' | 'critical'

export interface ThreatEvent {
  id: string
  source: string
  type: string
  /** País de origen (nombre en inglés, clave de COUNTRY_COORDS). */
  originCountry?: string
  /** Código ISO-3166-1 alpha-2 del país de origen. */
  originCountryCode?: string
  /** IP real que originó la actividad. */
  originIp?: string
  /** ASN propietario de la IP (dato de SANS). */
  originAs?: string
  /** Número de listas de bloqueo que incluyen la IP. */
  blocklistCount?: number
  /** Volumen de reportes de DShield para esa IP. */
  reports?: number
  /** De dónde salió el país: el ASN de SANS o una geolocalización de la IP. */
  geoSource?: 'dshield-as' | 'ipwhois'
  timestamp: string
  severity: Severity
}

interface TopIp {
  rank?: number
  source?: string
  reports?: number
  targets?: number
}

interface DshieldIpRecord {
  ip?: {
    number?: string
    asname?: string
    ascountry?: string
    threatfeeds?: Record<string, { lastseen?: string; firstseen?: string }>
  }
}

/** Severidad a partir del volumen de reportes de DShield. */
function severityFromReports(reports: number): Severity {
  if (reports >= 100_000) return 'critical'
  if (reports >= 10_000) return 'high'
  if (reports >= 1_000) return 'medium'
  return 'low'
}

/** Sube un nivel de severidad (nunca por encima de 'critical'). */
function bumpSeverity(severity: Severity): Severity {
  switch (severity) {
    case 'low':
      return 'medium'
    case 'medium':
      return 'high'
    case 'high':
      return 'critical'
    default:
      return 'critical'
  }
}

interface FetchOptions {
  /** Segundos de revalidación de la caché de datos de Next. */
  revalidate?: number
  /** Evita la caché de Next (respuestas grandes que no caben en ella). */
  noStore?: boolean
}

async function fetchJson<T>(url: string, options: FetchOptions): Promise<T | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  try {
    const res = await fetch(url, {
      ...(options.noStore
        ? { cache: 'no-store' as const }
        : { next: { revalidate: options.revalidate ?? 300 } }),
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
      signal: controller.signal,
    })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Geolocalización de respaldo cuando SANS no conoce el país del ASN.
 * `ipwho.is` es la alternativa a ip-api.com: ip-api.com solo admite HTTP en
 * su plan gratuito y por eso falla en peticiones server-side con HTTPS.
 *
 * Devuelve el código ISO: el nombre del país se resuelve siempre contra
 * `COUNTRY_BY_ISO`, de modo que `originCountry` sea siempre una clave de
 * `COUNTRY_COORDS` y el mapa la pueda colocar.
 */
async function geolocateIp(ip: string): Promise<{ code?: string }> {
  const data = await fetchJson<{ success?: boolean; country_code?: string }>(
    `${IPWHO_API}/${ip}`,
    { revalidate: 3600 },
  )
  if (!data?.success || !data.country_code) return {}
  return { code: data.country_code.trim().toUpperCase() }
}

/** Resuelve país + ASN de una IP real consultando primero a DShield. */
async function describeAttacker(ip: string) {
  const record = await fetchJson<DshieldIpRecord>(
    `${DSHIELD_API}/ip/${ip}?json`,
    { revalidate: 3600 },
  )

  const asName = record?.ip?.asname
  const blocklistCount = Object.keys(record?.ip?.threatfeeds ?? {}).length
  const asCountry = record?.ip?.ascountry?.trim().toUpperCase()

  if (asCountry) {
    const name = countryNameFromIso(asCountry)
    if (name) {
      return {
        country: name,
        countryCode: asCountry,
        asName,
        blocklistCount,
        geoSource: 'dshield-as' as const,
      }
    }
  }

  // Sin país de ASN utilizable: se geolocaliza la IP directamente.
  const geo = await geolocateIp(ip)
  const country = countryNameFromIso(geo.code)
  return {
    country,
    countryCode: geo.code,
    asName,
    blocklistCount,
    geoSource: country ? ('ipwhois' as const) : undefined,
  }
}

/** Top talkers de DShield convertidos en eventos con país real. */
async function collectDshieldEvents(): Promise<ThreatEvent[]> {
  const topIps = await fetchJson<TopIp[]>(`${DSHIELD_API}/topips/records/${TOP_IP_COUNT}?json`, {
    revalidate: 300,
  })
  if (!Array.isArray(topIps) || topIps.length === 0) return []

  const candidates = topIps
    .filter((item) => typeof item.source === 'string' && item.source.length > 0)
    .slice(0, TOP_IP_COUNT)
  if (candidates.length === 0) return []

  const described = await Promise.all(candidates.map((item) => describeAttacker(item.source!)))

  const now = Date.now()
  return described.map((info, index) => {
    const item = candidates[index]
    const reports = item.reports ?? 0
    let severity = severityFromReports(reports)
    if (info.blocklistCount >= 5) severity = bumpSeverity(severity)

    return {
      id: `dshield-${now}-${item.source}`,
      source: 'DShield (SANS ISC)',
      type: 'Port Scan / Probe',
      originCountry: info.country,
      originCountryCode: info.countryCode,
      originIp: item.source,
      originAs: info.asName,
      blocklistCount: info.blocklistCount,
      reports,
      geoSource: info.geoSource,
      timestamp: new Date(now).toISOString(),
      severity,
    }
  })
}

/**
 * CISA KEV. Confirma explotación en estado salvaje pero no atribuye origen,
 * así que estos eventos se publican SIN país: inventar un país de origen
 * convertiría un dato real en una afirmación falsa.
 *
 * El JSON del feed ronda los 200 KB (cabe en la caché de datos de Next), pero
 * se mantiene además en memoria con TTL propio para no depender de ella.
 */
const KEV_FEED_URL =
  'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json'
const KEV_TTL_MS = 60 * 60 * 1000
let kevCache: { at: number; events: ThreatEvent[] } | null = null

interface KevFeed {
  events: ThreatEvent[]
  /** `false` = el proveedor no respondió. Un fallo NO se cachea. */
  available: boolean
}

async function collectKevEvents(): Promise<KevFeed> {
  if (kevCache && Date.now() - kevCache.at < KEV_TTL_MS) {
    return { events: kevCache.events, available: true }
  }

  const data = await fetchJson<{
    vulnerabilities?: Array<{ cveID?: string; dateAdded?: string; vendorProject?: string }>
  }>(KEV_FEED_URL, { noStore: true })
  const vulnerabilities = data?.vulnerabilities
  // Feed caído: se devuelve sin cachear para que el siguiente ciclo lo
  // reintente. Cachear el fallo dejaría al mapa sin KEV durante una hora
  // entera por un problema puntual del proveedor.
  if (!Array.isArray(vulnerabilities)) {
    return { events: [], available: false }
  }

  const now = Date.now()
  const events = vulnerabilities.slice(0, 3).map((vuln, index) => ({
    id: `kev-${now}-${vuln.cveID ?? index}`,
    source: 'CISA KEV',
    type: `Exploit: ${vuln.cveID ?? 'CVE desconocido'} (origen no atribuido)`,
    timestamp: vuln.dateAdded ? new Date(vuln.dateAdded).toISOString() : new Date(now).toISOString(),
    severity: 'critical' as Severity,
  }))

  kevCache = { at: now, events }
  return { events, available: true }
}

/** Muestra explícita, usada solo cuando los feeds reales no responden. */
function sampleEvents(): ThreatEvent[] {
  const now = Date.now()
  const samples: Array<{ country: string; type: string; severity: Severity }> = [
    { country: 'China', type: 'Port Scan / Probe', severity: 'high' },
    { country: 'Russia', type: 'Port Scan / Probe', severity: 'critical' },
    { country: 'United States', type: 'Port Scan / Probe', severity: 'medium' },
    { country: 'Iran', type: 'Port Scan / Probe', severity: 'high' },
    { country: 'North Korea', type: 'Port Scan / Probe', severity: 'critical' },
  ]
  return samples.map((sample, index) => ({
    id: `sample-${now}-${index}`,
    source: 'Muestra (feed no disponible)',
    type: sample.type,
    originCountry: sample.country,
    timestamp: new Date(now).toISOString(),
    severity: sample.severity,
  }))
}

/**
 * Coalesce ráfagas: si varias peticiones llegan a la vez, comparten la misma
 * consulta en curso en lugar de disparar N consultas redundantes al
 * proveedor. La entrada se borra al resolverse, así que la siguiente petición
 * posterior vuelve a pasar por la caché de Next.
 */
const inFlight = new Map<string, Promise<unknown>>()

function coalesce<T>(key: string, run: () => Promise<T>): Promise<T> {
  const pending = inFlight.get(key) as Promise<T> | undefined
  if (pending) return pending

  const promise = run().finally(() => {
    inFlight.delete(key)
  })
  inFlight.set(key, promise)
  return promise
}

interface DshieldIntel {
  events: ThreatEvent[]
  /** Momento en que se generaron los datos (no el de esta respuesta). */
  generatedAt: string
  usingLiveData: boolean
  geolocatedCount: number
}

/**
 * Bloque de DShield cacheado. Incluye la degradación a muestra: si el feed
 * real falla, la respuesta lo dice explícitamente en vez de fingir datos.
 */
const getDshieldIntel = cachedData<DshieldIntel>(
  async () => {
    const live = await collectDshieldEvents()
    const geolocatedCount = live.filter((event) => Boolean(event.originCountry)).length
    const usingLiveData = geolocatedCount > 0

    return {
      events: usingLiveData ? live : sampleEvents(),
      generatedAt: new Date().toISOString(),
      usingLiveData,
      geolocatedCount,
    }
  },
  'threat-intel:dshield',
  { revalidate: DSHIELD_TTL_SECONDS, tags: ['threat-intel'] },
)

/**
 * Bloque de CISA KEV cacheado.
 *
 * Si el feed está caído se lanza una excepción a propósito: `unstable_cache`
 * no guarda los errores, de modo que un fallo puntual del proveedor no deja
 * "sin KEV" cacheado durante una hora. La ruta captura el error y publica el
 * estado real de la fuente.
 */
const getKevIntel = cachedData<KevFeed>(
  async () => {
    const feed = await collectKevEvents()
    if (!feed.available) {
      throw new Error('CISA KEV no disponible')
    }
    return feed
  },
  'threat-intel:kev:v2',
  { revalidate: KEV_TTL_SECONDS, tags: ['threat-intel'] },
)

export async function GET() {
  // Presupuesto total de la ruta: en una petición fría los feeds externos
  // pueden encadenar varios timeouts de 8 s (ASN + geolocalización por IP) y
  // dejar al home esperando. Pasado el límite se responde degradado.
  let budgetTimer: ReturnType<typeof setTimeout> | undefined
  const budget = new Promise<never>((_, reject) => {
    budgetTimer = setTimeout(
      () => reject(new Error('threat-intel: time budget exceeded')),
      TOTAL_BUDGET_MS,
    )
  })

  try {
    const [dshield, kev] = await Promise.race([
      Promise.all([
        coalesce('dshield', getDshieldIntel),
        // Un feed caído no tumba la respuesta: se publica lo que hay y el
        // estado por fuente deja claro qué falta.
        coalesce('kev', getKevIntel).catch(
          (): KevFeed => ({ events: [], available: false }),
        ),
      ]),
      budget,
    ])

    return NextResponse.json({
    events: [...dshield.events, ...kev.events],
    lastUpdated: dshield.generatedAt,
    /** 'live' = IPs reales geolocalizadas; 'degraded' = muestra sin atribución. */
    dataSource: dshield.usingLiveData ? ('live' as const) : ('degraded' as const),
    geolocatedCount: dshield.geolocatedCount,
    sources: ['DShield (SANS ISC)', 'CISA KEV', 'ipwho.is (respaldo de geolocalización)'],
    /**
     * Estado real de cada fuente. La interfaz se apoya en esto para no
     * afirmar que hay datos de un feed que no respondió.
     */
    sourceStatus: {
      dshield: dshield.usingLiveData ? ('live' as const) : ('degraded' as const),
      kev: kev.available ? ('live' as const) : ('unavailable' as const),
    },
    /** TTLs aplicados, para que el comportamiento de caché sea auditable. */
    cacheTtlSeconds: { dshield: DSHIELD_TTL_SECONDS, kev: KEV_TTL_SECONDS },
    })
  } catch {
    // Feed lento o caído: degradar rápido y dejar que el mapa use su muestra.
    return NextResponse.json({
      events: [],
      lastUpdated: new Date().toISOString(),
      dataSource: 'degraded' as const,
      geolocatedCount: 0,
      sources: ['DShield (SANS ISC)', 'CISA KEV', 'ipwho.is (respaldo de geolocalización)'],
      sourceStatus: { dshield: 'degraded' as const, kev: 'unavailable' as const },
      cacheTtlSeconds: { dshield: DSHIELD_TTL_SECONDS, kev: KEV_TTL_SECONDS },
    })
  } finally {
    if (budgetTimer) clearTimeout(budgetTimer)
  }
}
