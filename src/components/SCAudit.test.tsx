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
    'scaudit.feat.rum.name': 'RUM',
    'scaudit.feat.rum.desc': 'Real User Monitoring',
    'scaudit.feat.vitals.name': 'Web Vitals',
    'scaudit.feat.vitals.desc': 'Core Web Vitals',
    'scaudit.feat.audit.name': 'Auditoría',
    'scaudit.feat.audit.desc': 'Auditoría continua',
    'scaudit.feat.seo.name': 'SEO',
    'scaudit.feat.seo.desc': 'SEO Técnico',
    'scaudit.feat.errors.name': 'Errores',
    'scaudit.feat.errors.desc': 'Rateo de errores',
    'scaudit.feat.ai.name': 'AI Insights',
    'scaudit.feat.ai.desc': 'Recomendaciones IA',
    'scaudit.feat.score.name': 'Score',
    'scaudit.feat.score.desc': 'Puntuación global',
    'scaudit.feat.reports.name': 'Reportes',
    'scaudit.feat.reports.desc': 'Reportes exportables',
    'scaudit.metrics.title': 'MÉTRICAS',
    'scaudit.metrics.source': 'Lighthouse + CrUX',
    'scaudit.cta.badge': 'BETA',
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

vi.mock('./ui/SectionHeader', () => ({
  default: ({ label, title, highlight, center }: { label: string; title: string; highlight?: string; center?: boolean }) => (
    <div data-testid="section-header" data-center={String(center)}>{label} - {title} {highlight}</div>
  ),
}))

vi.mock('./ui/FadeIn', () => ({
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

  it('should render SOC 2, Lighthouse v12, and GSC API badges', () => {
    render(<SCAudit />)
    expect(screen.getByText('SOC 2')).toBeDefined()
    expect(screen.getByText('Lighthouse v12')).toBeDefined()
    expect(screen.getByText('GSC API')).toBeDefined()
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
    expect(screen.getByText('RUM')).toBeDefined()
    expect(screen.getByText('Real User Monitoring')).toBeDefined()
    expect(screen.getByText('Web Vitals')).toBeDefined()
    expect(screen.getByText('Core Web Vitals')).toBeDefined()
    expect(screen.getByText('Auditoría')).toBeDefined()
    expect(screen.getByText('SEO')).toBeDefined()
    expect(screen.getByText('SEO Técnico')).toBeDefined()
    expect(screen.getByText('Errores')).toBeDefined()
    expect(screen.getByText('AI Insights')).toBeDefined()
    expect(screen.getByText('Score')).toBeDefined()
    expect(screen.getByText('Reportes')).toBeDefined()
  })

  it('should render metrics section title', () => {
    render(<SCAudit />)
    expect(screen.getByText('MÉTRICAS')).toBeDefined()
  })

  it('should render all 6 metric pills with values', () => {
    render(<SCAudit />)
    expect(screen.getByText('LCP')).toBeDefined()
    expect(screen.getByText('1.8s')).toBeDefined()
    expect(screen.getByText('CLS')).toBeDefined()
    expect(screen.getByText('0.03')).toBeDefined()
    expect(screen.getByText('INP')).toBeDefined()
    expect(screen.getByText('210ms')).toBeDefined()
    expect(screen.getByText('Lighthouse')).toBeDefined()
    expect(screen.getByText('91.4')).toBeDefined()
    expect(screen.getByText('SEO Health')).toBeDefined()
    expect(screen.getByText('88%')).toBeDefined()
    expect(screen.getByText('Error Rate')).toBeDefined()
    expect(screen.getByText('0.2%')).toBeDefined()
  })

  it('should render the CTA block with badge, title, description', () => {
    render(<SCAudit />)
    expect(screen.getByText('BETA')).toBeDefined()
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

  it('should render secondary CTA link', () => {
    render(<SCAudit />)
    const secondaryLink = screen.getByText('Más info')
    expect(secondaryLink).toBeDefined()
    expect(secondaryLink.getAttribute('href')).toBe('#scaudit')
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
