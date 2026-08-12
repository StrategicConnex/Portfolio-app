import { describe, it, expect } from 'vitest'
import { CORRIDOR_RACKS, DISPLAY_SLOTS, SWITCH_PROTAGONIST_GLB_POS, SWITCH_SLOTS, SWITCH_SLOT_Z_OFFSET } from './datacenter.layout'

describe('datacenter.slots — pools de switch y display (gap G4)', () => {
  it('SWITCH_SLOTS: uno por rack del corredor, en la 1U frontal (z = rack.z + 0.7)', () => {
    expect(SWITCH_SLOTS.length).toBe(CORRIDOR_RACKS.length)
    SWITCH_SLOTS.forEach((s, i) => {
      expect(s.position[0]).toBe(CORRIDOR_RACKS[i].position[0])
      expect(s.position[1]).toBe(1.9) // 1U superior, dentro del rack (0..2.4)
      expect(s.position[2]).toBeCloseTo(CORRIDOR_RACKS[i].position[2] + SWITCH_SLOT_Z_OFFSET)
      // fuera del volumen del rack (frente z=rack.z+0.45) → visible
      expect(s.position[2]).toBeGreaterThan(CORRIDOR_RACKS[i].position[2] + 0.45)
    })
  })

  it('switch protagonista: en el rack más cercano a cámara (S3, origen de streams)', () => {
    expect(SWITCH_PROTAGONIST_GLB_POS[0]).toBe(-2.6)
    expect(SWITCH_PROTAGONIST_GLB_POS[2]).toBe(-2.5 + SWITCH_SLOT_Z_OFFSET)
  })

  it('DISPLAY_SLOTS: S3 (lectura de UI) + S5 (nodo central), escenas válidas', () => {
    expect(DISPLAY_SLOTS.length).toBe(2)
    expect(DISPLAY_SLOTS[0].scene).toBe(2)
    expect(DISPLAY_SLOTS[1].scene).toBe(4)
    for (const d of DISPLAY_SLOTS) {
      expect(d.position.length).toBe(3)
      expect(d.position.every((v) => Number.isFinite(v))).toBe(true)
    }
  })
})
