import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import SIEMDashboard from './SIEMDashboard'
import type { SiemFeedPayload } from '@/lib/siem-feed'
import { SIEM_COMMAND_EVENT } from '@/lib/siem-command'
import { dispatchSiemCommand, resetSiemCommandBus } from '@/lib/siem-command-bus'

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) =>
      <div {...(props as Record<string, unknown>)}>{children}</div>,
    span: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) =>
      <span {...(props as Record<string, unknown>)}>{children}</span>,
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
  useInView: () => true,
}))

const mockT = vi.fn((key: string) => {
  const translations: Record<string, string> = {
    'siem.label': 'Security Operations',
    'siem.title': 'SIEM',
    'siem.highlight': 'Dashboard',
    'siem.map_desc':
      'Inteligencia global agregada en tiempo real (Abuse.ch Feodo Tracker + DShield/SANS ISC).',
    'siem.live_badge': 'FEED GLOBAL · DATOS REALES',
    'siem.map.title': 'Mapa de Ciberataques en Tiempo Real',
    'siem.map.open_full': 'Abrir en pantalla completa',
    'siem.map.unavailable': 'La visualización 3D no está disponible en este navegador.',
    'siem.hover_hint': '▸ Hover: mitigación recomendada (no ejecutada)',
    'siem.ui.event_stream': 'Event Stream – Inteligencia global',
    'siem.ui.stream_aria': 'Stream de eventos de inteligencia de amenazas global',
    'siem.ui.filter.active':
      'Filtro del copilot: {level} · {count} eventos en la ventana',
    'siem.ui.filter.active_one': 'Filtro del copilot: {level} · 1 evento en la ventana',
    'siem.ui.filter.empty':
      'Filtro del copilot: {level} · sin eventos de ese nivel en la ventana actual',
    'siem.ui.filter.clear': 'Quitar el filtro del SIEM',
    'siem.ui.connecting': 'Conectando con los feeds de inteligencia de amenazas…',
    'siem.ui.no_data':
      'Feed no disponible en este momento: los datos reales aparecen solo cuando los proveedores responden.',
    'siem.ui.mitigation': 'Respuesta recomendada (no ejecutada)',
    'siem.ui.estimated': 'Est. de ejecución',
    'siem.ui.live_metrics': 'Métricas del feed',
    'siem.ui.top_attackers': 'Top de Países (según Feodo)',
    'siem.ui.top_targeted': 'Puertos más atacados (SANS ISC)',
    'siem.ui.botnet_families': 'Familias de botnet (Feodo)',
    'siem.ui.feed_status': 'Estado de los feeds',
    'siem.feed.live': 'ACTIVO',
    'siem.feed.down': 'SIN DATOS',
    'siem.kpi.c2_ips': 'IPs C2 (Feodo)',
    'siem.kpi.top_ports': 'Puertos más atacados',
    'siem.kpi.scan_reports': 'Reportes de escaneo',
    'siem.kpi.updated': 'Última actualización',
    'siem.ui.threat_summary': 'Resumen de Amenazas',
    'siem.ui.threat_summary_aria': 'Resumen de amenazas',
  }
  return translations[key] || key
})

vi.mock('@/context/LanguageContext', () => ({
  useLanguage: () => ({
    language: 'es',
    setLanguage: vi.fn(),
    t: mockT,
  }),
}))

// El mapa 3D se sustituye por un stub: en jsdom no hay WebGL y el componente
// real dispara un fetch a /api/threat-intel que no puede resolverse. Lo que
// se verifica aquí es el panel y el bloque que lo aloja.
vi.mock('./CyberAttackMap3D', () => ({
  default: () => <div data-testid="threat-map" />,
}))

vi.mock('@/components/ui/Icon', () => ({
  default: ({ name, label }: { name: string; label: string; size?: number }) => (
    <span data-testid={'icon-' + name} aria-label={label}>[{name}]</span>
  ),
}))

vi.mock('@/components/ui/SectionHeader', () => ({
  default: ({ label, title, highlight }: { label: string; title: string; highlight?: string }) => (
    <div data-testid="section-header"><span>{label}</span><h2>{title} {highlight}</h2></div>
  ),
}))

vi.mock('@/components/ui/FadeIn', () => ({
  default: ({ children }: { children: React.ReactNode; delay?: number }) => (
    <div data-testid="fade-in">{children}</div>
  ),
}))

/* Fixtures: un payload real (los que produce lib/siem-feed) y uno degradado. */

