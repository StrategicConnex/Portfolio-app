import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import PhaseGate, { hexToRgba } from './PhaseGate'
import { setActiveScene } from '@/lib/activeScene'

/**
 * Phase Gate — firma del sitio (audit de diseño P2, SPEC §3).
 * Overlay DOM z-30 sincronizado con el store activeScene. Cobertura:
 * helper de color, 5 capas por fase, sincronización con el store,
 * naturaleza decorativa (a11y + pointer-events) y reduced-motion.
 */
describe('PhaseGate — temperatura de color por fase (P2)', () => {
  afterEach(() => {
    setActiveScene(0)
    cleanup()
  })

  it('hexToRgba convierte #RRGGBB a rgba con alpha', () => {
    expect(hexToRgba('#4DA3FF', 0.16)).toBe('rgba(77, 163, 255, 0.16)')
    expect(hexToRgba('#E8D5AC', 0.2)).toBe('rgba(232, 213, 172, 0.2)')
  })

  it('renderiza 5 capas, una por fase (arco azul→cian→ámbar→champagne)', () => {
    const { container } = render(<PhaseGate />)
    const layers = [...container.querySelectorAll('[data-phase]')]
    expect(layers.length).toBe(5)
    expect(layers.map((l) => l.getAttribute('data-phase'))).toEqual([
      'boot',
      'architecture',
      'data-in-motion',
      'resilience',
      'connection',
    ])
    // boot activa por defecto (store arranca en 0)
    expect(layers[0].getAttribute('data-active')).toBe('true')
    expect(layers[1].getAttribute('data-active')).toBe('false')
    // la capa activa tiene opacity 1 (inline), las demás 0
    expect((layers[0] as HTMLElement).style.opacity).toBe('1')
    expect((layers[1] as HTMLElement).style.opacity).toBe('0')
  })

  it('sincroniza con el store de escena (re-render solo al cruzar)', () => {
    const { container, rerender } = render(<PhaseGate />)
    setActiveScene(3)
    rerender(<PhaseGate />)
    const layers = [...container.querySelectorAll('[data-phase]')]
    expect(layers[3].getAttribute('data-active')).toBe('true')
    expect((layers[3] as HTMLElement).style.opacity).toBe('1')
    expect(layers[0].getAttribute('data-active')).toBe('false')
    expect((layers[0] as HTMLElement).style.opacity).toBe('0')
  })

  it('escena fuera de rango → fallback a boot (0) sin romper', () => {
    const { container, rerender } = render(<PhaseGate />)
    setActiveScene(99)
    rerender(<PhaseGate />)
    const layers = [...container.querySelectorAll('[data-phase]')]
    expect(layers[0].getAttribute('data-active')).toBe('true')
  })

  it('overlay decorativo: aria-hidden + clase phase-gate (z-30 fijo vía CSS)', () => {
    const { container } = render(<PhaseGate />)
    const gate = container.querySelector('[data-testid="phase-gate"]')
    expect(gate?.getAttribute('aria-hidden')).toBe('true')
    expect(gate?.className).toContain('phase-gate')
    const layer = container.querySelector('[data-phase="boot"]')
    expect(layer?.className).toContain('phase-gate-layer')
  })

  it('reduced-motion: prop reduced anula la transición de opacidad', () => {
    const { container } = render(<PhaseGate reduced />)
    const layer = container.querySelector('[data-phase="resilience"]') as HTMLElement
    expect(layer.style.transition).toBe('none')
  })
})
