import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import Recursos from './Recursos'

vi.mock('framer-motion', async () => {
  const { createMotionMock } = await import('@/test-utils/framer-motion')
  return {
    motion: createMotionMock(['a', 'div', 'p', 'span']),
    AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
    useInView: () => true,
  }
})

const mockT = vi.fn((key: string) => {
  const m: Record<string, string> = {
    'recursos.label': 'Recursos',
    'recursos.title': 'Biblioteca',
    'recursos.highlight': 'IT/OT',
    'recursos.intro': 'Guías, plantillas y estándares listos para usar.',
    'recursos.cat.all': 'Todos',
    'recursos.cat.vol1': 'Vol. I · IT',
    'recursos.cat.vol2': 'Vol. II · OT',
    'recursos.cat.vol3': 'Vol. III · Integración',
    'recursos.cat.vol4': 'Vol. IV · Ciberseguridad',
    'recursos.cat.vol5': 'Vol. V · Tendencias',
    'recursos.cat.standards': 'Estándares',
    'recursos.cat.project': 'Proyecto',
    'recursos.filter_label': 'Filtrar recursos por categoría',
    'recursos.panel_label': 'Recursos de categoría',
    'recursos.gallery_title': 'Archivos descargables',
    'recursos.download': 'Descargar',
    'recursos.empty': 'No hay recursos en esta categoría.',
  }
  return m[key] || key
})

vi.mock('@/context/LanguageContext', () => ({
  useLanguage: () => ({ language: 'es', setLanguage: vi.fn(), t: mockT }),
}))

vi.mock('./ui/SectionHeader', () => ({
  default: ({ label, title, highlight }: { label: string; title: string; highlight?: string }) => (
    <div data-testid="recursos-header">{label} - {title} {highlight}</div>
  ),
}))

vi.mock('./ui/Icon', () => ({
  default: ({ name, label }: { name: string; label: string; size?: number }) => (
    <span data-testid={'recursos-icon-' + name} aria-label={label}>[{name}]</span>
  ),
}))

describe('Recursos', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render the section header', () => {
    render(<Recursos />)
    expect(screen.getByTestId('recursos-header')).toBeDefined()
    expect(screen.getByText(/Recursos/)).toBeDefined()
    expect(screen.getByText(/Biblioteca/)).toBeDefined()
    expect(screen.getAllByText(/IT\/OT/).length).toBeGreaterThanOrEqual(1)
  })

  it('should render all 8 category filter tabs', () => {
    render(<Recursos />)
    expect(screen.getByText('Todos')).toBeDefined()
    expect(screen.getByText('Vol. I · IT')).toBeDefined()
    expect(screen.getByText('Vol. II · OT')).toBeDefined()
    expect(screen.getByText('Vol. III · Integración')).toBeDefined()
    expect(screen.getByText('Vol. IV · Ciberseguridad')).toBeDefined()
    expect(screen.getByText('Vol. V · Tendencias')).toBeDefined()
    expect(screen.getByText('Estándares')).toBeDefined()
    expect(screen.getByText('Proyecto')).toBeDefined()
  })

  it('should show total resource count of 61', () => {
    render(<Recursos />)
    const countElements = screen.getAllByText('61')
    expect(countElements.length).toBeGreaterThanOrEqual(1)
  })

  it('should render all 61 downloadable file cards by default', () => {
    render(<Recursos />)
    const downloadLinks = screen.getAllByRole('link').filter(l => l.hasAttribute('download'))
    expect(downloadLinks.length).toBe(61)
  })

  it('should expose download links pointing to /recursos paths', () => {
    render(<Recursos />)
    const links = screen.getAllByRole('link') as HTMLAnchorElement[]
    const standards = links.filter(l => l.getAttribute('href')?.includes('IEC_62443_resumen'))
    expect(standards.length).toBe(1)
    expect(standards[0].getAttribute('href')).toBe('/recursos/estandares/IEC_62443_resumen.docx')
    expect(standards[0].hasAttribute('download')).toBe(true)
  })

  it('should render DOCX and XLSX format badges', () => {
    render(<Recursos />)
    expect(screen.getAllByText('DOCX').length).toBeGreaterThan(0)
    expect(screen.getAllByText('XLSX').length).toBeGreaterThan(0)
  })

  it('should filter files when a category tab is clicked', () => {
    render(<Recursos />)
    const totalBefore = screen.getAllByRole('link').filter(l => l.hasAttribute('download')).length
    expect(totalBefore).toBe(61)

    act(() => { fireEvent.click(screen.getByText('Estándares')) })
    const links = screen.getAllByRole('link').filter(l => l.hasAttribute('download')) as HTMLAnchorElement[]
    expect(links.length).toBe(8)
    for (const l of links) {
      expect(l.getAttribute('href')).toContain('/recursos/estandares/')
    }
  })

  it('should filter project documents category', () => {
    render(<Recursos />)
    act(() => { fireEvent.click(screen.getByText('Proyecto')) })
    const links = screen.getAllByRole('link').filter(l => l.hasAttribute('download')) as HTMLAnchorElement[]
    expect(links.length).toBe(2)
    expect(links.some(l => l.getAttribute('href')?.includes('ROADMAP_ITOT_2025_2035'))).toBe(true)
    expect(links.some(l => l.getAttribute('href')?.endsWith('/recursos/README.docx'))).toBe(true)
  })

  it('should return to all files when Todos is clicked', () => {
    render(<Recursos />)
    act(() => { fireEvent.click(screen.getByText('Vol. IV · Ciberseguridad')) })
    expect(screen.getAllByRole('link').filter(l => l.hasAttribute('download')).length).toBe(10)
    act(() => { fireEvent.click(screen.getByText('Todos')) })
    expect(screen.getAllByRole('link').filter(l => l.hasAttribute('download')).length).toBe(61)
  })

  it('should keep the section as a pure documentation repository with no CTAs', () => {
    render(<Recursos />)
    const downloadLinks = screen.getAllByRole('link').filter(l => l.hasAttribute('download'))
    expect(downloadLinks.length).toBe(61)
    // Only download links exist: no contact anchor, no copilot buttons
    expect(screen.getAllByRole('link').length).toBe(downloadLinks.length)
    expect(screen.queryByRole('button')).toBeNull()
  })
})
