import { cachedData } from '@/lib/next-cache'
import { countryNameFromIso } from '@/data/countryCoords'
import { toArgentinaTime } from '@/lib/utils'

/**
 * Seam única del feed SIEM.
 *
 * Agrega inteligencia de amenazas GLOBAL y REAL en formato de log de SIEM.
 * Es la única fuente: la ruta `/api/siem-feed` (panel del portfolio) y la
 * herramienta `querySiem` del copilot consumen esta misma función, de modo
 * que el dashboard, la API y el chatbot siempre reportan los mismos datos.
 *
 * Filosofía de honestidad (idéntica a `threat-intel`):
 *  - Cada log proviene de un proveedor y declara de qué feed es (`feed`).
 *  - `src` es SIEMPRE una IP real del proveedor o una etiqueta agregada
 *    explícita ('SANS ISC (aggregate)'). Nunca se inventa una IP para
 *    rellenar un campo que el proveedor no publica.
 *  - `mitigation` es una recomendación derivada de reglas, no una acción
 *    ejecutada: este sitio no opera la red del visitante ni ningún SOC ajeno
 *    a los proveedores, así que ninguna interfaz puede afirmar que se
 *    bloqueó tráfico.
 *
 * Fuentes (con datos reales, ninguna simulada):
 *  - Abuse.ch Feodo Tracker — infraestructura de botnets C2 observada
 *    en estado salvaje (IP, malware, puerto, país, estado online).
 *  - DShield / SANS ISC — `topports`: los puertos que más tráfico maligno
 *    reciben en todo el mundo (agregado, sin IP de origen atribuible).
 *  - DShield / SANS ISC — `topips`: las IPs que más reportes generaron
 *    contra los sensores de la red SANS.
 */

const ABUSE_API = 'https://feodotracker.abuse.ch/downloads/ipblocklist.json'
const DSHIELD_API = 'https://isc.sans.edu/api'
const USER_AGENT = 'StrategicAudit-SIEM/1.0'

/** Segundos de revalidación del feed de Abuse.ch (su guía pide ≤1/min). */
const FEODO_TTL_SECONDS = 60
/** Segundos de revalidación del bloque de DShield. */
const DSHIELD_TTL_SECONDS = 300
/** Segundos de revalidación del payload agregado completo. */
const PAYLOAD_TTL_SECONDS = 30

/** Timeout de una petición a un proveedor externo. */
const REQUEST_TIMEOUT_MS = 8_000

/** Máximo de logs de Feodo (C2) incluidos por ciclos. */
const FEODO_LOG_LIMIT = 10
/** Cuántos puertos más atacados se consultan a SANS. */
const TOP_PORT_COUNT = 5
/** Cuántas IPs más reportadas se consultan a SANS. */
const TOP_IP_COUNT = 8
/** Límite del stream que consume el dashboard (y del payload). */
export const SIEM_LOG_LIMIT = 15

export type SIEMLevel = 'CRITICAL' | 'ALERT' | 'WARN' | 'INFO'

export interface SiemMitigation {
  /** Acción recomendada para este IOC (NO ejecutada por este sitio). */
  action: string
  steps: string[]
  /** Estimación típica de contención, no un MTTR medido. */
  time: string
}

export interface SIEMLog {
  /** Identificador estable por IOC (permite de-duplicar al refrescar). */
  id: string
  /** Momento en que el dato fue agregado (ISO). */
  at: string
  /** HH:MM:SS derivado de `at` en Argentina (UTC-3). */
  time: string
  level: SIEMLevel
  /** IP real del proveedor o etiqueta agregada explícita. */
  src: string
  msg: string
  /** Feed que publicó el dato. Siempre se declara. */
  feed: 'Abuse.ch Feodo Tracker' | 'DShield (SANS ISC)'
  /** País del C2 (solo cuando el proveedor lo publica — Feodo). */
  country?: string
  malware?: string
  port?: number
  /** Volumen de reportes del proveedor, cuando existe. */
  reports?: number
  /** Recomendación derivada (no ejecutada). */
  mitigation?: SiemMitigation
}

