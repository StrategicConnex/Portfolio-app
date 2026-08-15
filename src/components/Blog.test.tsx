import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import Blog from './Blog'

vi.mock('framer-motion', async () => {
  const { createMotionMock } = await import('@/test-utils/framer-motion')
  return {
    motion: createMotionMock(['div', 'button']),
    useInView: () => true,
    useScroll: () => ({ scrollYProgress: { get: () => 0 } }),
    useTransform: () => ({ get: () => 0 }),
  }
})

const mockT = vi.fn((key: string) => {
  const m: Record<string, string> = {
    'blog.label': 'Blog',
    'blog.title': 'Inteligencia',
    'blog.highlight': 'Aplicada',
    'blog.description': 'Análisis y tendencias en ciberseguridad industrial',
    'blog.view_all': 'Ver todos',
    'blog.read_more': 'Leer más',
  }
  return m[key] || key
})

vi.mock('@/context/LanguageContext', () => ({
  useLanguage: () => ({ language: 'es', setLanguage: vi.fn(), t: mockT }),
}))

vi.mock('./ui/SectionHeader', () => ({
  default: ({ label, title, highlight, center }: { label: string; title: string; highlight?: string; center?: boolean }) => (
    <div data-testid="blog-header" data-center={String(center)}>{label} - {title} {highlight}</div>
  ),
}))

describe('Blog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render the section header', () => {
    render(<Blog />)
    expect(screen.getByTestId('blog-header')).toBeDefined()
  })

  it('should render the blog description', () => {
    render(<Blog />)
    expect(screen.getByText('Análisis y tendencias en ciberseguridad industrial')).toBeDefined()
  })

  it('should render the view all button', () => {
    render(<Blog />)
    expect(screen.getByText('Ver todos')).toBeDefined()
  })

  it('should render with id blog', () => {
    render(<Blog />)
    const section = document.querySelector('section#blog')
    expect(section).toBeDefined()
  })
})