const livePayload: SiemFeedPayload = {
  logs: [
    {
      id: 'feodo-45.123.45.67',
      at: '2026-10-24T12:30:00.000Z',
      time: '12:30:00',
      level: 'CRITICAL',
      src: '45.123.45.67',
      msg: 'Active C2 communication channel detected (AsyncRAT)',
      feed: 'Abuse.ch Feodo Tracker',
      country: 'NL',
      malware: 'AsyncRAT',
      port: 8080,
      mitigation: {
        action: 'Recomendado: bloquear y registrar tráfico hacia este C2 (puerto 8080)',
        steps: ['Add the IP to the perimeter blocklist', 'Restrict egress on TCP 8080'],
        time: '< 5 min',
      },
    },
    {
      id: 'feodo-103.10.11.12',
      at: '2026-10-24T12:29:00.000Z',
      time: '12:29:00',
      level: 'ALERT',
      src: '103.10.11.12',
      msg: 'Botnet C2 infrastructure reported (RhinoBlare)',
      feed: 'Abuse.ch Feodo Tracker',
    },
    {
      id: 'dshield-port-22',
      at: '2026-10-24T12:28:00.000Z',
      time: '12:28:00',
      level: 'WARN',
      src: 'SANS ISC (aggregate)',
      msg: 'Port 22 is among the most attacked ports worldwide (1,200,000 events)',
      feed: 'DShield (SANS ISC)',
      port: 22,
      reports: 1_200_000,
      mitigation: {
        action: 'Recomendado: mantener rate-limit y blocklists actualizadas en el perímetro',
        steps: ['Keep edge rate-limiting for unsolicited inbound traffic'],
        time: '< 1 min',
      },
    },
    {
      id: 'dshield-185.220.101.34',
      at: '2026-10-24T12:27:00.000Z',
      time: '12:27:00',
      level: 'WARN',
      src: '185.220.101.34',
      msg: 'Heavy scan/probe activity reported against SANS sensors (150,000 reports)',
      feed: 'DShield (SANS ISC)',
      reports: 150_000,
    },
  ],
  lastUpdated: '2026-10-24T15:34:56.000Z',
  source: 'Agregación en tiempo real: Abuse.ch Feodo Tracker + DShield (SANS ISC)',
  usingLiveData: true,
  summary: {
    critical: 7,
    alert: 5,
    warn: 4,
    info: 2,
    c2Unique: 3,
    targetedPorts: 6,
    scanReports: 123_456,
  },
  attackers: [
    { label: 'United States', count: 2 },
    { label: 'Netherlands', count: 1 },
  ],
  ports: [
    { port: 445, records: 700_000, sources: 900 },
    { port: 22, records: 1_200_000, sources: 800 },
  ],
  malware: [
    { label: 'AsyncRAT', count: 2 },
    { label: 'Glupteba', count: 1 },
  ],
  feedsStatus: { feodo: 'live', dshield: 'live' },
  cacheTtlSeconds: { feodo: 60, dshield: 300, payload: 30 },
}

const degradedPayload: SiemFeedPayload = {
  logs: [],
  lastUpdated: '2026-10-24T15:34:56.000Z',
  source: 'Agregación en tiempo real: Abuse.ch Feodo Tracker + DShield (SANS ISC)',
  usingLiveData: false,
  summary: {
    critical: 0,
    alert: 0,
    warn: 0,
    info: 0,
    c2Unique: 0,
    targetedPorts: 0,
    scanReports: 0,
  },
  attackers: [],
  ports: [],
  malware: [],
  feedsStatus: { feodo: 'unavailable', dshield: 'unavailable' },
  cacheTtlSeconds: { feodo: 60, dshield: 300, payload: 30 },
}

function respondPayload(payload: SiemFeedPayload) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () =>
      new Response(JSON.stringify(payload), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    ),
  )
}

function renderDashboard() {
  return render(<SIEMDashboard />)
}

