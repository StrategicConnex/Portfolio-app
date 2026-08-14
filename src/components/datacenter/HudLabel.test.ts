import { describe, it, expect } from 'vitest'
import { formatPhase, labelFacingOpacity, LABEL_FADE_COS } from './HudLabel'

describe('HudLabel — labelFacingOpacity (audit P4: cull tras la cámara, lección Hanwha)', () => {
  it('frente a la cámara (facing ≈ 1) → opacidad plena', () => {
    expect(labelFacingOpacity(1, false)).toBe(1)
    expect(labelFacingOpacity(0.5, false)).toBe(1)
  })

  it('fade angular: cos < umbral se desvanece hasta 0 en el plano', () => {
    expect(labelFacingOpacity(LABEL_FADE_COS / 2, false)).toBeCloseTo(0.5)
    expect(labelFacingOpacity(0, false)).toBe(0)
    expect(labelFacingOpacity(-0.5, false)).toBe(0)
  })

  it('reduced-motion → snap (sin fade): 1 si está delante, 0 detrás', () => {
    expect(labelFacingOpacity(0.01, true)).toBe(1)
    expect(labelFacingOpacity(0, true)).toBe(0)
    expect(labelFacingOpacity(-0.01, true)).toBe(0)
  })
})

describe('HudLabel — formatPhase (audit G1: numeración de fase en HUD)', () => {
  it('escena 0 (boot) → fase 01/05', () => {
    expect(formatPhase(0, 5)).toBe('01/05')
  })

  it('escena 1 (architecture) → 02/05', () => {
    expect(formatPhase(1, 5)).toBe('02/05')
  })

  it('última escena (4) → 05/05', () => {
    expect(formatPhase(4, 5)).toBe('05/05')
  })

  it('zero-padded genérico (no solo 1 dígito)', () => {
    expect(formatPhase(9, 12)).toBe('10/12')
  })
})
