/* eslint-disable react/display-name -- mock components in tests don't need display names */

import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import React from 'react'

// ── Top-level mocks (Vitest hoists these, eliminating "not hoisted" warnings) ──

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const skip = ['initial', 'animate', 'transition', 'whileInView', 'viewport', 'variants', 'exit', 'layout', 'layoutId', 'whileHover', 'whileTap', 'custom']
      const rest: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(props)) { if (!skip.includes(k)) rest[k] = v }
      return <div {...(rest as Record<string, unknown>)}>{children}</div>
    },
    nav: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const skip = ['initial', 'animate', 'transition', 'whileHover', 'whileTap']
      const rest: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(props)) { if (!skip.includes(k)) rest[k] = v }
      return <nav {...(rest as Record<string, unknown>)}>{children}</nav>
    },
    a: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const skip = ['whileHover', 'whileTap', 'initial', 'animate', 'transition']
      const rest: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(props)) { if (!skip.includes(k)) rest[k] = v }
      return <a {...(rest as Record<string, unknown>)}>{children}</a>
    },
    button: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const skip = ['whileHover', 'whileTap', 'initial', 'animate', 'transition', 'layout', 'layoutId']
      const rest: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(props)) { if (!skip.includes(k)) rest[k] = v }
      return <button {...(rest as Record<string, unknown>)}>{children}</button>
    },
    li: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const skip = ['initial', 'animate', 'transition', 'whileInView', 'viewport', 'variants', 'layout', 'layoutId']
      const rest: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(props)) { if (!skip.includes(k)) rest[k] = v }
      return <li {...(rest as Record<string, unknown>)}>{children}</li>
    },
    h3: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const skip = ['initial', 'animate', 'transition', 'layout', 'layoutId']
      const rest: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(props)) { if (!skip.includes(k)) rest[k] = v }
      return <h3 {...(rest as Record<string, unknown>)}>{children}</h3>
    },
    span: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const skip = ['layoutId', 'transition', 'initial', 'animate']
      const rest: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(props)) { if (!skip.includes(k)) rest[k] = v }
      return <span {...rest}>{children}</span>
    },
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
  useInView: () => true,
}))

vi.mock('next/image', () => ({
  default: ({ alt, ...props }: Record<string, unknown>) =>
    <img {...(props as React.ImgHTMLAttributes<HTMLImageElement>)} alt={alt as string} />,
}))

// ── Shared mutable state for per-test configurations ──
// These let us vary mock return values per test without vi.mock() inside functions.

let mockLanguageT: (k: string) => string = (k) => k

vi.mock('@/context/LanguageContext', () => ({
  useLanguage: () => ({ language: 'es', setLanguage: vi.fn(), t: (k: string) => mockLanguageT(k) }),
}))

// Default mock implementations for other commonly-mocked components
let MockSectionHeader: React.ComponentType<{ label?: string; title?: string; highlight?: string; center?: boolean }>
let MockFadeIn: React.ComponentType<{ children?: React.ReactNode; delay?: number }>
let MockIcon: React.ComponentType<{ name?: string; label?: string; size?: number }>
let MockCaseStudyDetail: React.ComponentType<{ onClose?: () => void }>

function resetMocks() {
  MockSectionHeader = ({ label, title, highlight }: { label?: string; title?: string; highlight?: string }) =>
    <div data-testid="mock-section-header">{label} - {title} {highlight}</div>
  MockFadeIn = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>
  MockIcon = ({ name, label }: { name?: string; label?: string }) => <span aria-label={label}>[{name}]</span>
  MockCaseStudyDetail = ({ onClose }: { onClose?: () => void }) => <div data-testid="case-study-detail"><button onClick={onClose}>Cerrar</button></div>
}

resetMocks()

vi.mock('./ui/SectionHeader', () => ({
  default: (props: Record<string, unknown>) => <MockSectionHeader {...props} />,
}))

vi.mock('./ui/FadeIn', () => ({
  default: (props: Record<string, unknown>) => <MockFadeIn {...props} />,
}))

vi.mock('./ui/Icon', () => ({
  default: (props: Record<string, unknown>) => <MockIcon {...props} />,
}))

vi.mock('./CaseStudyDetail', () => ({
  default: (props: Record<string, unknown>) => <MockCaseStudyDetail {...props} />,
}))

// ── axe-core setup ──

let axe: {
  run(container: HTMLElement, options?: Record<string, unknown>): Promise<{ violations: readonly unknown[] }>
}
beforeAll(async () => {
  const mod = await import('axe-core')
  axe = mod.default as typeof axe
})

async function checkAccessibility(container: HTMLElement) {
  const violations = await axe.run(container, {
    rules: {
      'color-contrast': { enabled: false },
      'duplicate-id': { enabled: false },
      'duplicate-id-active': { enabled: false },
    },
  })
  return violations.violations
}

// ── Tests ──

describe('Accessibilidad - axe-core', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetMocks()
    mockLanguageT = (k) => k
  })

  it('Footer sin violaciones de accesibilidad', async () => {
    mockLanguageT = () => 'Built'
    const { default: Footer } = await import('./Footer')
    const { container } = render(<Footer />)
    const violations = await checkAccessibility(container)
    expect(violations).toHaveLength(0)
  })

  it('Experiencia sin violaciones de accesibilidad', async () => {
    mockLanguageT = (k: string) => k
    const { default: Experiencia } = await import('./Experiencia')
    const { container } = render(<Experiencia />)
    const violations = await checkAccessibility(container)
    expect(violations).toHaveLength(0)
  })

  it('Blog sin violaciones de accesibilidad', async () => {
    mockLanguageT = (k: string) => {
      const m: Record<string, string> = {
        'blog.label': 'Blog', 'blog.title': 'Blog', 'blog.highlight': 'Blog',
        'blog.description': 'Blog desc', 'blog.view_all': 'View all', 'blog.read_more': 'Read',
      }
      return m[k] || k
    }
    const { default: Blog } = await import('./Blog')
    const { container } = render(<Blog />)
    const violations = await checkAccessibility(container)
    expect(violations).toHaveLength(0)
  })
})

