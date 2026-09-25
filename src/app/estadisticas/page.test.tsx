import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import EstadisticasPublicas from './page'
import { readRecent } from '@/lib/download-stats'
import type { DownloadEvent } from '@/lib/download-stats'

vi.mock('@/lib/server-i18n', () => {
  const dict: Record<string, string> = {
    'stats.kicker': 'Métricas en vivo',
    'stats.title': 'Estadísticas de',
    'stats.highlight': 'descargas',
    'stats.intro': 'Uso agregado de la biblioteca.',
    'stats.privacy_note': 'Solo métricas agregadas y anónimas.',
    'stats.empty': 'Sin descargas registradas todavía.',
    'stats.kpis': 'Indicadores de descargas',
    'stats.kpi.total': 'Descargas totales',
    'stats.kpi.files': 'Documentos distintos',
    'stats.kpi.countries': 'Países',
    'stats.kpi.last30': 'Últimos 30 días',
    'stats.by_day.title': 'Descargas por día',
    'stats.by_day.subtitle': '· últimos 30 días (UTC)',
    'stats.day_one': 'descarga',
    'stats.day_many': 'descargas',
    'stats.by_volume.title': 'Descargas por volumen',
    'stats.by_country.title': 'Descargas por país',
    'stats.country_unknown': 'Sin dato de país',
    'stats.by_file.title': 'Top de documentos',
    'stats.by_file.file': 'Documento',
    'stats.by_file.downloads': 'Descargas',
    'stats.footer_note': 'Los datos se registran al momento de cada descarga.',
    'recursos.cat.vol1': 'Vol. I · IT',
    'recursos.cat.vol2': 'Vol. II · OT',
    'recursos.cat.vol3': 'Vol. III · Integración',
    'recursos.cat.vol4': 'Vol. IV · Ciberseguridad',
    'recursos.cat.vol5': 'Vol. V · Tendencias',
    'recursos.cat.standards': 'Estándares',
    'recursos.cat.project': 'Proyecto',
    'recursos.cat.otros': 'Otros',
  }
  return {
    getServerT: async () => ({
      language: 'es' as const,
      t: (key: string) => dict[key] || key,
      dict,
    }),
  }
})

vi.mock('@/lib/download-stats', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/download-stats')>()
  return { ...actual, readRecent: vi.fn() }
})

// Mismo día UTC para los cuatro eventos: la columna de hoy debe sumar 4.
const TODAY_ISO = new Date().toISOString()
const FIXTURES: DownloadEvent[] = [
  { file: '/recursos/estandares/IEC_62443_resumen.docx', ts: TODAY_ISO, ip: '203.0.113.9', country: 'AR', ua: 'Mozilla/5.0 Test' },
  { file: '/recursos/estandares/IEC_62443_resumen.docx', ts: TODAY_ISO, ip: '198.51.100.4', country: 'CL' },
  { file: '/recursos/guias/vol4/guia_soc_industrial.docx', ts: TODAY_ISO, ip: '198.51.100.7', country: 'MX' },
  { file: '/recursos/README.docx', ts: TODAY_ISO, ip: '203.0.113.9' }, // sin país → ??
]

const kpiValue = (label: string) => screen.getByText(label).parentElement?.textContent ?? ''

describe('estadisticas (pública)', () => {
  beforeEach(() => {
    vi.mocked(readRecent).mockResolvedValue(FIXTURES)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders KPIs, aggregated per-file counts and country bars — never IPs or user agents', async () => {
    const ui = await EstadisticasPublicas()
    const { container } = render(ui)

    expect(screen.getByText('Estadísticas de')).toBeDefined()
    expect(kpiValue('Descargas totales')).toContain('4')
    expect(kpiValue('Países')).toContain('3')

    // Tabla por documento (agregada)
    expect(screen.getAllByText('/recursos/estandares/IEC_62443_resumen.docx').length).toBeGreaterThanOrEqual(1)

    // Países visibles como agregación de baja resolución + bucket "sin dato"
    expect(screen.getByText('AR')).toBeDefined()
    expect(screen.getByText('CL')).toBeDefined()
    expect(screen.getByText('MX')).toBeDefined()
    expect(screen.getByText('Sin dato de país')).toBeDefined()

    // Privacidad: ni IPs ni user-agents individuales llegan al HTML
    expect(container.textContent).not.toContain('203.0.113.9')
    expect(container.textContent).not.toContain('198.51.100.4')
    expect(container.textContent).not.toContain('Mozilla')
    expect(container.textContent).not.toContain('curl')
  })

  it('renders the 30-day chart with today aggregated to the total', async () => {
    const ui = await EstadisticasPublicas()
    const { container } = render(ui)

    const today = TODAY_ISO.slice(0, 10)
    const column = container.querySelector(`[data-day="${today}"]`)
    expect(column).not.toBeNull()
    expect(column?.getAttribute('title')).toContain(
      `${today.slice(8, 10)}/${today.slice(5, 7)}: 4 descargas`,
    )
    expect(container.querySelectorAll('[data-day]').length).toBe(30)
  })

  it('renders volume and country bars with the aggregated counts', async () => {
    const ui = await EstadisticasPublicas()
    const { container } = render(ui)

    expect(container.querySelector('[data-volume="vol4"]')?.textContent).toContain('1')
    expect(container.querySelector('[data-volume="standards"]')?.textContent).toContain('2')
    expect(container.querySelector('[data-volume="project"]')?.textContent).toContain('1')
    expect(container.querySelector('[data-country="AR"]')?.textContent).toContain('1')
    expect(container.querySelector('[data-country="??"]')?.textContent).toContain('1')
  })

  it('shows the empty state when there are no downloads', async () => {
    vi.mocked(readRecent).mockResolvedValue([])
    const ui = await EstadisticasPublicas()
    const { container } = render(ui)

    expect(screen.getByText(/Sin descargas registradas/)).toBeDefined()
    expect(container.querySelector('[data-day]')).toBeNull()
    expect(container.querySelector('[data-country]')).toBeNull()
  })
})
