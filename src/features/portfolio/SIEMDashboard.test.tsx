import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import SIEMDashboard from './SIEMDashboard'

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
    'siem.map_desc': 'Mapa de amenazas con datos reales de DShield y CISA KEV',
    'siem.demo_badge': 'MAPA EN VIVO · PANEL SIMULADO',
    'siem.map.title': 'Mapa de Ciberataques en Tiempo Real',
    'siem.map.open_full': 'Abrir en pantalla completa',
    'siem.hover_hint': 'Hover over an ALERT event',
    'siem.incident_btn': 'Simular Incidente Industrial',
    'siem.incident_btn_active': 'ANALIZANDO EVENTO...',
    'siem.ui.event_stream': 'Event Stream - IT/OT Level',
    'siem.ui.stream_aria': 'Real-time security event stream',
    'siem.ui.availability': 'Purdue Zone Availability',
    'siem.ui.threat_summary': 'Threat Summary',
    'siem.ui.threat_summary_aria': 'Threat summary',
    'siem.ui.operational_kpis': 'Operational KPIs',
    'siem.ui.top_attackers': 'Top Attackers',
    'siem.ui.top_attacked': 'Top Attacked',
    'siem.ui.attack_vectors': 'Attack Vectors',
    'siem.kpi.uptime': 'Industrial Network Uptime',
    'siem.kpi.blocked': 'Blocked Attacks (24h)',
    'siem.kpi.alerts': 'Active Critical Alerts',
    'siem.zone.field': 'Level 1 - Field Devices',
    'siem.zone.control': 'Level 2 - Process Control',
    'siem.zone.operations': 'Level 3 - Plant Operations',
    'siem.zone.idmz': 'Industrial DMZ',
    'siem.zone.enterprise': 'Level 4 - Enterprise Network (+ Level 5 Cloud)',
    'siem.ui.auto_response': 'Respuesta automatica',
    'siem.ui.mttr': 'MTTR',
    'siem.ui.incident_title': 'SIMULATED INCIDENT',
    'siem.ui.incident_desc': 'Anomaly detection in field devices',
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

function renderDashboard() {
  return render(<SIEMDashboard />)
}

describe('SIEMDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should render the section header', () => {
    renderDashboard()
    expect(screen.getByTestId('section-header')).toBeDefined()
    expect(screen.getByText('Security Operations')).toBeDefined()
    expect(screen.getByText('SIEM Dashboard')).toBeDefined()
  })

  it('should label the dashboard honestly: live map, simulated panel', () => {
    renderDashboard()
    // El badge distingue lo real (el mapa) de lo simulado (el panel). No puede
    // afirmar que todo el panel es inteligencia en vivo.
    expect(screen.getByText(/MAPA EN VIVO · PANEL SIMULADO/)).toBeDefined()
    expect(screen.queryByText(/EN VIVO · INTELIGENCIA REAL/)).toBeNull()
    expect(screen.queryByText(/RADWARE/i)).toBeNull()
  })

  it('should embed the real-time map with a link to the full-screen page', () => {
    renderDashboard()
    expect(screen.getByText('Mapa de Ciberataques en Tiempo Real')).toBeDefined()

    const link = screen.getByRole('link', { name: /Abrir en pantalla completa/ })
    expect(link.getAttribute('href')).toBe('/cyber-attack-map')
    expect(link.getAttribute('rel')).toBe('noopener noreferrer')
  })

  it('should render the simulate incident button', () => {
    renderDashboard()
    expect(screen.getByText('Simular Incidente Industrial')).toBeDefined()
  })

  it('should show threat summary section', () => {
    renderDashboard()
    expect(screen.getByText('Threat Summary')).toBeDefined()
  })

  it('should show top attackers section', () => {
    renderDashboard()
    expect(screen.getByText('Top Attackers')).toBeDefined()
  })

  it('should show attack vectors section', () => {
    renderDashboard()
    expect(screen.getByText('Attack Vectors')).toBeDefined()
  })

  it('should show operational KPIs section', () => {
    renderDashboard()
    expect(screen.getByText('Operational KPIs')).toBeDefined()
  })

  it('should show the event stream section', () => {
    renderDashboard()
    expect(screen.getByText(/Event Stream/)).toBeDefined()
  })

  it('should show Purdue zone availability', () => {
    renderDashboard()
    expect(screen.getByText('Purdue Zone Availability')).toBeDefined()
  })

  it('should display UTC-3 time', () => {
    renderDashboard()
    expect(screen.getByText(/UTC-3/)).toBeDefined()
  })

  it('should show IEC/NIST/ISO standards in header', () => {
    renderDashboard()
    expect(screen.getByText(/IEC 62443/)).toBeDefined()
    expect(screen.getByText(/NIST CSF/)).toBeDefined()
    expect(screen.getByText(/ISO 27001/)).toBeDefined()
  })

  it('should render threat levels CRITICAL, HIGH, MEDIUM, LOW', () => {
    renderDashboard()
    expect(screen.getByText('CRITICAL')).toBeDefined()
    expect(screen.getByText('HIGH')).toBeDefined()
    expect(screen.getByText('MEDIUM')).toBeDefined()
    expect(screen.getByText('LOW')).toBeDefined()
  })

  it('should change button text when incident is triggered', () => {
    renderDashboard()
    act(() => {
      fireEvent.click(screen.getByText('Simular Incidente Industrial'))
    })
    expect(screen.getByText('ANALIZANDO EVENTO...')).toBeDefined()
  })

  it('should disable button during incident', () => {
    renderDashboard()
    const button = screen.getByText('Simular Incidente Industrial') as HTMLButtonElement
    act(() => {
      fireEvent.click(button)
    })
    expect(button.disabled).toBe(true)
  })

  it('should restore button after incident timeout', () => {
    renderDashboard()
    act(() => {
      fireEvent.click(screen.getByText('Simular Incidente Industrial'))
    })
    expect(screen.getByText('ANALIZANDO EVENTO...')).toBeDefined()
    act(() => {
      vi.advanceTimersByTime(7000)
    })
    expect(screen.getByText('Simular Incidente Industrial')).toBeDefined()
  })
})
