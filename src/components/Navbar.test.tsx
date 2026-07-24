import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import Navbar from './Navbar'

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    nav: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) =>
      <nav {...(props as Record<string, unknown>)} data-mock="motion-nav">{children}</nav>,
    a: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) =>
      <a {...(props as Record<string, unknown>)}>{children}</a>,
    button: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) =>
      <button {...(props as Record<string, unknown>)}>{children}</button>,
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) =>
      <div {...(props as Record<string, unknown>)}>{children}</div>,
    span: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) =>
      <span {...(props as Record<string, unknown>)}>{children}</span>,
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}))

const mockSetLanguage = vi.fn()
const mockT = vi.fn((key: string) => {
  const translations: Record<string, string> = {
    'nav.profile': 'Perfil',
    'nav.architecture': 'Arquitectura',
    'nav.experience': 'Experiencia',
    'nav.siem': 'SIEM',
    'nav.audit': 'Auditoria',
    'nav.blog': 'Inteligencia',
    'nav.stack': 'Stack',
    'nav.projects': 'Casos de Exito',
    'nav.contact': 'Contacto',
  }
  return translations[key] || key
})

vi.mock('@/context/LanguageContext', () => ({
  useLanguage: () => ({
    language: 'es',
    setLanguage: mockSetLanguage,
    t: mockT,
  }),
}))

const mockObserve = vi.fn()
const mockDisconnect = vi.fn()

class MockIntersectionObserver {
  readonly root: Element | Document | null = null
  readonly rootMargin: string = ''
  readonly thresholds: ReadonlyArray<number> = []
  constructor(_callback: IntersectionObserverCallback, _options?: IntersectionObserverInit) {
    // Simulate intersection for all observed elements
    // This ensures the IntersectionObserver triggers active state
    void _callback;
    void _options;
  }
  observe = mockObserve
  disconnect = mockDisconnect
  unobserve = vi.fn()
  takeRecords = (): IntersectionObserverEntry[] => []
}

beforeEach(() => {
  vi.clearAllMocks()
  Object.defineProperty(window, 'scrollY', { value: 0, writable: true, configurable: true })
  Object.defineProperty(document.documentElement, 'scrollHeight', { value: 2000, writable: true, configurable: true })
  Object.defineProperty(window, 'innerHeight', { value: 1000, writable: true, configurable: true })
  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function renderNavbar() {
  const sectionIds = ['perfil', 'arquitectura', 'experiencia', 'siem', 'audit-hub', 'blog', 'stack', 'proyecto', 'contacto']
  const container = document.createElement('div')
  sectionIds.forEach(id => {
    const section = document.createElement('section')
    section.id = id
    container.appendChild(section)
  })
  document.body.appendChild(container)
  const view = render(<Navbar />)
  return { ...view, container }
}

describe('Navbar', () => {
  it('should render the logo', () => {
    renderNavbar()
    expect(screen.getByText('JFP')).toBeDefined()
  })

  it('should render all navigation links with translated labels', () => {
    renderNavbar()
    const expectedLabels = ['Perfil', 'Arquitectura', 'Experiencia', 'SIEM', 'Auditoria', 'Inteligencia', 'Stack', 'Casos de Exito', 'Contacto']
    for (const label of expectedLabels) {
      expect(screen.getByText(label)).toBeDefined()
    }
  })

  it('should show language switcher with default language text', () => {
    renderNavbar()
    // The language value is 'es' (lowercase) rendered inside a span with uppercase CSS class
    // Use getByText with exact match for the rendered text content
    const languageSpan = screen.getByText('es')
    expect(languageSpan).toBeDefined()
    expect(languageSpan.className).toContain('uppercase')
  })

  it('should toggle language when language button is clicked', () => {
    renderNavbar()
    // The button contains both the icon and the span with 'es'
    const languageSpan = screen.getByText('es')
    const button = languageSpan.closest('button')
    expect(button).not.toBeNull()
    fireEvent.click(button!)
    expect(mockSetLanguage).toHaveBeenCalledWith('en')
  })

  it('should render the mobile menu toggle button', () => {
    renderNavbar()
    expect(screen.getByLabelText('Toggle menu')).toBeDefined()
  })

  it('should call IntersectionObserver for section highlighting', () => {
    renderNavbar()
    expect(mockObserve).toHaveBeenCalled()
  })

  it('should render the scroll progress bar', () => {
    renderNavbar()
    const navs = document.querySelectorAll('[data-mock="motion-nav"]')
    expect(navs.length).toBe(1)
  })

  it('should render language selection inside mobile drawer on toggle', () => {
    renderNavbar()
    const menuBtn = screen.getByLabelText('Toggle menu')
    // Open the mobile menu
    act(() => {
      fireEvent.click(menuBtn)
    })
    expect(screen.getByText('ESPAÑOL')).toBeDefined()
    expect(screen.getByText('ENGLISH')).toBeDefined()
  })

  it('should navigate to different sections via links', () => {
    renderNavbar()
    const profileLink = screen.getByText('Perfil')
    expect(profileLink.getAttribute('href')).toBe('#perfil')
    const contactLink = screen.getByText('Contacto')
    expect(contactLink.getAttribute('href')).toBe('#contacto')
  })
})
