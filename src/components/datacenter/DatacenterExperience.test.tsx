import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

const quality = vi.hoisted(() => ({ fn: vi.fn() }))
const ctx = vi.hoisted(() => ({ fn: vi.fn() }))

vi.mock('@/hooks/useHardwareDetection', () => ({
  useHardwareDetection: () => ({ tier: 'HIGH', webglSupported: true, coarsePointer: false, cores: 8 }),
}))

vi.mock('@/hooks/usePrefersReducedMotion', () => ({
  usePrefersReducedMotion: () => ({ reduced: false, toggle: vi.fn() }),
}))

vi.mock('@/hooks/useAdaptiveQuality', () => ({
  useAdaptiveQuality: () => quality.fn(),
}))

vi.mock('@/hooks/useWebGLContextManager', () => ({
  useWebGLContextManager: () => ctx.fn(),
}))

vi.mock('./DatacenterCanvas', () => ({
  default: () => <div data-testid="datacenter-canvas-mock" />,
}))

vi.mock('./StaticPoster', () => ({
  default: () => <div data-testid="static-poster" />,
}))

import DatacenterExperience from './DatacenterExperience'

describe('DatacenterExperience', () => {
  beforeEach(() => {
    quality.fn.mockReturnValue('ULTRA')
    ctx.fn.mockReturnValue({ contextLost: false })
  })

  it('renders the canvas when quality profile is not static', () => {
    render(<DatacenterExperience />)
    expect(screen.getByTestId('datacenter-canvas-mock')).toBeDefined()
    expect(screen.queryByTestId('static-poster')).toBeNull()
  })

  it('renders the poster when profile is STATIC', () => {
    quality.fn.mockReturnValue('STATIC')
    render(<DatacenterExperience />)
    expect(screen.getByTestId('static-poster')).toBeDefined()
    expect(screen.queryByTestId('datacenter-canvas-mock')).toBeNull()
  })

  it('renders the poster when the WebGL context is lost', () => {
    ctx.fn.mockReturnValue({ contextLost: true })
    render(<DatacenterExperience />)
    expect(screen.getByTestId('static-poster')).toBeDefined()
    expect(screen.queryByTestId('datacenter-canvas-mock')).toBeNull()
  })

  it('renders the manual motion toggle', () => {
    render(<DatacenterExperience />)
    expect(screen.getByRole('button', { name: 'Reducir animaciones 3D' })).toBeDefined()
  })
})
