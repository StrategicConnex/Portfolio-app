import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mkdtemp, rm, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  isTrackableFile,
  recordDownload,
  readRecent,
  countByFile,
  countByDay,
  countByVolume,
  categoryForFile,
  type DownloadEvent,
} from './download-stats'

describe('isTrackableFile', () => {
  it('accepts documents under /recursos/', () => {
    expect(isTrackableFile('/recursos/estandares/IEC_62443_resumen.docx')).toBe(true)
    expect(isTrackableFile('/recursos/templates/vol1/matriz_riesgos_ot.xlsx')).toBe(true)
    expect(isTrackableFile('/recursos/ROADMAP_ITOT_2025_2035.docx')).toBe(true)
    expect(isTrackableFile('/recursos/README.docx')).toBe(true)
  })

  it('rejects null / empty', () => {
    expect(isTrackableFile(null)).toBe(false)
    expect(isTrackableFile(undefined)).toBe(false)
    expect(isTrackableFile('')).toBe(false)
  })

  it('rejects paths outside /recursos/', () => {
    expect(isTrackableFile('/etc/passwd')).toBe(false)
    expect(isTrackableFile('/CV-JuanFelipePalacios.pdf')).toBe(false)
    expect(isTrackableFile('/api/contact')).toBe(false)
    expect(isTrackableFile('recursos/x.docx')).toBe(false) // sin slash inicial
  })

  it('rejects traversal and null bytes', () => {
    expect(isTrackableFile('/recursos/../secret.env')).toBe(false)
    expect(isTrackableFile('/recursos/../../etc/passwd')).toBe(false)
    expect(isTrackableFile('/recursos/a\0b.docx')).toBe(false)
  })

  it('rejects unknown extensions', () => {
    expect(isTrackableFile('/recursos/x.txt')).toBe(false)
    expect(isTrackableFile('/recursos/x.js')).toBe(false)
    expect(isTrackableFile('/recursos/')).toBe(false)
  })
})

describe('file backend (NDJSON)', () => {
  let dir: string

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'dlstats-'))
    vi.stubEnv('DOWNLOAD_STATS_FILE', join(dir, 'descargas.ndjson'))
    vi.stubEnv('UPSTASH_REDIS_REST_URL', '')
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '')
  })

  afterEach(async () => {
    vi.unstubAllEnvs()
    await rm(dir, { recursive: true, force: true })
  })

  it('round-trips events to the log file', async () => {
    const ev: DownloadEvent = {
      file: '/recursos/estandares/IEC_62443_resumen.docx',
      ts: '2026-09-24T12:00:00.000Z',
      ip: '203.0.113.9',
      country: 'AR',
      ua: 'Mozilla/5.0 Test',
      ref: 'http://localhost/recursos',
    }
    await recordDownload(ev)

    const raw = await readFile(join(dir, 'descargas.ndjson'), 'utf8')
    expect(JSON.parse(raw.trim())).toEqual(ev)

    const events = await readRecent()
    expect(events).toHaveLength(1)
    expect(events[0]).toEqual(ev)
  })

  it('keeps chronological order and respects the limit', async () => {
    for (let i = 0; i < 5; i++) {
      await recordDownload({ file: `/recursos/f${i}.docx`, ts: `2026-09-24T12:00:0${i}.000Z`, ip: '1.1.1.1' })
    }
    const events = await readRecent(3)
    expect(events.map((e) => e.file)).toEqual(['/recursos/f2.docx', '/recursos/f3.docx', '/recursos/f4.docx'])
  })

  it('returns [] when there is no log yet', async () => {
    expect(await readRecent()).toEqual([])
  })

  it('never throws when the log cannot be written', async () => {
    vi.stubEnv('DOWNLOAD_STATS_FILE', join(dir, 'no-se-puede', '\0inválido'))
    await expect(
      recordDownload({ file: '/recursos/x.docx', ts: 'now', ip: '1.1.1.1' }),
    ).resolves.toBeUndefined()
  })
})

