import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import HudLabel from './HudLabel'
import { parseCounter, formatCounter } from '@/lib/datacenterData'

// El count-up escribe en el DOM vía ref dentro de useFrame; en jsdom el frame
// loop no corre, así que se valida: (1) el render inicial (0 con countUp,
// valor final con reduced-motion) y (2) las funciones puras de formato.
vi.mock('@react-three/drei', () => ({ Html: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }))
vi.mock('@react-three/fiber', () => ({ useFrame: () => undefined }))
vi.mock('@/context/LanguageContext', () => ({ useLanguage: () => ({ t: (k: string) => k }) }))
vi.mock('@/lib/activeScene', () => ({ useActiveScene: () => 0 }))
vi.mock('@/hooks/usePrefersReducedMotion', () => ({ usePrefersReducedMotion: () => false }))

describe('HudLabel — count-up (audit G3)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('con countUp, el render inicial muestra el contador en 0 (no el valor final)', () => {
    render(<HudLabel position={[0, 0, 0]} labelKey="siem.kpi.uptime" value="99.9%" countUp />)
    const label = screen.getByTestId('hud-label')
    expect(label.textContent).toContain('0.0%')
    expect(label.textContent).toContain('siem.kpi.uptime')
  })

  it('sin countUp, el valor se muestra completo (comportamiento anterior intacto)', () => {
    render(<HudLabel position={[0, 0, 0]} labelKey="siem.kpi.uptime" value="99.9%" />)
    const label = screen.getByTestId('hud-label')
    expect(label.textContent).toContain('99.9%')
  })

  it('las funciones puras del contador cubren los displays reales de DataRings', () => {
    const samples = ['99.9%', '−30%', '−10h/sem', '< 15 min', '131/142', '4', '94%']
    for (const s of samples) {
      const spec = parseCounter(s)
      expect(spec).not.toBeNull()
      expect(formatCounter(spec!, 1)).toBe(s)
    }
  })
})
