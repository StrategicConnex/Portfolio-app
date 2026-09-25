import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import EstadisticasDescargas from './page'
import { readRecent } from '@/lib/download-stats'
import { createPanelCookieValue } from '@/lib/panel-auth'
import type { DownloadEvent } from '@/lib/download-stats'

vi.mock('@/lib/download-stats', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/download-stats')>()
  return { ...actual, readRecent: vi.fn() }
})

// next/headers seam: los tests controlan la cookie de sesión por test.
const cookieStore = { get: vi.fn<(name: string) => { name: string; value: string } | undefined>() }
vi.mock('next/headers', () => ({
  cookies: async () => cookieStore,
}))

// Mismos día UTC para los tres eventos: la gráfica por día debe sumar 3.
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
    vi.stubEnv('DOWNLOAD_STATS_TOKEN', 'secreta-123')
    vi.mocked(readRecent).mockResolvedValue(FIXTURES)
    cookieStore.get.mockReset()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.clearAllMocks()
  })

  it('responds 404 when the auth env is not configured', async () => {
    vi.stubEnv('DOWNLOAD_STATS_TOKEN', '')
    await expect(page('cualquiera')).rejects.toThrow()
  })

  it('responds 404 without a session cookie or token', async () => {
    cookieStore.get.mockReturnValue(undefined)
    await expect(page()).rejects.toThrow()
    await expect(page('clave-equivocada')).rejects.toThrow()
  })

  it('renders the panel for a valid signed session cookie', async () => {
    cookieStore.get.mockImplementation((name: string) =>
      name === 'panel_auth' ? { name, value: createPanelCookieValue()! } : undefined,
    )
    const ui = await page()
    render(ui)

    expect(screen.getByText('Descargas de la biblioteca')).toBeDefined()
    expect(screen.getByText('3')).toBeDefined()
    // Logout disponible en la sesión
    expect(screen.getByRole('button', { name: 'Cerrar sesión' })).toBeDefined()
  })

  it('redirects the legacy ?k= token to the login that mints the cookie', async () => {
    // Sin cookie pero con el token correcto: el panel deriva al route handler
    // de login (el cual emite la cookie y regresa al panel con URL limpia).
    cookieStore.get.mockReturnValue(undefined)
    await expect(page('secreta-123')).rejects.toThrow('NEXT_REDIRECT')
  })

  it('renders totals, per-file counts and the IP of each event', async () => {
    cookieStore.get.mockImplementation((name: string) =>
      name === 'panel_auth' ? { name, value: createPanelCookieValue()! } : undefined,
    )
    const ui = await page()
    const { container } = render(ui)

    // KPIs: 3 eventos; '2' aparece en archivos distintos, IPs distintas y el conteo de IEC 62443
    expect(screen.getByText('3')).toBeDefined()
    expect(screen.getAllByText('2').length).toBeGreaterThanOrEqual(2)

    // Conteo por archivo (IEC 62443 ×2, README ×1)
    const rows = screen.getAllByText('/recursos/estandares/IEC_62443_resumen.docx')
    expect(rows.length).toBeGreaterThanOrEqual(2) // conteo + eventos
    expect(screen.getAllByText('/recursos/README.docx').length).toBeGreaterThanOrEqual(1)

    // Telemetría de IPs visible solo aquí (203.0.113.9 aparece en dos eventos)
    expect(screen.getAllByText('203.0.113.9').length).toBe(2)
    expect(screen.getByText('198.51.100.4')).toBeDefined()
    expect(screen.getByText('AR')).toBeDefined()
    expect(screen.getByText('CL')).toBeDefined()
  })

  it('renders the per-day and per-volume charts', async () => {
    cookieStore.get.mockImplementation((name: string) =>
      name === 'panel_auth' ? { name, value: createPanelCookieValue()! } : undefined,
    )
    const ui = await page()
    const { container } = render(ui)

    expect(screen.getByRole('heading', { name: /Descargas por día/ })).toBeDefined()
    const column = container.querySelector(`[data-day="${TODAY_ISO.slice(0, 10)}"]`)
    expect(column).not.toBeNull()
    expect(column?.getAttribute('title')).toContain(
      `${TODAY_ISO.slice(8, 10)}/${TODAY_ISO.slice(5, 7)}: 3 descargas`,
    )
    expect(container.querySelectorAll('[data-day]').length).toBe(30)

    expect(container.querySelector('[data-volume="standards"]')?.textContent).toContain('2')
    expect(container.querySelector('[data-volume="project"]')?.textContent).toContain('1')
    expect(container.querySelector('[data-volume="otros"]')).toBeNull()
  })

  it('shows the empty state when there are no downloads', async () => {
    cookieStore.get.mockImplementation((name: string) =>
      name === 'panel_auth' ? { name, value: createPanelCookieValue()! } : undefined,
    )
    vi.mocked(readRecent).mockResolvedValue([])
    const ui = await page()
    const { container } = render(ui)
    expect(screen.getByText(/Sin descargas registradas/)).toBeDefined()
    expect(container.querySelector('[data-day]')).toBeNull()
  })
})
