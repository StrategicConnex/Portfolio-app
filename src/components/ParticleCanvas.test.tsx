import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'

// Mock tsparticles before importing the component
vi.mock('@tsparticles/react', () => {
  const MockParticles = (props: { options?: Record<string, unknown>; style?: React.CSSProperties; id?: string }) => {
    return <div data-testid="tsparticles" style={props.style} data-options={JSON.stringify(props.options)} />
  }
  
  const MockProvider = ({ children, init }: { children: React.ReactNode; init?: (engine: Record<string, unknown>) => void }) => {
    React.useEffect(() => {
      if (init) {
        const mockEngine = {}
        init(mockEngine)
      }
    }, [init])
    return <div data-testid="provider">{children}</div>
  }
  
  const MockHook = () => ({ loaded: true })
  
  return {
    default: MockParticles,
    ParticlesProvider: MockProvider,
    Particles: MockParticles,
    useParticlesProvider: MockHook,
  }
})

vi.mock('@tsparticles/preset-links', () => ({
  loadLinksPreset: vi.fn(),
}))

import ParticleCanvas from './ParticleCanvas'

describe('ParticleCanvas', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render the particles provider', () => {
    render(<ParticleCanvas />)
    expect(screen.getByTestId('provider')).toBeDefined()
  })

  it('should render the particles canvas', () => {
    render(<ParticleCanvas />)
    expect(screen.getByTestId('tsparticles')).toBeDefined()
  })

  it('should have aria-hidden on the container', () => {
    const { container } = render(<ParticleCanvas />)
    const hiddenElements = container.querySelectorAll('[aria-hidden="true"]')
    expect(hiddenElements.length).toBeGreaterThanOrEqual(1)
  })

  it('should have id tsparticles on the particles element', () => {
    render(<ParticleCanvas />)
    const tsparticlesEl = screen.getByTestId('tsparticles')
    expect(tsparticlesEl).toBeDefined()
  })

  it('should render particles when loaded', () => {
    render(<ParticleCanvas />)
    expect(screen.getByTestId('tsparticles')).toBeDefined()
    expect(screen.queryByTestId('loading-fallback')).toBeNull()
  })
})