describe('SIEMDashboard', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    resetSiemCommandBus()
  })

  it('should render the section header, the map link and the clock', async () => {
    respondPayload(livePayload)
    renderDashboard()
    expect(await screen.findByText('Security Operations')).toBeDefined()
    expect(screen.getByText('SIEM Dashboard')).toBeDefined()

    const link = screen.getByRole('link', { name: /Abrir en pantalla completa/ })
    expect(link.getAttribute('href')).toBe('/cyber-attack-map')
    expect(link.getAttribute('rel')).toBe('noopener noreferrer')
    expect(screen.getAllByText(/UTC-3/).length).toBeGreaterThan(0)
    expect(screen.getByText(/IEC 62443/)).toBeDefined()
  })

  it('should label the panel honestly as an aggregated real-data feed', async () => {
    respondPayload(livePayload)
    renderDashboard()
    expect(await screen.findByText('FEED GLOBAL · DATOS REALES')).toBeDefined()

    // Sin reliquias de la simulación anterior.
    expect(screen.queryByText(/MAPA EN VIVO/)).toBeNull()
    expect(screen.queryByText(/Simular Incidente/)).toBeNull()
    expect(screen.queryByText(/SIMULADO|SIMULATED/i)).toBeNull()
    expect(screen.queryByText(/RADWARE/i)).toBeNull()
  })

  it('should poll /api/siem-feed and stream the real entries', async () => {
    respondPayload(livePayload)
    renderDashboard()

    expect(await screen.findByText('45.123.45.67')).toBeDefined()
    expect(screen.getByText(/Active C2 communication channel/i)).toBeDefined()
    expect(screen.getByText('SANS ISC (aggregate)')).toBeDefined()

    expect(vi.mocked(globalThis.fetch)).toHaveBeenCalledWith(
      '/api/siem-feed',
      expect.objectContaining({ headers: expect.anything() }),
    )
  })

  it('should show real level counts and live feed status', async () => {
    respondPayload(livePayload)
    renderDashboard()

    await screen.findByText('CRITICAL')
    // Cada nivel aparece en el resumen y (si el feed lo trajo) en el stream:
    // basta con confirmar que es visible.
    expect(screen.getAllByText('CRITICAL').length).toBeGreaterThan(0)
    expect(screen.getAllByText('ALERT').length).toBeGreaterThan(0)
    expect(screen.getAllByText('WARN').length).toBeGreaterThan(0)
    expect(screen.getAllByText('INFO').length).toBeGreaterThan(0)
    // Conteos exactos del payload ('2' también es el conteo de AsyncRAT
    // en la lista lateral: basta con confirmar su presencia).
    expect(screen.getByText('7')).toBeDefined()
    expect(screen.getByText('5')).toBeDefined()
    expect(screen.getByText('4')).toBeDefined()
    expect(screen.getAllByText('2').length).toBeGreaterThan(0)
    // Ambos feeds ACTIVO.
    expect(screen.getAllByText('ACTIVO')).toHaveLength(2)
    expect(screen.queryByText('SIN DATOS')).toBeNull()
  })

  it('should derive the KPIs from the payload summary', async () => {
    respondPayload(livePayload)
    renderDashboard()

    expect(await screen.findByText('123,456')).toBeDefined()
    expect(screen.getByText('3')).toBeDefined()
    expect(screen.getByText('6')).toBeDefined()
    expect(screen.getByText(/12:34:56 UTC-3/)).toBeDefined()
  })

  it('should populate the sidebar lists from the payload', async () => {
    respondPayload(livePayload)
    renderDashboard()

    expect(await screen.findByText('United States')).toBeDefined()
    expect(screen.getByText(':445')).toBeDefined()
    expect(screen.getByText('AsyncRAT')).toBeDefined()
  })

  it('should state the feed status honestly when nothing responds', async () => {
    respondPayload(degradedPayload)
    renderDashboard()

    expect(
      await screen.findByText(
        'Feed no disponible en este momento: los datos reales aparecen solo cuando los proveedores responden.',
      ),
    ).toBeDefined()
    expect(screen.getAllByText('SIN DATOS')).toHaveLength(2)
    expect(screen.queryByText('ACTIVO')).toBeNull()
  })

  it('should filter the stream by severity when the copilot asks for it', async () => {
    respondPayload(livePayload)
    renderDashboard()
    await screen.findByText('45.123.45.67')

    act(() => {
      window.dispatchEvent(
        new CustomEvent(SIEM_COMMAND_EVENT, {
          detail: { action: 'filter-severity', level: 'CRITICAL' },
        }),
      )
    })

    // Solo queda el evento CRITICAL real de la ventana.
    expect(screen.getByText('45.123.45.67')).toBeDefined()
    expect(screen.queryByText('103.10.11.12')).toBeNull()
    expect(screen.queryByText('SANS ISC (aggregate)')).toBeNull()
    expect(
      screen.getByText('Filtro del copilot: CRITICAL · 1 evento en la ventana'),
    ).toBeDefined()

    fireEvent.click(screen.getByRole('button', { name: 'Quitar el filtro del SIEM' }))
    expect(await screen.findByText('103.10.11.12')).toBeDefined()
    expect(screen.queryByText(/Filtro del copilot/)).toBeNull()
  })

  it('should apply the last copilot filter when the panel mounts later', async () => {
    // El chat emitió la orden antes de que el panel estuviera montado.
    dispatchSiemCommand({ action: 'filter-severity', level: 'WARN' })
    respondPayload(livePayload)
    renderDashboard()

    expect(
      await screen.findByText('Filtro del copilot: WARN · 2 eventos en la ventana'),
    ).toBeDefined()
    expect(screen.queryByText('45.123.45.67')).toBeNull()
    expect(screen.getByText('SANS ISC (aggregate)')).toBeDefined()
  })

  it('should show the recommendation-not-executed tooltip on hover', async () => {
    respondPayload(livePayload)
    renderDashboard()

    const row = await screen.findByText(/Active C2 communication channel/i)
    fireEvent.mouseEnter(row.closest('div') as HTMLElement)

    await waitFor(() => {
      expect(screen.getByText('Respuesta recomendada (no ejecutada)', { exact: false })).toBeDefined()
    })
  })
})
