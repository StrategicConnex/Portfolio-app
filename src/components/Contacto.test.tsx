import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import Contacto from './Contacto'

vi.mock('framer-motion', async () => {
  const { createMotionMock } = await import('@/test-utils/framer-motion')
  return { motion: createMotionMock(['a', 'div']) }
})

const mockT = vi.fn((key: string) => {
  const translations: Record<string, string> = {
    'contact.label': 'Conexion Segura',
    'contact.title': 'Contacto',
    'contact.highlight': 'Directo',
    'contact.description': 'Especializado en proyectos de alta criticidad en entornos industriales Oil & Gas.',
    'contact.availability': 'Disponible para proyectos de alta criticidad',
    'contact.download_cv': 'Descargar CV',
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

vi.mock('./ui/SectionHeader', () => ({
  default: ({ label, title, highlight, center }: { label: string; title: string; highlight?: string; center?: boolean }) => (
    <div data-testid="section-header" data-center={String(center)}>
      <span>{label}</span>
      <h2>{title} {highlight}</h2>
    </div>
  ),
}))

vi.mock('./ui/FadeIn', () => ({
  default: ({ children }: { children: React.ReactNode; delay?: number }) => (
    <div data-testid="fade-in">{children}</div>
  ),
}))

function renderContacto() {
  return render(<Contacto />)
}

describe('Contacto', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render the section header with center prop', () => {
    renderContacto()
    const header = screen.getByTestId('section-header')
    expect(header).toBeDefined()
    expect(header.getAttribute('data-center')).toBe('true')
    expect(screen.getByText('Conexion Segura')).toBeDefined()
    expect(screen.getByText('Contacto Directo')).toBeDefined()
  })

  it('should render the description text', () => {
    renderContacto()
    expect(screen.getByText(/Especializado en proyectos de alta criticidad/)).toBeDefined()
  })

  it('should render LinkedIn link', () => {
    renderContacto()
    const linkEl = screen.getByText('LinkedIn')
    expect(linkEl).toBeDefined()
    const anchor = linkEl.closest('a')
    expect(anchor?.getAttribute('href')).toBe('https://linkedin.com/in/juanfpalacios')
    expect(anchor?.getAttribute('target')).toBe('_blank')
    expect(anchor?.getAttribute('rel')).toBe('noopener noreferrer')
  })

  it('should render LinkedIn subtitle', () => {
    renderContacto()
    expect(screen.getByText('linkedin.com/in/juanfpalacios')).toBeDefined()
  })

  it('should render Download CV link with download attribute', () => {
    renderContacto()
    const linkEl = screen.getByText('Descargar CV')
    expect(linkEl).toBeDefined()
    const anchor = linkEl.closest('a')
    expect(anchor?.getAttribute('href')).toBe('/CV-JuanFelipePalacios.pdf')
    expect(anchor?.getAttribute('download')).toBe('')
  })

  it('should render Download CV subtitle', () => {
    renderContacto()
    expect(screen.getByText('CV-JuanFelipePalacios.pdf')).toBeDefined()
  })

  it('should render Credly Badges link', () => {
    renderContacto()
    const linkEl = screen.getByText('Credly Badges')
    expect(linkEl).toBeDefined()
    const anchor = linkEl.closest('a')
    expect(anchor?.getAttribute('href')).toContain('credly.com')
    expect(anchor?.getAttribute('target')).toBe('_blank')
  })

  it('should render Credly Badges subtitle', () => {
    renderContacto()
    expect(screen.getByText(/credly\.com\/users\/juan-palacios/)).toBeDefined()
  })

  it('should render the availability badge', () => {
    renderContacto()
    expect(screen.getByText('Disponible para proyectos de alta criticidad')).toBeDefined()
  })

  it('should have 3 action cards', () => {
    renderContacto()
    expect(screen.getByText('LinkedIn')).toBeDefined()
    expect(screen.getByText('Descargar CV')).toBeDefined()
    expect(screen.getByText('Credly Badges')).toBeDefined()
  })

  it('should render redirect arrow for external links', () => {
    renderContacto()
    const arrows = screen.getAllByText('\u2197')
    expect(arrows.length).toBeGreaterThan(0)
  })

  it('should render download arrow for CV link', () => {
    renderContacto()
    const downArrows = screen.getAllByText('\u2193')
    expect(downArrows.length).toBe(1)
  })
})
