import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import Certificaciones from './Certificaciones'

vi.mock('framer-motion', () => {
  const MockMotionDiv = ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
    const skip = ['initial', 'animate', 'transition', 'exit', 'whileInView', 'viewport', 'variants', 'layout', 'layoutId']
    const rest: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(props)) {
      if (!skip.includes(k)) rest[k] = v
    }
    return <div {...(rest as Record<string, unknown>)}>{children}</div>
  }

  const MockMotionHeading = ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
    const skip = ['initial', 'animate', 'transition', 'layout', 'layoutId']
    const rest: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(props)) {
      if (!skip.includes(k)) rest[k] = v
    }
    return <h3 {...(rest as Record<string, unknown>)}>{children}</h3>
  }
  
  const MockMotionButton = ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
    const skip = ['whileHover', 'whileTap', 'initial', 'animate', 'transition', 'layout', 'layoutId']
    const rest: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(props)) {
      if (!skip.includes(k)) rest[k] = v
    }
    return <button {...(rest as Record<string, unknown>)}>{children}</button>
  }

  const MockMotionSpan = ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
    const skip = ['layoutId', 'transition', 'initial', 'animate']
    const rest: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(props)) {
      if (!skip.includes(k)) rest[k] = v
    }
    return <span {...(rest as Record<string, unknown>)}>{children}</span>
  }

  return {
    motion: {
      div: MockMotionDiv,
      button: MockMotionButton,
      h3: MockMotionHeading,
      span: MockMotionSpan,
    },
    AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
    useInView: () => true,
  }
})

const mockT = vi.fn((key: string) => {
  const m: Record<string, string> = {
    'certs.label': 'Certificaciones',
    'certs.title': 'Formación',
    'certs.highlight': 'Continua',
    'certs.analyst': 'Analista de Ciberseguridad',
    'certs.pm': 'Project Management Professional',
    'certs.english': 'Inglés Técnico Avanzado',
    'certs.cat.all': 'Todos',
    'certs.cat.cybersecurity': 'Ciberseguridad',
    'certs.cat.data_ai': 'Datos & IA',
    'certs.cat.cloud_dev': 'Cloud & Dev',
    'certs.cat.soft_skills': 'Soft Skills',
    'certs.cat.other': 'Otros',
  }
  return m[key] || key
})

vi.mock('@/context/LanguageContext', () => ({
  useLanguage: () => ({ language: 'es', setLanguage: vi.fn(), t: mockT }),
}))

vi.mock('./ui/SectionHeader', () => ({
  default: ({ label, title, highlight }: { label: string; title: string; highlight?: string }) => (
    <div data-testid="certs-header">{label} - {title} {highlight}</div>
  ),
}))

vi.mock('./ui/Icon', () => ({
  default: ({ name, label, size }: { name: string; label: string; size?: number }) => (
    <span data-testid={'certs-icon-' + name} aria-label={label} data-size={size}>[{name}]</span>
  ),
}))

describe('Certificaciones', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    document.body.style.overflow = ''
  })

  it('should render the section header', () => {
    render(<Certificaciones />)
    expect(screen.getByTestId('certs-header')).toBeDefined()
    expect(screen.getByText(/Certificaciones/)).toBeDefined()
    expect(screen.getByText(/Formación/)).toBeDefined()
    expect(screen.getByText(/Continua/)).toBeDefined()
  })

  it('should render all 8 featured certifications', () => {
    render(<Certificaciones />)
    expect(screen.getByText('Analista de Ciberseguridad')).toBeDefined()
    expect(screen.getByText('Project Management Professional')).toBeDefined()
    expect(screen.getByText('VMware Certified Associate – VCA-DCV')).toBeDefined()
    expect(screen.getByText('Cisco CCNA Routing & Switching')).toBeDefined()
    expect(screen.getByText('Cisco CyberSecurity')).toBeDefined()
    expect(screen.getByText('Microsoft MCSE')).toBeDefined()
    expect(screen.getByText('SOX · NIST · ISO 27001 · IEC 62443')).toBeDefined()
    expect(screen.getByText('Inglés Técnico Avanzado')).toBeDefined()
  })

  it('should render all 6 category filter tabs', () => {
    render(<Certificaciones />)
    expect(screen.getByText('Todos')).toBeDefined()
    expect(screen.getByText('Ciberseguridad')).toBeDefined()
    expect(screen.getByText('Datos & IA')).toBeDefined()
    expect(screen.getByText('Cloud & Dev')).toBeDefined()
    expect(screen.getByText('Soft Skills')).toBeDefined()
    expect(screen.getByText('Otros')).toBeDefined()
  })

  it('should show total course count', () => {
    render(<Certificaciones />)
    const countElements = screen.getAllByText('46')
    expect(countElements.length).toBeGreaterThanOrEqual(1)
  })

  it('should not show modal by default', () => {
    render(<Certificaciones />)
    expect(screen.queryByText('Modo lectura protegido')).toBeNull()
  })

  it('should open modal when a course file is clicked', () => {
    render(<Certificaciones />)
    const btn = screen.getByText('Arquitectura de Seguridad CompTIA Security SY0701')
    act(() => { fireEvent.click(btn) })
    expect(screen.getByText(/Modo lectura protegido/)).toBeDefined()
    // Course name appears both in card and modal header
    expect(screen.getAllByText(/Arquitectura de Seguridad/).length).toBeGreaterThanOrEqual(1)
  })

  it('should close modal on Escape key', () => {
    render(<Certificaciones />)
    act(() => { fireEvent.click(screen.getByText('Arquitectura de Seguridad CompTIA Security SY0701')) })
    expect(screen.getByText(/Modo lectura protegido/)).toBeDefined()
    act(() => { fireEvent.keyDown(document, { key: 'Escape' }) })
    expect(screen.queryByText(/Modo lectura protegido/)).toBeNull()
  })

  it('should close modal on close button click', () => {
    render(<Certificaciones />)
    act(() => { fireEvent.click(screen.getByText('Arquitectura de Seguridad CompTIA Security SY0701')) })
    const closeBtn = screen.getByLabelText('Cerrar visor')
    expect(closeBtn).toBeDefined()
    act(() => { fireEvent.click(closeBtn) })
    expect(screen.queryByText('Modo lectura protegido')).toBeNull()
  })

  it('should display PDF badge for pdf files', () => {
    render(<Certificaciones />)
    const pdfTexts = screen.getAllByText('PDF')
    expect(pdfTexts.length).toBeGreaterThan(0)
  })

  it('should display IMG badge for image files', () => {
    render(<Certificaciones />)
    const imgTexts = screen.getAllByText('IMG')
    expect(imgTexts.length).toBeGreaterThan(0)
  })

  it('should show the courses title and icon', () => {
    render(<Certificaciones />)
    expect(screen.getByText('Cursos y Certificados')).toBeDefined()
  })
})
