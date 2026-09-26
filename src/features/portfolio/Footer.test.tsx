import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import Footer from './Footer'

const mockT = vi.fn((key: string) => {
  const m: Record<string, string> = {
    'footer.built_with': 'Construido con Next.js y TypeScript',
  }
  return m[key] || key
})

vi.mock('@/context/LanguageContext', () => ({
  useLanguage: () => ({ language: 'es', setLanguage: vi.fn(), t: mockT }),
}))

describe('Footer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render the author name', () => {
    render(<Footer />)
    expect(screen.getByText('Juan Felipe Palacios')).toBeDefined()
  })

  it('should render IT/OT Cybersecurity Architect text', () => {
    render(<Footer />)
    expect(screen.getByText(/IT\/OT Cybersecurity Architect/)).toBeDefined()
  })

  it('should render Neuquén, Argentina', () => {
    render(<Footer />)
    expect(screen.getByText(/Neuquén, Argentina/)).toBeDefined()
  })

  it('should render the built with message', () => {
    render(<Footer />)
    expect(screen.getByText('Construido con Next.js y TypeScript')).toBeDefined()
  })

  it('should render LinkedIn link', () => {
    render(<Footer />)
    const link = screen.getByText('LinkedIn')
    expect(link).toBeDefined()
    expect(link.getAttribute('href')).toBe('https://linkedin.com/in/juanfpalacios')
    expect(link.getAttribute('target')).toBe('_blank')
  })

  it('should render GitHub link', () => {
    render(<Footer />)
    const link = screen.getByText('GitHub')
    expect(link).toBeDefined()
    expect(link.getAttribute('href')).toBe('https://github.com/StrategicConnex/')
    expect(link.getAttribute('target')).toBe('_blank')
  })

  it('should render Credly link', () => {
    render(<Footer />)
    const link = screen.getByText('Credly')
    expect(link).toBeDefined()
    expect(link.getAttribute('href')).toContain('credly.com')
    expect(link.getAttribute('target')).toBe('_blank')
  })

  it('should render the current year', () => {
    render(<Footer />)
    const year = new Date().getFullYear().toString()
    expect(screen.getByText(new RegExp(year))).toBeDefined()
  })
})