export interface SiemFeedSummary {
  critical: number
  alert: number
  warn: number
  info: number
  /** IPs C2 únicas observadas en el ciclo (Feodo). */
  c2Unique: number
  /** Puertos que SANS reporta como más atacados (del ciclo). */
  targetedPorts: number
  /** Suma de reportes de las IPs más reportadas por SANS. */
  scanReports: number
}

export interface SiemFeedPayload {
  logs: SIEMLog[]
  /** Momento en que se construyó el bloque agregado (no el de esta respuesta). */
  lastUpdated: string
  source: string
  /** `true` si al menos un proveedor respondió con datos reales. */
  usingLiveData: boolean
  summary: SiemFeedSummary
  /** Países presentes en los logs reales del ciclo, ordenados por volumen. */
  attackers: Array<{ label: string; count: number }>
  /** Puertos más atacados según SANS, con su volumen de eventos. */
  ports: Array<{ port: number; records: number; sources: number }>
  /** Familias de botnet observadas en Feodo durante el ciclo. */
  malware: Array<{ label: string; count: number }>
  /**
   * Estado real de cada fuente. Si un feed no aportó datos en esta respuesta
   * no se dice 'live' ni se rellena con datos ficticios.
   */
  feedsStatus: {
    feodo: 'live' | 'unavailable'
    dshield: 'live' | 'unavailable'
  }
  /** TTLs aplicados, para que el comportamiento de caché sea auditable. */
  cacheTtlSeconds: { feodo: number; dshield: number; payload: number }
}

interface FeodoEntry {
  ip_address?: string
  port?: number
  status?: 'online' | 'offline'
  malware?: string
  country?: string
  last_online?: string
}

interface TopPortsEnvelope {
  date?: string
  limit?: number
  [rank: string]: unknown
}

interface TopPortEntry {
  rank?: number
  targetport?: number
  records?: number
  targets?: number
  sources?: number
}

interface TopIpEntry {
  source?: string
  reports?: number
  targets?: number
}

interface FetchOptions {
  /** Segundos de revalidación de la caché de datos de Next. */
  revalidate?: number
}

