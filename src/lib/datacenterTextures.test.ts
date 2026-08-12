import { describe, it, expect } from 'vitest'
import {
  panelSeams,
  ventRows,
  unitSlots,
  brushedStreaks,
} from './datacenterTextures'

describe('datacenterTextures — layout puro (testeable sin canvas)', () => {
  it('panelSeams: 2 verticales + 2 horizontales dentro del lienzo', () => {
    const seams = panelSeams(1024)
    expect(seams).toHaveLength(4)
    const verticals = seams.filter((s) => s.h > s.w)
    const horizontals = seams.filter((s) => s.w > s.h)
    expect(verticals).toHaveLength(2)
    expect(horizontals).toHaveLength(2)
    for (const s of seams) {
      expect(s.x).toBeGreaterThanOrEqual(0)
      expect(s.y).toBeGreaterThanOrEqual(0)
      expect(s.x + s.w).toBeLessThanOrEqual(1024)
      expect(s.y + s.h).toBeLessThanOrEqual(1024)
    }
  })

  it('ventRows: 3 filas × 12 ranuras, todas dentro del lienzo', () => {
    const rows = ventRows(1024)
    expect(rows).toHaveLength(36)
    for (const r of rows) {
      expect(r.x).toBeGreaterThanOrEqual(0)
      expect(r.y).toBeGreaterThanOrEqual(0)
      expect(r.x + r.w).toBeLessThanOrEqual(1024)
      expect(r.y + r.h).toBeLessThanOrEqual(1024)
      expect(r.h).toBeLessThan(r.w) // ranuras horizontales
    }
  })

  it('unitSlots: cubre el lienzo con ranuras finas, cluster central más denso', () => {
    const slots = unitSlots(512)
    expect(slots.length).toBeGreaterThan(20)
    const mid = slots.filter((s) => s.y > 180 && s.y < 332)
    const edges = slots.filter((s) => s.y <= 180 || s.y >= 332)
    const midW = mid.reduce((a, s) => a + s.w, 0) / mid.length
    const edgeW = edges.reduce((a, s) => a + s.w, 0) / edges.length
    expect(midW).toBeGreaterThan(edgeW) // densidad central
  })

  it('brushedStreaks: determinista con misma seed, rango de shade válido', () => {
    const a = brushedStreaks(512, 7)
    const b = brushedStreaks(512, 7)
    expect(a).toEqual(b)
    expect(a.length).toBeGreaterThan(80)
    for (const st of a) {
      expect(st.shade).toBeGreaterThanOrEqual(0.25)
      expect(st.shade).toBeLessThanOrEqual(0.75)
      expect(st.y).toBeGreaterThanOrEqual(0)
    }
  })
})
