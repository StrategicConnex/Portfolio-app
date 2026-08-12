import { describe, it, expect } from 'vitest'
import {
  MESH_DOOR_COLS,
  MESH_DOOR_ROWS,
  meshDoorBars,
} from './meshDoorTexture'

describe('meshDoorBars — patrón bakeable AR2580 (puerta de malla)', () => {
  it('rejilla 24×8 barras (contrato §3.4: Array 24×8)', () => {
    const { vertical, horizontal } = meshDoorBars(512)
    expect(vertical).toHaveLength(MESH_DOOR_COLS)
    expect(horizontal).toHaveLength(MESH_DOOR_ROWS)
  })

  it('barras verticales contenidas, equiespaciadas, de alto completo', () => {
    const size = 512
    const { vertical } = meshDoorBars(size)
    const cellW = size / MESH_DOOR_COLS
    for (const b of vertical) {
      expect(b.x).toBeGreaterThanOrEqual(0)
      expect(b.x + b.w).toBeLessThanOrEqual(size)
      expect(b.y).toBe(0)
      expect(b.h).toBe(size)
      expect(b.w).toBeGreaterThan(0)
    }
    for (let i = 1; i < vertical.length; i++) {
      expect(vertical[i].x - vertical[i - 1].x).toBeCloseTo(cellW, 6)
    }
  })

  it('barras horizontales contenidas y simétricas', () => {
    const size = 512
    const { horizontal } = meshDoorBars(size)
    const cellH = size / MESH_DOOR_ROWS
    for (const b of horizontal) {
      expect(b.y).toBeGreaterThanOrEqual(0)
      expect(b.y + b.h).toBeLessThanOrEqual(size)
      expect(b.x).toBe(0)
      expect(b.w).toBe(size)
      expect(b.h).toBeGreaterThan(0)
    }
    for (let j = 1; j < horizontal.length; j++) {
      expect(horizontal[j].y - horizontal[j - 1].y).toBeCloseTo(cellH, 6)
    }
  })

  it('densidad de perforación: barras cubren ~50-65% del área (huecos visibles)', () => {
    const size = 512
    const { vertical, horizontal } = meshDoorBars(size)
    let covered = 0
    for (const b of [...vertical, ...horizontal]) covered += b.w * b.h
    // Los cruces vertical×horizontal se contaron 2× → restar el solape
    const overlap = vertical.length * horizontal.length * vertical[0].w * horizontal[0].h
    const ratio = (covered - overlap) / (size * size)
    expect(ratio).toBeGreaterThan(0.5)
    expect(ratio).toBeLessThan(0.65)
  })
})
