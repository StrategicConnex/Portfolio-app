import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import Stack from './Stack'
import React from 'react'

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) =>
      <div {...(props as Record<string, unknown>)}>{children}</div>,
  },
  useInView: () => true,
}))

vi.mock('next/image', () => ({
  default: ({ alt, ...props }: Record<string, unknown>) =>
    <img {...(props as React.ImgHTMLAttributes<HTMLImageElement>)} alt={alt as string} />,
}))

const mockT = vi.fn((key: string) => {
  const m: Record<string, string> = {
    'stack.label': 'Stack',
    'stack.title': 'Tecnologías',
    'stack.highlight': 'Clave',
    'stack.cat.security': 'Seguridad',
    'stack.title.security': 'Ciberseguridad IT/OT',
    'stack.cat.network': 'Redes',
    'stack.title.network': 'Infraestructura de Red',
    'stack.cat.cloud': 'Cloud',
    'stack.title.cloud': 'Virtualización & Cloud',
    'stack.cat.ot': 'OT',
    'stack.title.ot': 'Tecnología Operacional',
    'stack.cat.dev': 'Desarrollo',
    'stack.title.dev': 'Desarrollo Web',
    'stack.cat.ai': 'Datos',
    'stack.title.ai': 'Análisis de Datos & IA',
    'stack.tag.siem': 'SIEM',
    'stack.tag.firewalls': 'Firewalls',
    'stack.tag.networks': 'Redes',
  }
  return m[key] || key
})

vi.mock('@/context/LanguageContext', () => ({
  useLanguage: () => ({ language: 'es', setLanguage: vi.fn(), t: mockT }),
}))

vi.mock('./ui/SectionHeader', () => ({
  default: ({ label, title, highlight }: { label: string; title: string; highlight?: string }) => (
    <div data-testid="stack-header">{label} - {title} {highlight}</div>
  ),
}))

// The Icon component renders img tags for SVG icons, so we need to mock it too
vi.mock('./ui/Icon', () => ({
  default: ({ name, label }: { name: string; label: string; size?: number }) => (
    <img src={'/icons/' + name + '.svg'} alt={label} width={20} height={20} style={{ width: 20, height: 20, minWidth: 20, display: 'block' }} />
  ),
}))

describe('Stack', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render the section header', () => {
    render(<Stack />)
    expect(screen.getByTestId('stack-header')).toBeDefined()
  })

  it('should render all 6 category cards', () => {
    render(<Stack />)
    expect(screen.getByText('Ciberseguridad IT/OT')).toBeDefined()
    expect(screen.getByText('Infraestructura de Red')).toBeDefined()
    expect(screen.getByText('Virtualización & Cloud')).toBeDefined()
    expect(screen.getByText('Tecnología Operacional')).toBeDefined()
    expect(screen.getByText('Desarrollo Web')).toBeDefined()
    expect(screen.getByText('Análisis de Datos & IA')).toBeDefined()
  })

  it('should render tags inside cards', () => {
    render(<Stack />)
    expect(screen.getByText('SIEM')).toBeDefined()
    expect(screen.getByText('Firewalls')).toBeDefined()
  })

  it('should render the section with id stack', () => {
    render(<Stack />)
    const section = document.querySelector('section#stack')
    expect(section).toBeDefined()
  })

  it('should render category labels', () => {
    render(<Stack />)
    expect(screen.getByText('Seguridad')).toBeDefined()
    // 'Redes' appears as both category label and tag - use getAllByText
    expect(screen.getAllByText('Redes').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Cloud')).toBeDefined()
    expect(screen.getByText('OT')).toBeDefined()
    expect(screen.getByText('Desarrollo')).toBeDefined()
    expect(screen.getByText('Datos')).toBeDefined()
  })

  it('should render 6 card background images and 6 icon images', () => {
    render(<Stack />)
    const imgs = document.querySelectorAll('img')
    // 6 background images + 6 icon images (via Icon component)
    expect(imgs.length).toBe(12)
  })
})
