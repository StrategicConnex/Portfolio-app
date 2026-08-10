import { describe, it, expect } from 'vitest'
import {
  SCENES,
  ALL_SECTIONS,
  computeSceneProgress,
  interpolateWaypoints,
  resolveSceneForSection,
} from './scenes'

describe('scenes config (SPEC §5, §20)', () => {
  it('has exactly 5 scenes with the expected ids', () => {
    expect(SCENES.map((s) => s.id)).toEqual([
      'boot',
      'architecture',
      'data-in-motion',
      'resilience',
      'connection',
    ])
  })

  it('has unique section ids covering the real page sections', () => {
    const ids = ALL_SECTIONS
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ['home', 'perfil', 'arquitectura', 'stack', 'confianza', 'experiencia', 'proyecto', 'certificaciones', 'siem', 'audit-hub', 'scaudit', 'blog', 'contacto']) {
      expect(ids).toContain(id)
    }
  })

  it('every scene has complete waypoints and sane fog', () => {
    for (const s of SCENES) {
      expect(s.sections.length).toBeGreaterThan(0)
      for (const wp of [s.camera.entry, s.camera.mid, s.camera.exit]) {
        expect(wp.position).toHaveLength(3)
        expect(wp.lookAt).toHaveLength(3)
        expect(wp.fov).toBeGreaterThan(0)
      }
      expect(s.fog.near).toBeLessThan(s.fog.far)
    }
  })

  it('interpolateWaypoints returns entry at 0, mid at 0.5, exit at 1', () => {
    const s = SCENES[0]
    expect(interpolateWaypoints(s.camera, 0).fov).toBeCloseTo(s.camera.entry.fov)
    expect(interpolateWaypoints(s.camera, 0.5).fov).toBeCloseTo(s.camera.mid.fov)
    expect(interpolateWaypoints(s.camera, 1).fov).toBeCloseTo(s.camera.exit.fov)
  })

  it('computeSceneProgress maps first/last section of a scene to 0/1', () => {
    const scene = SCENES[1] // architecture: perfil, arquitectura, stack, confianza
    const firstIdx = ALL_SECTIONS.indexOf(scene.sections[0])
    const lastIdx = ALL_SECTIONS.indexOf(scene.sections[scene.sections.length - 1])
    expect(computeSceneProgress(scene, firstIdx, 0)).toBeCloseTo(0)
    expect(computeSceneProgress(scene, lastIdx, 1)).toBeCloseTo(1)
  })

  it('resolveSceneForSection resolves the owning scene', () => {
    expect(resolveSceneForSection(ALL_SECTIONS.indexOf('siem'))?.id).toBe('data-in-motion')
    expect(resolveSceneForSection(-1)).toBeNull()
    expect(resolveSceneForSection(9999)).toBeNull()
  })
})
