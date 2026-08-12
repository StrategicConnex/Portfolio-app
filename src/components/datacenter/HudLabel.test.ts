import { describe, it, expect } from 'vitest'
import { formatPhase } from './HudLabel'

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
