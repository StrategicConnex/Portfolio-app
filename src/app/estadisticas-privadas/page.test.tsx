import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import EstadisticasDescargas from './page'
import { readRecent } from '@/lib/download-stats'
import type { DownloadEvent } from '@/lib/download-stats'

vi.mock('@/lib/download-stats', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/download-stats')>()
  return { ...actual, readRecent: vi.fn() }
})

// Mismos día UTC para los tres eventos: la gráfica por día debe sumar3.
const TODAY_ISO = new Date().toISOString()
const FIXTURES: DownloadEvent[] = [
  { file: '/recursos/estandares/IEC_62443_resumen.docx', ts: TODAY_ISO, ip: '203.0.113.9', country: 'AR', ua: 'Mozilla/5.0 Test' },
  { file: '/recursos/estandares/IEC_62443_resumen.docx', ts: TODAY_ISO, ip: '198.51.100.4', country: 'CL' },
  { file: '/recursos/README.docx', ts: TODAY_ISO, ip: '203.0.113.9' },
]

const page = (k?: string) =>
  EstadisticasDescargas({ searchParams: Promise.resolve(k === undefined ? {} : { k }) })

describe('estadisticas-privadas', () => {
  beforeEach(() => {
    vi.mocked(readRecent).mockResolvedValue(FIXTURES)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.clearAllMocks()
  })

  it('responds 404 when the token env is not configured', async () => {
    await expect(page('cualquiera')).rejects.toThrow()
  })

  it('responds 404 with the wrong key', async () => {
    vi.stubEnv('DOWNLOAD_STATS_TOKEN', 'secreta-123')
    await expect(page('otra')).rejects.toThrow()
    await expect(page(undefined)).rejects.toThrow()
  })

  it('renders totals, per-file counts and the IP of each event', async () => {
    vi.stubEnv('DOWNLOAD_STATS_TOKEN', 'secreta-123')
    const ui = await page('secreta-123')
    const { container } = render(ui)

    expect(screen.getByText('Descargas de la biblioteca')).toBeDefined()
    // KPIs: 3 eventos; '2' aparece en archivos distintos, IPs distintas y el conteo de IEC 62443
    expect(screen.getByText('3')).toBeDefined()
    expect(screen.getAllByText('2').length).toBeGreaterThanOrEqual(2)

    // Conteo por archivo (IEC 62443 ×2, README ×1)
    const rows = screen.getAllByText('/recursos/estandares/IEC_62443_resumen.docx')
    expect(rows.length).toBeGreaterThanOrEqual(2) // conteo + eventos
    expect(screen.getAllByText('/recursos/README.docx').length).toBeGreaterThanOrEqual(1)

    // Telemetría de IPs visibles solo aquí (203.0.113.9 aparece en dos eventos)
    expect(screen.getAllByText('203.0.113.9').length).toBe(2)
    expect(screen.getByText('198.51.100.4')).toBeDefined()
    expect(screen.getByText('AR')).toBeDefined()
    expect(screen.getByText('CL')).toBeDefined()
  })

  it('renders the per-day and per-volume charts', async () => {
    vi.stubEnv('DOWNLOAD_STATS_TOKEN', 'secreta-123')
    const ui = await page('secreta-123')
    const { container } = render(ui)

    // Gráfica por día: columna de hoy con el total de eventos
    expect(screen.getByRole('heading', { name: /Descargas por día/ })).toBeDefined()
    const column = container.querySelector(`[data-day="${TODAY_ISO.slice(0, 10)}"]`)
    expect(column).not.toBeNull()
    expect(column?.getAttribute('title')).toContain(
      `${TODAY_ISO.slice(8, 10)}/${TODAY_ISO.slice(5, 7)}: 3 descargas`,
    )
    expect(container.querySelectorAll('[data-day]').length).toBe(30)

    // Gráfica por volumen: Estándares ×2, Proyecto ×1, resto en cero
    expect(screen.getByRole('heading', { name: /Descargas por volumen/ })).toBeDefined()
    expect(container.querySelector('[data-volume="standards"]')?.textContent).toContain('Estándares')
    expect(container.querySelector('[data-volume="standards"]')?.textContent).toContain('2')
    expect(container.querySelector('[data-volume="project"]')?.textContent).toContain('1')
    expect(container.querySelector('[data-volume="vol4"]')?.textContent).toContain('0')
    // 'otros' en cero no se muestra
    expect(container.querySelector('[data-volume="otros"]')).toBeNull()
  })

  it('shows the empty state when there are no downloads', async () => {
    vi.stubEnv('DOWNLOAD_STATS_TOKEN', 'secreta-123')
    vi.mocked(readRecent).mockResolvedValue([])
    const ui = await page('secreta-123')
    const { container } = render(ui)
    expect(screen.getByText(/Sin descargas registradas/)).toBeDefined()
    // Sin datos no se pintan gráficas
    expect(container.querySelector('[data-day]')).toBeNull()
    expect(container.querySelector('[data-volume]')).toBeNull()
  })
})
