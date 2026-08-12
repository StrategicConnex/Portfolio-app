import { describe, it, expect } from 'vitest'
import { CLEARCOAT_BY_MESH, NO_CLEARCOAT_MESHES, clearcoatForMesh } from './datacenter.materials'

describe('datacenter.materials — clearcoat de GLBs hero (audit G5)', () => {
  it('resuelve chasis/bezel/frame (case-insensitive) con acabado sutil', () => {
    expect(clearcoatForMesh('chassis')).toEqual({ clearcoat: 0.25, clearcoatRoughness: 0.35 })
    expect(clearcoatForMesh('CHASSIS')).toEqual({ clearcoat: 0.25, clearcoatRoughness: 0.35 })
    expect(clearcoatForMesh('bezel_slats')).toEqual({ clearcoat: 0.35, clearcoatRoughness: 0.25 })
    expect(clearcoatForMesh('frame')).toEqual({ clearcoat: 0.3, clearcoatRoughness: 0.3 })
  })

  it('meshes desconocidos → null (sin crash)', () => {
    expect(clearcoatForMesh('malla-desconocida')).toBeNull()
  })

  it('los emisivos/alpha del bridge §4 JAMÁS llevan clearcoat', () => {
    for (const name of NO_CLEARCOAT_MESHES) {
      expect(CLEARCOAT_BY_MESH[name], `${name} no debe estar en el mapa`).toBeUndefined()
      expect(clearcoatForMesh(name)).toBeNull()
    }
  })

  it('valores conservadores (0 < clearcoat < 0.5 — sutil, no plástico)', () => {
    for (const spec of Object.values(CLEARCOAT_BY_MESH)) {
      expect(spec.clearcoat).toBeGreaterThan(0)
      expect(spec.clearcoat).toBeLessThan(0.5)
      expect(spec.clearcoatRoughness).toBeGreaterThan(0)
      expect(spec.clearcoatRoughness).toBeLessThan(1)
    }
  })
})