describe('Accesibilidad - Navbar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetMocks()
    mockLanguageT = () => 'Link'
  })

  it('Navbar sin violaciones en estado normal', async () => {
    class MockIO {
      observe = vi.fn()
      disconnect = vi.fn()
      unobserve = vi.fn()
      takeRecords = () => []
    }
    vi.stubGlobal('IntersectionObserver', MockIO)

    const { default: Navbar } = await import('./Navbar')
    const { container } = render(<Navbar />)
    const violations = await checkAccessibility(container)
    expect(violations).toHaveLength(0)

    vi.unstubAllGlobals()
  })

  it('Navbar sin violaciones con menú móvil abierto', async () => {
    class MockIO {
      observe = vi.fn()
      disconnect = vi.fn()
      unobserve = vi.fn()
      takeRecords = () => []
    }
    vi.stubGlobal('IntersectionObserver', MockIO)

    const { default: Navbar } = await import('./Navbar')
    const { container } = render(<Navbar />)

    // Open mobile menu via hamburger button
    const menuBtn = screen.getByLabelText('Toggle menu')
    act(() => { fireEvent.click(menuBtn) })

    const violations = await checkAccessibility(container)
    expect(violations).toHaveLength(0)

    vi.unstubAllGlobals()
  })
})

describe('Accesibilidad - Certificaciones', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetMocks()
    mockLanguageT = (k: string) => {
      const m: Record<string, string> = {
        'certs.label': 'Certificaciones', 'certs.title': 'Formación', 'certs.highlight': 'Continua',
        'certs.analyst': 'Analista', 'certs.pm': 'PMP', 'certs.english': 'Inglés',
        'certs.cat.all': 'Todos', 'certs.cat.cybersecurity': 'Ciberseguridad',
        'certs.cat.data_ai': 'Datos & IA', 'certs.cat.cloud_dev': 'Cloud & Dev',
        'certs.cat.soft_skills': 'Soft Skills', 'certs.cat.other': 'Otros',
      }
      return m[k] || k
    }
  })

  it('Certificaciones sin violaciones en estado normal', async () => {
    const { default: Certificaciones } = await import('./Certificaciones')
    const { container } = render(<Certificaciones />)
    const violations = await checkAccessibility(container)
    expect(violations).toHaveLength(0)
  })

  it('Certificaciones sin violaciones con modal abierto', async () => {
    const { default: Certificaciones } = await import('./Certificaciones')
    const { container } = render(<Certificaciones />)

    // Open modal by clicking an image-based course (not PDF, to avoid axe-core iframe issues)
    const courseBtn = screen.getByRole('button', { name: /Ver .*PMP/ })
    act(() => { fireEvent.click(courseBtn) })

    const violations = await checkAccessibility(container)
    expect(violations).toHaveLength(0)
  })
})

describe('Accesibilidad - Proyecto', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetMocks()
    mockLanguageT = (k: string) => {
      const m: Record<string, string> = {
        'projects.label': 'Proyectos', 'projects.title': 'Casos de Éxito', 'projects.highlight': 'Reales',
        'projects.after': 'Después', 'projects.before': 'Antes',
        'projects.nda': 'NDA', 'projects.iot': 'IoT/OT',
        'projects.view_project': 'Ver proyecto',
        'projects.case3.title': 'Resiliencia Operacional',
        'projects.case3.company': 'StrategicConnex',
        'projects.case3.desc': 'Descripción del caso de resiliencia',
        'projects.case3.metric.1': 'MTTR', 'projects.case3.metric.2': 'Disponibilidad',
        'projects.case3.after.1': 'Redundancia implementada',
        'projects.case3.after.2': 'Monitoreo 24/7',
        'projects.case3.before.1': 'Sin redundancia',
      }
      return m[k] || k
    }
  })

  it('Proyecto sin violaciones en estado normal', async () => {
    const { default: Proyecto } = await import('./Proyecto')
    const { container } = render(<Proyecto />)
    const violations = await checkAccessibility(container)
    expect(violations).toHaveLength(0)
  })
})

describe('Accesibilidad - Contacto', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetMocks()
    mockLanguageT = (k: string) => {
      const m: Record<string, string> = {
        'contact.label': 'Conexión', 'contact.title': 'Contacto', 'contact.highlight': 'Directo',
        'contact.description': 'Descripción de contacto',
        'contact.availability': 'Disponible para proyectos',
      }
      return m[k] || k
    }
    // Contacto needs FadeIn with center prop on SectionHeader
    MockSectionHeader = ({ label, title, highlight, center }: { label?: string; title?: string; highlight?: string; center?: boolean }) =>
      <div data-center={String(center)}>{label} - {title} {highlight}</div>
  })

  it('Contacto sin violaciones de accesibilidad', async () => {
    const { default: Contacto } = await import('./Contacto')
    const { container } = render(<Contacto />)
    const violations = await checkAccessibility(container)
    expect(violations).toHaveLength(0)
  })
})
