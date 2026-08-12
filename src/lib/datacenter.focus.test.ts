import { describe, it, expect } from 'vitest'
import { ALL_SECTIONS, SCENES, resolveSceneForSection } from './scenes'
import { FOCUS_NODES, getFocusNodeForSection } from './datacenter.focus'
import { DATACENTER_TOKENS } from './datacenter.tokens'

describe('datacenter.focus — mapa sección → ancla 3D (audit G2)', () => {
  it('cubre TODAS las secciones DOM con exactamente un nodo', () => {
    const ids = FOCUS_NODES.map((n) => n.sectionId)
    expect(new Set(ids).size).toBe(ids.length) // sin duplicados
    for (const section of ALL_SECTIONS) {
      expect(getFocusNodeForSection(section), `falta nodo para #${section}`).not.toBeNull()
    }
  })

  it('sceneIndex es consistente con la escena real de cada sección', () => {
    for (const section of ALL_SECTIONS) {
      const node = getFocusNodeForSection(section)!
      const scene = resolveSceneForSection(ALL_SECTIONS.indexOf(section))
      expect(scene).not.toBeNull()
      expect(node.sceneIndex, `#${section}`).toBe(SCENES.indexOf(scene!))
    }
  })

  it('labelKey es una clave i18n diegética (dc.focus.*) — cero texto hardcoded en geometría', () => {
    for (const node of FOCUS_NODES) {
      expect(node.labelKey.startsWith('dc.focus.')).toBe(true)
    }
  })

  it('posiciones finitas y colores del token system (nunca hex hardcodeado suelto)', () => {
    const valid: Set<string> = new Set(Object.values(DATACENTER_TOKENS.colors))
    for (const node of FOCUS_NODES) {
      for (const v of node.position) expect(Number.isFinite(v)).toBe(true)
      expect(valid.has(node.color), `color inválido en #${node.sectionId}`).toBe(true)
    }
  })

  it('secciones desconocidas → null (sin crash)', () => {
    expect(getFocusNodeForSection('no-existe')).toBeNull()
  })
})
