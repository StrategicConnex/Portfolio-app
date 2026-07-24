import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import Hero from './Hero'

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) =>
      <div {...(props as Record<string, unknown>)}>{children}</div>,
    h1: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) =>
      <h1 {...(props as Record<string, unknown>)}>{children}</h1>,
    p: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) =>
      <p {...(props as Record<string, unknown>)}>{children}</p>,
    span: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) =>
      <span {...(props as Record<string, unknown>)}>{children}</span>,
    a: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) =>
      <a {...(props as Record<string, unknown>)}>{children}</a>,
  },
}))

vi.mock('next/image', () => ({
  default: ({ alt, ...props }: Record<string, unknown>) =>
    <img {...(props as React.ImgHTMLAttributes<HTMLImageElement>)} alt={alt as string} />,
}))

vi.mock('next/dynamic', () => ({
  default: () => {
    return function MockDynamic() {
      return <div data-testid="dynamic-component" aria-hidden="true" />
    }
  },
}))

const mockT = vi.fn((key: string) => {
  const m: Record<string, string> = {
    'hero.system_active': 'SISTEMA ACTIVO',
    'hero.protocol': 'PROTOCOLO DE SEGURIDAD',
    'hero.title.first': 'Juan Felipe',
    'hero.title.last': 'Palacios',
    'hero.subtitle': 'Arquitecto IT/OT | Ciberseguridad Industrial',
    'hero.role': 'Especialista en Ciberseguridad OT',
    'hero.role_details': 'Protegiendo infraestructuras críticas',
    'hero.tagline': 'Seguridad y resiliencia para la industria',
    'hero.cta.history': 'TRAYECTORIA',
    'hero.cta.architecture': 'ARQUITECTURA',
    'hero.scroll': 'SCROLL',
  }
  return m[key] || key
})

vi.mock('@/context/LanguageContext', () => ({
  useLanguage: () => ({ language: 'es', setLanguage: vi.fn(), t: mockT }),
}))

describe('Hero', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render the section with id home', () => {
    render(<Hero />)
    const section = document.querySelector('section#home')
    expect(section).toBeDefined()
  })

  it('should render protocol badge', () => {
    render(<Hero />)
    expect(screen.getByText('PROTOCOLO DE SEGURIDAD')).toBeDefined()
  })

  it('should render the title', () => {
    render(<Hero />)
    expect(screen.getByText('Juan Felipe')).toBeDefined()
    expect(screen.getByText('Palacios')).toBeDefined()
  })

  it('should render the subtitle', () => {
    render(<Hero />)
    expect(screen.getByText(/Arquitecto IT\/OT/)).toBeDefined()
    expect(screen.getByText(/Ciberseguridad Industrial/)).toBeDefined()
  })

  it('should render the role', () => {
    render(<Hero />)
    expect(screen.getByText('Especialista en Ciberseguridad OT')).toBeDefined()
  })

  it('should render the role details', () => {
    render(<Hero />)
    expect(screen.getByText(/Protegiendo infraestructuras críticas/)).toBeDefined()
  })

  it('should render the tagline', () => {
    render(<Hero />)
    expect(screen.getByText('Seguridad y resiliencia para la industria')).toBeDefined()
  })

  it('should render CTA buttons with correct hrefs', () => {
    render(<Hero />)
    const trayectoriaBtn = screen.getByText('TRAYECTORIA')
    expect(trayectoriaBtn.getAttribute('href')).toBe('#experiencia')
    
    const arquitecturaBtn = screen.getByText('ARQUITECTURA')
    expect(arquitecturaBtn.getAttribute('href')).toBe('#arquitectura')
  })

  it('should render scroll indicator', () => {
    render(<Hero />)
    expect(screen.getByText('SCROLL')).toBeDefined()
  })

  it('should render the profile image with correct alt', () => {
    render(<Hero />)
    const img = screen.getByAltText('Foto de perfil de Juan Palacios')
    expect(img).toBeDefined()
    expect(img.getAttribute('src')).toBe('/JuanPalacios.jpg')
  })

  it('should render system active badge', () => {
    render(<Hero />)
    expect(screen.getByText('SISTEMA ACTIVO')).toBeDefined()
  })

  it('should render dynamic components (ParticleCanvas, RadarSweep)', () => {
    render(<Hero />)
    const dynamicComponents = screen.getAllByTestId('dynamic-component')
    expect(dynamicComponents.length).toBe(2)
  })

  it('should render decorative gradient orb', () => {
    render(<Hero />)
    const orbElements = document.querySelectorAll('[aria-hidden="true"]')
    expect(orbElements.length).toBeGreaterThanOrEqual(1)
  })
})
