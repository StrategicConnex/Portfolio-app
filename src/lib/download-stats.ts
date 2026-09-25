/**
 * Registro de descargas de la biblioteca (`/recursos/**`).
 *
 * Dos backends, elegidos por entorno (sin dependencias nuevas):
 *
 * 1. **Upstash Redis REST** — si están las env `UPSTASH_REDIS_REST_URL` y
 *    `UPSTASH_REDIS_REST_TOKEN`. Es el camino **durable en Vercel**, donde
 *    el filesystem de la función es de solo lectura y efímero.
 * 2. **Archivo NDJSON local** — `.data/descargas.ndjson` (o `DOWNLOAD_STATS_FILE`).
 *    Vale en dev y en cualquier self-host; en Vercel falla sin drama
 *    (se captura y se avisa por consola) mientras no haya Redis configurado.
 *
 * El log se limita a los últimos 10.000 eventos en ambos backends; el panel
 * privado agrega los contajes sobre ese log.
 */

import { appendFile, mkdir, readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { RECURSO_FILES, type RecursoCat } from '@/data/recursos'

export interface DownloadEvent {
  /** Ruta pública del archivo, p. ej. `/recursos/estandares/IEC_62443_resumen.docx`. */
  file: string
  /** ISO timestamp. */
  ts: string
  /** IP real del cliente (`x-forwarded-for`, primer salto). */
  ip: string
  /** País según el edge (Vercel/Cloudflare), si lo hay. */
  country?: string
  /** User-Agent truncado. */
  ua?: string
  /** Página de origen. */
  ref?: string
}

const TRACKED_EXT = /\.(docx|xlsx|pdf|md|csv|zip)$/i
const REDIS_KEY = 'downloads:log'
const MAX_EVENTS = 10_000

/**
 * Solo se registra y redirige rutas saneables bajo `/recursos/` con extensión
 * de documento conocida — nunca sirve archivos por este endpoint, solo redirige.
 */
export function isTrackableFile(f: string | null | undefined): f is string {
  if (!f || !f.startsWith('/recursos/')) return false
  if (f.includes('..') || f.includes('\0')) return false
  return TRACKED_EXT.test(f)
}

function redisConfig(): { url: string; token: string } | null {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  return url && token ? { url, token } : null
}

function logFile(): string {
  return process.env.DOWNLOAD_STATS_FILE ?? join(process.cwd(), '.data', 'descargas.ndjson')
}

/**
 * Ejecuta un comando Redis vía la REST API de Upstash — **un comando por
 * petición**: el endpoint rechaza con 400 el formato de pipeline anidado
 * (`[[cmd, ...], …]`), así que cada comando viaja solo.
 */
async function redis(cmd: (string | number)[]): Promise<unknown> {
  const cfg = redisConfig()
  if (!cfg) throw new Error('upstash no configurado')
  const res = await fetch(cfg.url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${cfg.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmd),
    cache: 'no-store',
  })
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`upstash HTTP ${res.status}: ${detail}`)
  }
  return res.json()
}

/** Registra un evento. Fire-safe: nunca tira la descarga si falla el log. */
export async function recordDownload(ev: DownloadEvent): Promise<void> {
  try {
    const line = JSON.stringify(ev)
    if (redisConfig()) {
      await redis(['RPUSH', REDIS_KEY, line])
      await redis(['LTRIM', REDIS_KEY, -MAX_EVENTS, -1])
      return
    }
    const file = logFile()
    await mkdir(dirname(file), { recursive: true })
    await appendFile(file, `${line}\n`, 'utf8')
  } catch (err) {
    console.warn('[download-stats] no se pudo registrar la descarga:', err)
  }
}

function safeParse(line: string): DownloadEvent | null {
  try {
    const ev = JSON.parse(line) as DownloadEvent
    return ev && typeof ev.file === 'string' && typeof ev.ip === 'string' ? ev : null
  } catch {
    return null
  }
}

/** Últimos eventos (el más reciente al final), de más a menos recientes. */
export async function readRecent(limit = 500): Promise<DownloadEvent[]> {
  const take = Math.min(limit, MAX_EVENTS)
  try {
    if (redisConfig()) {
      const res = (await redis(['LRANGE', REDIS_KEY, -take, -1])) as { result?: string[] }
      return (res.result ?? []).map(safeParse).filter((e): e is DownloadEvent => e !== null)
    }
    const raw = await readFile(logFile(), 'utf8')
    const lines = raw.trim().split('\n').filter(Boolean).slice(-take)
    return lines.map(safeParse).filter((e): e is DownloadEvent => e !== null)
  } catch {
    // Sin log todavía (o FS efímero) — el panel muestra "sin datos".
    return []
  }
}

/** Total de descargas por archivo, ordenado de más a menos descargado. */
export function countByFile(events: DownloadEvent[]): { file: string; count: number }[] {
  const counts = new Map<string, number>()
  for (const ev of events) counts.set(ev.file, (counts.get(ev.file) ?? 0) + 1)
  return [...counts.entries()]
    .map(([file, count]) => ({ file, count }))
    .sort((a, b) => b.count - a.count || a.file.localeCompare(b.file))
}

const CATEGORY_BY_PATH = new Map<string, RecursoCat>(
  RECURSO_FILES.map((f) => [f.path, f.category]),
)

/** Categoría de volumen de un archivo del log (`/recursos/…` → vol1…project). */
export function categoryForFile(file: string): RecursoCat | 'otros' {
  return CATEGORY_BY_PATH.get(file.replace(/^\//, '')) ?? 'otros'
}

/** Orden fijo de las categorías para las gráficas del panel. */
export const VOLUME_ORDER = [
  'vol1',
  'vol2',
  'vol3',
  'vol4',
  'vol5',
  'standards',
  'project',
] as const satisfies readonly RecursoCat[]

/**
 * Descargas por día calendario (UTC, `YYYY-MM-DD`) de los últimos `days` días,
 * con los días sin eventos en cero para un eje continuo en la gráfica.
 */
export function countByDay(
  events: DownloadEvent[],
  opts: { days?: number; now?: Date } = {},
): { day: string; count: number }[] {
  const days = Math.max(1, opts.days ?? 30)
  const now = opts.now ?? new Date()
  const counts = new Map<string, number>()
  for (const ev of events) {
    const day = ev.ts.slice(0, 10)
    if (/^\d{4}-\d{2}-\d{2}$/.test(day)) counts.set(day, (counts.get(day) ?? 0) + 1)
  }
  const out: { day: string; count: number }[] = []
  const y = now.getUTCFullYear()
  const m = now.getUTCMonth()
  const d = now.getUTCDate()
  for (let i = days - 1; i >= 0; i--) {
    const key = new Date(Date.UTC(y, m, d - i)).toISOString().slice(0, 10)
    out.push({ day: key, count: counts.get(key) ?? 0 })
  }
  return out
}

/**
 * Descargas por volumen/categoría en orden fijo (`vol1`…`project` + `otros`),
 * incluyendo las categorías en cero para una gráfica completa.
 */
export function countByVolume(
  events: DownloadEvent[],
): { category: RecursoCat | 'otros'; count: number }[] {
  const counts = new Map<string, number>()
  for (const ev of events) {
    const cat = categoryForFile(ev.file)
    counts.set(cat, (counts.get(cat) ?? 0) + 1)
  }
  const order = [...VOLUME_ORDER, 'otros'] as (RecursoCat | 'otros')[]
  return order.map((category) => ({
    category,
    count: counts.get(category) ?? 0,
  }))
}
