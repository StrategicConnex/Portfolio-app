import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useEffect, useState } from 'react'
import { render, screen } from '@testing-library/react'

// next/dynamic: el canvas 3D es un chunk lazy (SPEC §43). En tests, el mock
// resuelve el import async y renderiza el módulo mockeado cuando carga.
vi.mock('next/dynamic', () => ({
  default: (importFn: () => Promise<{ default: unknown }>) => {
    const Dynamic = (props: Record<string, unknown>) => {
      const [Comp, setComp] = useState<React.ComponentType | null>(null)
      useEffect(() => {
        importFn().then((mod) => setComp(() => (mod.default as React.ComponentType) || null))
      }, [])
      if (!Comp) return null
      return <Comp {...props} />
    }
    return Dynamic
  },
}))

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

import DatacenterExperience from './DatacenterExperience'

describe('DatacenterExperience', () => {
  beforeEach(() => {
    quality.fn.mockReturnValue('ULTRA')
    ctx.fn.mockReturnValue({ contextLost: false })
  })

  it('renders the canvas (lazy) when quality profile is not static', async () => {
    render(<DatacenterExperience />)
    expect(await screen.findByTestId('datacenter-canvas-mock')).toBeDefined()
  })

  it('never loads the canvas chunk when profile is STATIC (poster base Z-10 ya está en page.tsx)', async () => {
    quality.fn.mockReturnValue('STATIC')
    render(<DatacenterExperience />)
    // Esperar microtasks: el chunk lazy no debe montarse nunca
    await new Promise((r) => setTimeout(r, 30))
    expect(screen.queryByTestId('datacenter-canvas-mock')).toBeNull()
  })

  it('never loads the canvas chunk when the WebGL context is lost', async () => {
    ctx.fn.mockReturnValue({ contextLost: true })
    render(<DatacenterExperience />)
    await new Promise((r) => setTimeout(r, 30))
    expect(screen.queryByTestId('datacenter-canvas-mock')).toBeNull()
  })

  it('renders the manual motion toggle', () => {
    render(<DatacenterExperience />)
    expect(screen.getByRole('button', { name: 'Reducir animaciones 3D' })).toBeDefined()
  })
})
