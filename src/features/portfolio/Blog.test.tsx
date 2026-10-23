import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import Blog from './Blog'

vi.mock('framer-motion', async () => {
  const { createMotionMock } = await import('@/test-utils/framer-motion')
  return { motion: createMotionMock(['div', 'button']) }
})

const mockT = vi.fn((key: string) => {
  const m: Record<string, string> = {
    'blog.label': 'Blog',
    'blog.title': 'Inteligencia',
    'blog.highlight': 'Aplicada',
    'blog.description': 'Análisis y tendencias en ciberseguridad industrial',
    'blog.status.draft': 'En preparación',
    'blog.status.pending': 'Próximamente',
  }
  return m[key] || key
})

vi.mock('@/context/LanguageContext', () => ({
  useLanguage: () => ({ language: 'es', setLanguage: vi.fn(), t: mockT }),
}))

vi.mock('@/components/ui/SectionHeader', () => ({
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

  it('should mark every post as unpublished instead of showing a read time', () => {
    render(<Blog />)
    expect(screen.queryByText('Read more')).toBeNull()
    expect(screen.getAllByText('En preparación')).toHaveLength(3)
  })

  it('should render with id blog', () => {
    render(<Blog />)
    const section = document.querySelector('section#blog')
    expect(section).toBeDefined()
  })
})
