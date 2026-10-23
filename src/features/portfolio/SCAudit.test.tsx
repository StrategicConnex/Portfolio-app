import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import SCAudit from './SCAudit'

vi.mock('framer-motion', async () => {
  const { createMotionMock } = await import('@/test-utils/framer-motion')
  return {
    motion: createMotionMock(['div', 'span']),
    AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
    useInView: () => true,
  }
})

vi.mock('next/image', async () => {
  const { createImageMock } = await import('@/test-utils/framer-motion')
  return createImageMock()
})

const mockT = vi.fn((key: string) => {
  const m: Record<string, string> = {
    'scaudit.label': 'SCAudit Pro',
    'scaudit.title': 'Monitor',
    'scaudit.highlight': 'Inteligente',
    'scaudit.description': 'Descripción de SCAudit',
    'scaudit.status.live': 'LIVE',
    'scaudit.img.alt': 'SCAudit Dashboard',
    'scaudit.feat.discovery.name': 'Descubrimiento',
    'scaudit.feat.discovery.desc': 'Activos expuestos',
    'scaudit.feat.mitre.name': 'MITRE Mapping',
    'scaudit.feat.mitre.desc': 'ATT&CK por táctica',
    'scaudit.feat.api.name': 'API',
    'scaudit.feat.api.desc': 'REST v1',
    'scaudit.feat.siem.name': 'SIEM',
    'scaudit.feat.siem.desc': 'Alertas multi-canal',
    'scaudit.feat.ai.name': 'AI Insights',
    'scaudit.feat.ai.desc': 'Recomendaciones IA',
    'scaudit.feat.reports.name': 'Reportes',
    'scaudit.feat.reports.desc': 'PDF white-label',
    'scaudit.feat.defense.name': 'Hardening',
    'scaudit.feat.defense.desc': 'CSP + rate limit',
    'scaudit.feat.pwa.name': 'PWA',
    'scaudit.feat.pwa.desc': 'Offline + push',
    'scaudit.metrics.title': 'MÉTRICAS',
    'scaudit.metrics.source': 'scaudit.vercel.app',
    'scaudit.cta.badge': 'BETA PÚBLICA',
    'scaudit.cta.title': 'Probá SCAudit',
    'scaudit.cta.desc': 'Monitoreá tu sitio',
    'scaudit.cta.primary': 'Ir a SCAudit',
    'scaudit.cta.secondary': 'Más info',
  }
  return m[key] || key
})

vi.mock('@/context/LanguageContext', () => ({
  useLanguage: () => ({ language: 'es', setLanguage: vi.fn(), t: mockT }),
}))

vi.mock('@/components/ui/SectionHeader', () => ({
  default: ({ label, title, highlight, center }: { label: string; title: string; highlight?: string; center?: boolean }) => (
    <div data-testid="section-header" data-center={String(center)}>{label} - {title} {highlight}</div>
  ),
}))

vi.mock('@/components/ui/FadeIn', () => ({
  default: ({ children, delay }: { children: React.ReactNode; delay?: number }) => (
    <div data-testid="fade-in" data-delay={delay}>{children}</div>
  ),
}))