async function fetchJson<T>(url: string, options: FetchOptions): Promise<T | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  try {
    const res = await fetch(url, {
      next: { revalidate: options.revalidate ?? 60 },
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

/** Recomendación derivada por regla. Este sitio no ejecuta ninguna acción. */
function mitigationForC2(malware: string | undefined, port: number | undefined): SiemMitigation {
  return {
    action: `Recomendado: bloquear y registrar tráfico hacia este C2${port ? ` (puerto ${port})` : ''}`,
    steps: [
      'Add the IP to the perimeter blocklist (IoC from Abuse.ch Feodo)',
      `Restrict egress on TCP ${port ?? '?'} unless the business requires it`,
      malware
        ? `Hunt for ${malware} indicators in proxy/DNS logs`
        : 'Hunt for related C2 indicators in proxy/DNS logs',
      'Alert SOC Tier 2 if any internal host contacted this address',
    ],
    time: '< 5 min',
  }
}

function mitigationForScan(): SiemMitigation {
  return {
    action: 'Recomendado: mantener rate-limit y blocklists actualizadas en el perímetro',
    steps: [
      'Keep edge rate-limiting for unsolicited inbound traffic',
      'Cross-check the source against DShield blocklist',
      'Log and review any accepted connection to exposed services',
    ],
    time: '< 1 min',
  }
}

/** Feed de Abuse.ch Feodo → logs de infraestructura C2 real. */
async function collectFeodoLogs(now: number): Promise<SIEMLog[]> {
  const entries = await fetchJson<FeodoEntry[]>(ABUSE_API, { revalidate: FEODO_TTL_SECONDS })
  if (!Array.isArray(entries)) return []

  return entries
    .filter((item) => typeof item.ip_address === 'string' && item.ip_address.length > 0)
    .slice(0, FEODO_LOG_LIMIT)
    .map((item) => {
      const online = item.status === 'online'
      const at = new Date(now)
      const malware = item.malware?.trim() || undefined
      return {
        id: `feodo-${item.ip_address}`,
        at: at.toISOString(),
        time: toArgentinaTime(at),
        // C2 activo en línea: crítico. Infraestructura C2 reportada reciente:
        // alerta. Son dos realidades distintas y no se mezclan.
        level: (online ? 'CRITICAL' : 'ALERT') as SIEMLevel,
        src: item.ip_address!,
        msg: online
          ? `Active C2 communication channel detected${malware ? ` (${malware})` : ''}`
          : `Botnet C2 infrastructure reported${malware ? ` (${malware})` : ''}${
              item.last_online ? ` — last online ${item.last_online}` : ''
            }`,
        feed: 'Abuse.ch Feodo Tracker' as const,
        country: item.country?.trim().toUpperCase() || undefined,
        malware,
        port: typeof item.port === 'number' ? item.port : undefined,
        mitigation: mitigationForC2(malware, item.port),
      } satisfies SIEMLog
    })
}

/**
 * Los puertos más atacados del mundo según SANS.
 *
 * `topports/records/:n?json` devuelve un objeto indexado por fila
 * (`{"0": {...}, "1": {...}, date, limit}`), no un array: por eso se
 * serializan los valores numéricos y se descartan las claves de metadatos.
 * No contiene IP de origen — se publica como agregado, nunca con una IP
 * inventada.
 */
async function collectTopPorts(now: number): Promise<{
  logs: SIEMLog[]
  ports: SiemFeedPayload['ports']
}> {
  const envelope = await fetchJson<TopPortsEnvelope>(
    `${DSHIELD_API}/topports/records/${TOP_PORT_COUNT}?json`,
    { revalidate: DSHIELD_TTL_SECONDS },
  )
  if (!envelope || typeof envelope !== 'object') return { logs: [], ports: [] }

  const entries = Object.entries(envelope)
    .filter(([key, value]) => /^\d+$/.test(key) && typeof value === 'object' && value !== null)
    .map(([, value]) => value as TopPortEntry)
    .filter((item) => typeof item.targetport === 'number')
    .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))

  const logs: SIEMLog[] = entries.map((item) => {
    const at = new Date(now)
    const records = item.records ?? 0
    return {
      id: `dshield-port-${item.targetport}`,
      at: at.toISOString(),
      time: toArgentinaTime(at),
      // Estadística global de volumen: WARN solo con volúmenes extremos.
      level: (records >= 1_000_000 ? 'WARN' : 'INFO') as SIEMLevel,
      // Agregado explícito: SANS no publica la IP de cada escaneo.
      src: 'SANS ISC (aggregate)',
      msg: `Port ${item.targetport} is among the most attacked ports worldwide (${records.toLocaleString('en-US')} events)`,
      feed: 'DShield (SANS ISC)' as const,
      port: item.targetport,
      reports: records,
      mitigation: mitigationForScan(),
    } satisfies SIEMLog
  })

  const ports = entries.map((item) => ({
    port: item.targetport!,
    records: item.records ?? 0,
    sources: item.sources ?? 0,
  }))

  return { logs, ports }
}

/**
 * IPs más reportadas por los sensores de SANS. Son IPs reales; no se
 * asigna país a estas líneas porque `topips` no lo publica y geolocalizar
 * aquí duplicaría el trabajo (y los TTLs) que ya hace `threat-intel`.
 */
async function collectTopIps(now: number): Promise<SIEMLog[]> {
  const topIps = await fetchJson<TopIpEntry[]>(
    `${DSHIELD_API}/topips/records/${TOP_IP_COUNT}?json`,
    { revalidate: DSHIELD_TTL_SECONDS },
  )
  if (!Array.isArray(topIps)) return []

  return topIps
    .filter((item) => typeof item.source === 'string' && item.source.length > 0)
    .slice(0, TOP_IP_COUNT)
    .map((item) => {
      const at = new Date(now)
      const reports = item.reports ?? 0
      return {
        id: `dshield-${item.source}`,
        at: at.toISOString(),
        time: toArgentinaTime(at),
        level: (reports >= 100_000 ? 'WARN' : 'INFO') as SIEMLevel,
        src: item.source!,
        msg: `Heavy scan/probe activity reported against SANS sensors (${reports.toLocaleString('en-US')} reports)`,
        feed: 'DShield (SANS ISC)' as const,
        reports,
        mitigation: mitigationForScan(),
      } satisfies SIEMLog
    })
}

function countBy<T>(items: T[], key: (item: T) => string | undefined): Array<{ label: string; count: number }> {
  const counts = new Map<string, number>()
  for (const item of items) {
    const label = key(item)
    if (!label) continue
    counts.set(label, (counts.get(label) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
}

async function buildSiemFeedPayload(): Promise<SiemFeedPayload> {
  const now = Date.now()
  // Cada proveedor degrada por separado: un feed caído no borra al otro.
  const [feodoLogs, topPorts, topIps] = await Promise.all([
    collectFeodoLogs(now),
    collectTopPorts(now),
    collectTopIps(now),
  ])

  const logs = [...feodoLogs, ...topPorts.logs, ...topIps]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, SIEM_LOG_LIMIT)

  const countries = countBy(feodoLogs, (log) => {
    if (!log.country) return undefined
    // Nombre canónico (el mismo dominio de países del mapa 3D); si el
    // código no está mapeado se usa el código ISO crudo, nunca inventado.
    return countryNameFromIso(log.country) ?? log.country
  })
  const malware = countBy(feodoLogs, (log) => log.malware)
  const c2Unique = new Set(feodoLogs.map((log) => log.src)).size
  const scanReports = topIps.reduce((acc, log) => acc + (log.reports ?? 0), 0)

  return {
    logs,
    lastUpdated: new Date(now).toISOString(),
    source: 'Agregación en tiempo real: Abuse.ch Feodo Tracker + DShield (SANS ISC)',
    usingLiveData: logs.length > 0,
    summary: {
      critical: logs.filter((l) => l.level === 'CRITICAL').length,
      alert: logs.filter((l) => l.level === 'ALERT').length,
      warn: logs.filter((l) => l.level === 'WARN').length,
      info: logs.filter((l) => l.level === 'INFO').length,
      c2Unique,
      targetedPorts: topPorts.ports.length,
      scanReports,
    },
    attackers: countries,
    ports: topPorts.ports,
    malware,
    feedsStatus: {
      // Derivado del orden real: si Feodo no devolvió entradas, su feed está
      // fuera (o vacío, que también es "sin datos"). Lo mismo para SANS.
      feodo: feodoLogs.length > 0 ? 'live' : 'unavailable',
      dshield: topPorts.logs.length > 0 ? 'live' : 'unavailable',
    },
    cacheTtlSeconds: {
      feodo: FEODO_TTL_SECONDS,
      dshield: DSHIELD_TTL_SECONDS,
      payload: PAYLOAD_TTL_SECONDS,
    },
  }
}

/**
 * Payload agregado cacheado. Tanto la ruta pública como la herramienta del
 * copilot llaman a esta función: una única consulta upstream compartida por
 * minuto como máximo, sin segundas vías de agregación.
 */
export const getSiemFeedData = cachedData<SiemFeedPayload>(
  buildSiemFeedPayload,
  'siem-feed:v1',
  { revalidate: PAYLOAD_TTL_SECONDS, tags: ['siem-feed'] },
)
