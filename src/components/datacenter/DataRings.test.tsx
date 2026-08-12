import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import DataRings from './DataRings'
import { setActiveScene } from '@/lib/activeScene'

vi.mock('@react-three/fiber', () => ({ useFrame: () => undefined }))
vi.mock('@/hooks/usePrefersReducedMotion', () => ({ usePrefersReducedMotion: () => false }))
vi.mock('./HudLabel', () => ({
  default: ({ labelKey, value }: { labelKey: string; value?: string }) => (
    <div data-testid="ring-label" data-key={labelKey} data-value={value ?? ''} />
  ),
}))

describe('DataRings — datos encarnados (audit G3)', () => {
  afterEach(() => {
    setActiveScene(0)
    vi.restoreAllMocks()
  })

  it('escena S2 (architecture) → solo marcos de cumplimiento (4 anillos)', () => {
    setActiveScene(1)
    const { container } = render(<DataRings />)
    const labels = screen.getAllByTestId('ring-label')
    expect(labels.length).toBe(4)
    expect(labels.map((l) => l.getAttribute('data-key')).sort()).toEqual(
      ['dc.data.iso', 'dc.data.iec', 'dc.data.nist', 'dc.data.gdpr'].sort(),
    )
    // 4 anillos × 2 meshes (fondo + progreso)
    expect(container.querySelectorAll('mesh').length).toBe(8)
  })

  it('escena S3 (data-in-motion) → KPIs + amenazas (8 anillos) con contador real', () => {
    setActiveScene(2)
    render(<DataRings />)
    const labels = screen.getAllByTestId('ring-label')
    expect(labels.length).toBe(8)
    const uptime = labels.find((l) => l.getAttribute('data-key') === 'siem.kpi.uptime')
    expect(uptime?.getAttribute('data-value')).toBe('99.9%')
  })

  it('escena S4 (resilience) → anillo de controles validados (131/142)', () => {
    setActiveScene(3)
    render(<DataRings />)
    const labels = screen.getAllByTestId('ring-label')
    expect(labels.length).toBe(1)
    expect(labels[0].getAttribute('data-key')).toBe('audit.stats.controls')
    expect(labels[0].getAttribute('data-value')).toBe('131/142')
  })

  it('escena S1 (boot) → sin anillos (el recorrido empieza sin telemetría)', () => {
    setActiveScene(0)
    const { container } = render(<DataRings />)
    expect(screen.queryByTestId('ring-label')).toBeNull()
    expect(container.querySelectorAll('mesh').length).toBe(0)
  })

  it('reacciona al cambio de escena (store pub/sub, no re-render global)', () => {
    setActiveScene(2)
    const { rerender } = render(<DataRings />)
    expect(screen.getAllByTestId('ring-label').length).toBe(8)
    setActiveScene(3)
    rerender(<DataRings />)
    expect(screen.getAllByTestId('ring-label').length).toBe(1)
  })
})