describe('SCAudit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render the section with correct id and aria-label', () => {
    render(<SCAudit />)
    const section = document.querySelector('section#scaudit')
    expect(section).toBeDefined()
    expect(section?.getAttribute('aria-label')).toBe('SCAudit Pro')
  })

  it('should render the section header', () => {
    render(<SCAudit />)
    expect(screen.getByTestId('section-header')).toBeDefined()
    // Use getAllByText for 'Monitor' as it appears in header and feature descriptions
    const monitorTexts = screen.getAllByText(/Monitor/)
    expect(monitorTexts.length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText(/Inteligente/)).toBeDefined()
  })

  it('should render the description', () => {
    render(<SCAudit />)
    expect(screen.getByText('Descripción de SCAudit')).toBeDefined()
  })

  it('should render the verified product badges', () => {
    render(<SCAudit />)
    expect(screen.getByText('MITRE ATT&CK')).toBeDefined()
    expect(screen.getByText('API REST v1')).toBeDefined()
    expect(screen.getByText('BETA')).toBeDefined()
  })

  it('should render the product image with correct alt text', () => {
    render(<SCAudit />)
    const img = screen.getByAltText('SCAudit Dashboard')
    expect(img).toBeDefined()
    expect(img.getAttribute('src')).toBe('/scaudit-dashboard.webp')
  })

  it('should render the LIVE status indicator', () => {
    render(<SCAudit />)
    expect(screen.getByText('LIVE')).toBeDefined()
  })

  it('should render all 8 feature cards with names and descriptions', () => {
    render(<SCAudit />)
    expect(screen.getByText('Descubrimiento')).toBeDefined()
    expect(screen.getByText('Activos expuestos')).toBeDefined()
    expect(screen.getByText('MITRE Mapping')).toBeDefined()
    expect(screen.getByText('ATT&CK por táctica')).toBeDefined()
    expect(screen.getByText('API')).toBeDefined()
    expect(screen.getByText('REST v1')).toBeDefined()
    expect(screen.getByText('SIEM')).toBeDefined()
    expect(screen.getByText('Alertas multi-canal')).toBeDefined()
    expect(screen.getByText('AI Insights')).toBeDefined()
    expect(screen.getByText('Reportes')).toBeDefined()
    expect(screen.getByText('PDF white-label')).toBeDefined()
    expect(screen.getByText('Hardening')).toBeDefined()
    expect(screen.getByText('CSP + rate limit')).toBeDefined()
    expect(screen.getByText('PWA')).toBeDefined()
    expect(screen.getByText('Offline + push')).toBeDefined()
  })

  it('should render metrics section title', () => {
    render(<SCAudit />)
    expect(screen.getByText('MÉTRICAS')).toBeDefined()
  })

  // Cifras verificadas contra scaudit.vercel.app (/mitre-coverage y /openapi.json).
  // Si cambian en el producto, este test debe fallar y forzar la actualización.
  it('should render the 6 verified capability pills with real values', () => {
    render(<SCAudit />)
    expect(screen.getByText('MITRE')).toBeDefined()
    expect(screen.getByText('23')).toBeDefined()
    expect(screen.getByText('Técnicas ATT&CK v15')).toBeDefined()
    expect(screen.getByText('Tácticas')).toBeDefined()
    expect(screen.getByText('7/14')).toBeDefined()
    expect(screen.getByText('Herramientas')).toBeDefined()
    expect(screen.getByText('46')).toBeDefined()
    expect(screen.getByText('API REST')).toBeDefined()
    expect(screen.getByText('10')).toBeDefined()
    expect(screen.getByText('Rate limit')).toBeDefined()
    expect(screen.getByText('60/m')).toBeDefined()
    expect(screen.getByText('Estado')).toBeDefined()
    expect(screen.getByText('Beta')).toBeDefined()
  })

  it('should render the CTA block with badge, title, description', () => {
    render(<SCAudit />)
    expect(screen.getByText('BETA PÚBLICA')).toBeDefined()
    expect(screen.getByText('Probá SCAudit')).toBeDefined()
    expect(screen.getByText('Monitoreá tu sitio')).toBeDefined()
  })

  it('should render primary CTA link', () => {
    render(<SCAudit />)
    const primaryLink = screen.getByText('Ir a SCAudit')
    expect(primaryLink).toBeDefined()
    expect(primaryLink.getAttribute('href')).toBe('https://scaudit.vercel.app')
    expect(primaryLink.getAttribute('target')).toBe('_blank')
  })

  it('should render secondary CTA pointing at the public roadmap', () => {
    render(<SCAudit />)
    const secondaryLink = screen.getByText('Más info')
    expect(secondaryLink).toBeDefined()
    expect(secondaryLink.getAttribute('href')).toBe('https://scaudit.vercel.app/disclaimer')
    expect(secondaryLink.getAttribute('target')).toBe('_blank')
    expect(secondaryLink.getAttribute('rel')).toContain('noopener')
  })

  it('should render FadeIn wrappers', () => {
    render(<SCAudit />)
    const fadeElements = screen.getAllByTestId('fade-in')
    expect(fadeElements.length).toBeGreaterThanOrEqual(4)
  })

  it('should render decorative gradient orb with aria-hidden', () => {
    render(<SCAudit />)
    const decorativeElements = document.querySelectorAll('[aria-hidden="true"]')
    expect(decorativeElements.length).toBeGreaterThanOrEqual(3)
  })
})
