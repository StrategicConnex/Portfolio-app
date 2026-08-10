import { describe, it, expect } from 'vitest'
import {
  TIER_COUNTS,
  CORRIDOR_RACKS,
  BACKGROUND_RACKS,
  HERO_RACK_POS,
  BACKUP_UNITS,
  STREAM_PATHS,
  PARTICLES_BOX,
  samplePath,
} from './datacenter.layout'
import { nodes, edges } from '@/data/mindmap'

describe('datacenter layout (SPEC §20)', () => {
  it('has tier counts with sane scaling', () => {
    for (const tier of ['ULTRA', 'HIGH', 'MEDIUM', 'LOW'] as const) {
      const c = TIER_COUNTS[tier]
      expect(c.corridorRows).toBeGreaterThan(0)
      expect(c.particles).toBeGreaterThan(0)
      expect(c.backupUnits).toBeGreaterThan(0)
    }
    expect(TIER_COUNTS.ULTRA.corridorRows).toBeGreaterThan(TIER_COUNTS.LOW.corridorRows)
    expect(TIER_COUNTS.ULTRA.particles).toBeGreaterThan(TIER_COUNTS.LOW.particles)
  })

  it('has 3-length positions everywhere', () => {
    expect(HERO_RACK_POS).toHaveLength(3)
    for (const r of [...CORRIDOR_RACKS, ...BACKGROUND_RACKS]) expect(r.position).toHaveLength(3)
    for (const b of BACKUP_UNITS) expect(b.scale).toHaveLength(3)
  })

  it('has stream paths with at least 2 points and valid samplePath endpoints', () => {
    for (const path of STREAM_PATHS) {
      expect(path.length).toBeGreaterThanOrEqual(2)
      const start = samplePath(path, 0)
      const end = samplePath(path, 1)
      expect(start[0]).toBeCloseTo(path[0][0])
      expect(end[0]).toBeCloseTo(path[path.length - 1][0])
    }
  })

  it('particle box is sane', () => {
    for (let i = 0; i < 3; i++) expect(PARTICLES_BOX.min[i]).toBeLessThan(PARTICLES_BOX.max[i])
  })

  it('mindmap topology: every edge references existing nodes with 3-length positions', () => {
    const labels = new Set(nodes.map((n) => n.label))
    for (const [a, b] of edges) {
      expect(labels.has(a)).toBe(true)
      expect(labels.has(b)).toBe(true)
    }
    for (const n of nodes) expect(n.pos).toHaveLength(3)
  })
})
