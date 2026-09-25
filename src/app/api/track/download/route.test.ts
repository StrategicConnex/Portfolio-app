import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mkdtemp, rm, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { NextRequest } from 'next/server'
import { GET } from './route'
import { resetRateLimit } from '@/lib/rate-limit'

function makeRequest(url: string, headers: Record<string, string> = {}) {
  return new NextRequest(url, { headers })
}

describe('GET /api/track/download', () => {
  let dir: string

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'dlroute-'))
    vi.stubEnv('DOWNLOAD_STATS_FILE', join(dir, 'descargas.ndjson'))
    vi.stubEnv('UPSTASH_REDIS_REST_URL', '')
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '')
    resetRateLimit()
  })

  afterEach(async () => {
    vi.unstubAllEnvs()
    await rm(dir, { recursive: true, force: true })
  })

  it('redirects (307) to the static file and records IP/country/UA', async () => {
    const req = makeRequest(
      'http://localhost:3000/api/track/download?f=/recursos/estandares/IEC_62443_resumen.docx',
      {
        'x-forwarded-for': '203.0.113.9, 10.0.0.1',
        'x-vercel-ip-country': 'AR',
        'user-agent': 'Mozilla/5.0 TestAgent',
        referer: 'http://localhost:3000/recursos',
      },
    )

    const res = await GET(req)
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toBe(
      'http://localhost:3000/recursos/estandares/IEC_62443_resumen.docx',
    )

    const lines = (await readFile(join(dir, 'descargas.ndjson'), 'utf8')).trim().split('\n')
    expect(lines).toHaveLength(1)
    const ev = JSON.parse(lines[0])
    expect(ev.file).toBe('/recursos/estandares/IEC_62443_resumen.docx')
    expect(ev.ip).toBe('203.0.113.9') // primer salto del x-forwarded-for
    expect(ev.country).toBe('AR')
    expect(ev.ua).toBe('Mozilla/5.0 TestAgent')
    expect(ev.ref).toBe('http://localhost:3000/recursos')
    expect(typeof ev.ts).toBe('string')
  })

  it('url-decodes encoded paths (encodeURI/encodeURIComponent)', async () => {
    const req = makeRequest(
      'http://localhost:3000/api/track/download?f=%2Frecursos%2Fguias%2Fvol1%2Fguia_implementacion_vpn.docx',
    )
    const res = await GET(req)
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toBe(
      'http://localhost:3000/recursos/guias/vol1/guia_implementacion_vpn.docx',
    )
  })

  it('responds 404 and logs nothing for invalid paths', async () => {
    const bad = [
      '/api/track/download', // sin f
      '/api/track/download?f=/etc/passwd',
      '/api/track/download?f=/recursos/../secreto.env',
      '/api/track/download?f=/recursos/archivo.txt', // extensión no rastreable
      '/api/track/download?f=/CV-JuanFelipePalacios.pdf',
    ]
    for (const url of bad) {
      const res = await GET(makeRequest(`http://localhost:3000${url}`))
      expect(res.status, url).toBe(404)
    }
    await expect(readFile(join(dir, 'descargas.ndjson'), 'utf8')).rejects.toThrow()
  })

  it('still redirects when the log write fails', async () => {
    vi.stubEnv('DOWNLOAD_STATS_FILE', join(dir, 'nodir', '\0bad'))
    const req = makeRequest(
      'http://localhost:3000/api/track/download?f=/recursos/README.docx',
    )
    const res = await GET(req)
    expect(res.status).toBe(307)
  })

  it('responds 429 once the per-client burst limit is exhausted', async () => {
    const url = 'http://localhost:3000/api/track/download?f=/recursos/README.docx'
    // El límite por defecto es 30/min: agota exactamente 30 descargas.
    for (let i = 0; i < 30; i++) {
      const res = await GET(makeRequest(url))
      expect(res.status, `iter ${i}`).toBe(307)
    }
    const blocked = await GET(makeRequest(url))
    expect(blocked.status).toBe(429)
    expect(blocked.headers.get('retry-after')).toBeDefined()

    // Otro cliente (x-forwarded-for distinto por el edge) NO comparte la ventana.
    const other = await GET(
      makeRequest(url, { 'x-forwarded-for': '198.51.100.200, 10.0.0.1' }),
    )
    expect(other.status).toBe(307)
  })
})
