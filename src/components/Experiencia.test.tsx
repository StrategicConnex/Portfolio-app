import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import Experiencia from './Experiencia'

vi.mock('framer-motion', async () => {
  const { createMotionMock } = await import('@/test-utils/framer-motion')
  return {
    motion: createMotionMock(['div', 'span']),
    AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
    useInView: () => true,
  }
})

const mockT = vi.fn((key: string) => {
  const m: Record<string, string> = {
    'experience.label': 'Trayectoria',
    'experience.title': 'Experiencia',
    'experience.highlight': 'Profesional',
    'experience.badge.years': '15+ Años IT/OT',
    'experience.badge.location': 'Neuquén, Argentina',
    'experience.badge.tech': 'Ciberseguridad Industrial',
  }
  return m[key] || key
})

vi.mock('@/context/LanguageContext', () => ({
  useLanguage: () => ({ language: 'es', setLanguage: vi.fn(), t: mockT }),
}))

vi.mock('./ui/SectionHeader', () => ({
  default: ({ label, title, highlight }: { label: string; title: string; highlight?: string }) => (
    <div data-testid="exp-header">{label} - {title} {highlight}</div>
  ),
}))

vi.mock('./ui/FadeIn', () => ({
  default: ({ children }: { children: React.ReactNode; delay?: number }) => <div data-testid="exp-fadein">{children}</div>,
}))

vi.mock('./ui/Icon', () => ({
  default: ({ name, label }: { name: string; label: string; size?: number }) => (
    <span data-testid={'exp-icon-' + name}>{label}</span>
  ),
}))

describe('Experiencia', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render the section header', () => {
    render(<Experiencia />)
    expect(screen.getByTestId('exp-header')).toBeDefined()
  })

  it('should render the experience badges', () => {
    render(<Experiencia />)
    // Badges have a "✦ " prefix in the rendered DOM
    expect(screen.getByText(/15\+ Años IT\/OT/)).toBeDefined()
    expect(screen.getByText(/Neuquén, Argentina/)).toBeDefined()
    expect(screen.getByText(/Ciberseguridad Industrial/)).toBeDefined()
  })

  it('should render company names from JOBS data', () => {
    render(<Experiencia />)
    // JOBS data contains: YPY Oilfield Services, Oilfield Production Services SRL, Exterran Argentina SRL
    expect(screen.getByText('YPY Oilfield Services')).toBeDefined()
    expect(screen.getByText('Oilfield Production Services SRL')).toBeDefined()
    expect(screen.getByText('Exterran Argentina SRL')).toBeDefined()
  })

  it('should render the section with id experiencia', () => {
    render(<Experiencia />)
    const section = document.querySelector('section#experiencia')
    expect(section).toBeDefined()
  })

  it('should render the timeline vertical line', () => {
    const { container } = render(<Experiencia />)
    const gradientLine = container.querySelector('.bg-gradient-to-b')
    expect(gradientLine).toBeDefined()
  })
})