describe('redis backend (Upstash REST)', () => {
  const ev: DownloadEvent = {
    file: '/recursos/estandares/IEC_62443_resumen.docx',
    ts: '2026-09-24T12:00:00.000Z',
    ip: '203.0.113.9',
  }

  beforeEach(() => {
    vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://example.upstash.io')
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'tok')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('sends one flat command per request (never a nested pipeline)', async () => {
    const fetchMock = vi.fn<
      (url: string | URL | Request, init?: RequestInit) => Promise<Response>
    >(async () => ({ ok: true, json: async () => ({ result: 1 }) }) as Response)
    vi.stubGlobal('fetch', fetchMock)

    await recordDownload(ev)

    // El endpoint de Upstash rechaza con 400 los cuerpos anidados [[cmd,…],…]:
    // cada petición debe llevar UN comando plano cuyo primer elemento es string.
    expect(fetchMock).toHaveBeenCalledTimes(2)
    const bodies = fetchMock.mock.calls.map((c) => JSON.parse(String(c[1]?.body)))
    expect(bodies[0]).toEqual(['RPUSH', 'downloads:log', JSON.stringify(ev)])
    expect(bodies[1][0]).toBe('LTRIM')
    for (const body of bodies) expect(typeof body[0]).toBe('string')
    expect((fetchMock.mock.calls[0][1]?.headers as Record<string, string>).Authorization).toBe('Bearer tok')
  })

  it('readRecent parses LRANGE results', async () => {
    const fetchMock = vi.fn<
      (url: string | URL | Request, init?: RequestInit) => Promise<Response>
    >(async () => ({ ok: true, json: async () => ({ result: [JSON.stringify(ev)] }) }) as Response)
    vi.stubGlobal('fetch', fetchMock)

    expect(await readRecent(10)).toEqual([ev])
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual([
      'LRANGE',
      'downloads:log',
      -10,
      -1,
    ])
  })

  it('never throws on HTTP errors and the panel falls back to no data', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<
        (url: string | URL | Request, init?: RequestInit) => Promise<Response>
      >(async () =>
        ({ ok: false, status: 400, text: async () => '{"error":"bad"}' }) as unknown as Response),
    )
    vi.spyOn(console, 'warn').mockImplementation(() => {})

    await expect(recordDownload(ev)).resolves.toBeUndefined()
    expect(await readRecent()).toEqual([])
  })
})

describe('countByFile', () => {
  it('aggregates per file sorted by count desc', () => {
    const events: DownloadEvent[] = [
      { file: '/recursos/a.docx', ts: 't', ip: '1' },
      { file: '/recursos/b.docx', ts: 't', ip: '2' },
      { file: '/recursos/a.docx', ts: 't', ip: '3' },
      { file: '/recursos/a.docx', ts: 't', ip: '4' },
    ]
    expect(countByFile(events)).toEqual([
      { file: '/recursos/a.docx', count: 3 },
      { file: '/recursos/b.docx', count: 1 },
    ])
  })

  it('returns [] for no events', () => {
    expect(countByFile([])).toEqual([])
  })
})

describe('categoryForFile', () => {
  it('maps real library paths to their volume category', () => {
    expect(categoryForFile('/recursos/estandares/IEC_62443_resumen.docx')).toBe('standards')
    expect(categoryForFile('/recursos/README.docx')).toBe('project')
    expect(categoryForFile('/recursos/guias/vol4/guia_soc_industrial.docx')).toBe('vol4')
    expect(categoryForFile('/recursos/templates/vol2/matriz_riesgos_ot.xlsx')).toBe('vol2')
  })

  it('falls back to otros for unknown paths', () => {
    expect(categoryForFile('/recursos/desconocido.docx')).toBe('otros')
    expect(categoryForFile('/fuera.docx')).toBe('otros')
  })
})

describe('countByDay', () => {
  const now = new Date('2026-09-30T12:00:00.000Z')

  it('zero-fills the window in ascending order', () => {
    const days = countByDay([], { days: 5, now })
    expect(days.map((d) => d.day)).toEqual([
      '2026-09-26', '2026-09-27', '2026-09-28', '2026-09-29', '2026-09-30',
    ])
    expect(days.every((d) => d.count === 0)).toBe(true)
  })

  it('aggregates per UTC day and ignores out-of-window or invalid timestamps', () => {
    const events: DownloadEvent[] = [
      { file: '/recursos/a.docx', ts: '2026-09-27T10:00:00.000Z', ip: '1' },
      { file: '/recursos/b.docx', ts: '2026-09-27T23:59:59.000Z', ip: '2' },
      { file: '/recursos/c.docx', ts: '2026-09-01T10:00:00.000Z', ip: '3' }, // fuera de ventana
      { file: '/recursos/d.docx', ts: 'not-a-date', ip: '4' },
    ]
    const days = countByDay(events, { days: 5, now })
    expect(days.find((d) => d.day === '2026-09-27')?.count).toBe(2)
    expect(days.reduce((sum, d) => sum + d.count, 0)).toBe(2)
  })

  it('rolls month and year boundaries correctly', () => {
    const days = countByDay([], { days: 3, now: new Date('2026-10-01T00:00:00.000Z') })
    expect(days.map((d) => d.day)).toEqual(['2026-09-29', '2026-09-30', '2026-10-01'])
  })
})

describe('countByVolume', () => {
  it('returns the fixed category order with zeros filled in', () => {
    const rows = countByVolume([
      { file: '/recursos/README.docx', ts: 't', ip: '1' },
      { file: '/recursos/estandares/ISO_27001_resumen.docx', ts: 't', ip: '2' },
      { file: '/fuera.docx', ts: 't', ip: '3' },
    ])
    expect(rows.map((r) => r.category)).toEqual([
      'vol1', 'vol2', 'vol3', 'vol4', 'vol5', 'standards', 'project', 'otros',
    ])
    expect(rows.find((r) => r.category === 'standards')?.count).toBe(1)
    expect(rows.find((r) => r.category === 'project')?.count).toBe(1)
    expect(rows.find((r) => r.category === 'otros')?.count).toBe(1)
    expect(rows.find((r) => r.category === 'vol1')?.count).toBe(0)
  })
})
