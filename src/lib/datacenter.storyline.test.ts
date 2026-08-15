import { describe, expect, it } from 'vitest'
import {
  beamClusterPoints,
  beamPointAlong,
  BEAM_ORIGIN,
  BEAM_TARGET,
  buildPhotonPath,
  connectionBeamStrength,
  FAILOVER_TIMELINE,
  failoverEvent,
  photonArrival,
  photonDeparture,
  photonFailoverTint,
  photonGlobalProgress,
  PHOTON_COLOR_BY_SCENE,
  PHOTON_NODE_GLOBAL,
  PHOTON_SEGMENTS,
  purdueForScene,
  PURDUE_BY_SCENE,
} from './datacenter.storyline'

describe('failoverEvent (audit P7a — semántica de red real)', () => {
  it('clamps el progreso fuera de rango', () => {
    expect(failoverEvent(-1)).toEqual({ primary: 'normal', backup: 'normal' })
    expect(failoverEvent(2)).toEqual({ primary: 'restored', backup: 'restored' })
  })

  it('sigue la timeline normal → fault → dead → recover → restored', () => {
    const mid = (a: number, b: number) => (a + b) / 2
    expect(failoverEvent(mid(0, FAILOVER_TIMELINE.faultStart))).toEqual({
      primary: 'normal',
      backup: 'normal',
    })
    expect(failoverEvent(mid(FAILOVER_TIMELINE.faultStart, FAILOVER_TIMELINE.deadStart))).toEqual({
      primary: 'fault',
      backup: 'fault',
    })
    expect(failoverEvent(mid(FAILOVER_TIMELINE.deadStart, FAILOVER_TIMELINE.recoverStart))).toEqual({
      primary: 'dead',
      backup: 'dead',
    })
    expect(failoverEvent(mid(FAILOVER_TIMELINE.recoverStart, FAILOVER_TIMELINE.restored))).toEqual({
      primary: 'recover',
      backup: 'recover',
    })
    expect(failoverEvent(0.95)).toEqual({ primary: 'restored', backup: 'restored' })
  })

  it('es determinístico y reversible por scroll (mismo input → mismo output)', () => {
    const a = failoverEvent(0.55)
    const b = failoverEvent(0.55)
    expect(a).toEqual(b)
  })
})

describe('purdueForScene (audit P7c — eje IEC 62443)', () => {
  it('mapea las 5 escenas al recorrido Enterprise → Operations → DMZ → Control → Internet', () => {
    expect(PURDUE_BY_SCENE).toHaveLength(5)
    expect(purdueForScene(0)?.level).toBe('04')
    expect(purdueForScene(1)?.level).toBe('03')
    expect(purdueForScene(2)?.level).toBe('03.5')
    expect(purdueForScene(3)?.level).toBe('01')
    expect(purdueForScene(4)?.level).toBe('05')
  })

  it('devuelve null fuera de rango', () => {
    expect(purdueForScene(-1)).toBeNull()
    expect(purdueForScene(5)).toBeNull()
  })
})

describe('fotón P7d — path continuo (hilo de continuidad)', () => {
  it('el path es continuo: cada tramo termina donde empieza el siguiente (cero saltos en fronteras de escena)', () => {
    const eq = (a: [number, number, number], b: [number, number, number]) =>
      Math.abs(a[0] - b[0]) < 1e-9 && Math.abs(a[1] - b[1]) < 1e-9 && Math.abs(a[2] - b[2]) < 1e-9
    for (let i = 0; i < PHOTON_SEGMENTS.length - 1; i++) {
      const last = PHOTON_SEGMENTS[i][PHOTON_SEGMENTS[i].length - 1]
      const first = PHOTON_SEGMENTS[i + 1][0]
      expect(eq(last, first), `tramo ${i} → ${i + 1} conectado`).toBe(true)
    }
    expect(buildPhotonPath().length).toBe(PHOTON_SEGMENTS.reduce((n, s) => n + s.length, 0))
  })

  it('photonGlobalProgress mapea (escena, progreso interno) a 0..1 sin saltos', () => {
    // Nacimiento (antes de la primera sección) y extremos
    expect(photonGlobalProgress(-1, 0)).toBe(0)
    expect(photonGlobalProgress(0, 0)).toBe(0)
    expect(photonGlobalProgress(0, 1)).toBeCloseTo(0.2)
    expect(photonGlobalProgress(2, 0.5)).toBeCloseTo(0.5)
    expect(photonGlobalProgress(4, 1)).toBe(1)
    expect(photonGlobalProgress(9, 0)).toBe(1)
    // Continuidad en la frontera de escena: fin de escena i === inicio de i+1
    expect(photonGlobalProgress(2, 1)).toBe(photonGlobalProgress(3, 0))
  })

  it('el arco de temperatura tiene un color por escena (identidad del Phase Gate)', () => {
    expect(PHOTON_COLOR_BY_SCENE).toHaveLength(5)
    expect(PHOTON_COLOR_BY_SCENE[0]).toMatch(/^#[0-9a-fA-F]{6}$/)
    expect(PHOTON_COLOR_BY_SCENE[4]).toBe('#E8D5AC') // champagne — la llegada
  })

  it('photonFailoverTint: la ventana dead es el momento del portador (máximo boost)', () => {
    expect(photonFailoverTint('normal')).toEqual({ sizeBoost: 0, opacityBoost: 0 })
    expect(photonFailoverTint('fault').sizeBoost).toBeGreaterThan(0)
    expect(photonFailoverTint('dead').sizeBoost).toBeGreaterThan(photonFailoverTint('fault').sizeBoost)
    expect(photonFailoverTint('restored')).toEqual({ sizeBoost: 0, opacityBoost: 0 })
  })

  it('photonArrival: el bloom sube al llegar al nodo y se desvanece al partir por el haz (P7e)', () => {
    expect(photonArrival(0.8)).toBe(0)
    expect(photonArrival(0.84)).toBe(0)
    // Mitad de la subida (0.84 → PHOTON_NODE_GLOBAL)
    const riseMid = (0.84 + PHOTON_NODE_GLOBAL) / 2
    expect(photonArrival(riseMid)).toBeCloseTo(0.5)
    // Exactamente en el nodo: bloom pleno
    expect(photonArrival(PHOTON_NODE_GLOBAL)).toBeCloseTo(1)
    // Al partir por el haz, el bloom se desvanece
    expect(photonArrival(1)).toBe(0)
    expect(photonArrival(1.5)).toBe(0)
  })

  it('photonDeparture: 0 en el nodo, 1 en el clúster distante (P7e)', () => {
    expect(photonDeparture(0.8)).toBe(0)
    expect(photonDeparture(PHOTON_NODE_GLOBAL)).toBeCloseTo(0)
    const mid = (PHOTON_NODE_GLOBAL + 1) / 2
    expect(photonDeparture(mid)).toBeCloseTo(0.5)
    expect(photonDeparture(1)).toBeCloseTo(1)
    expect(photonDeparture(2)).toBe(1)
  })

  it('P7e haz: el último tramo del fotón es colineal con BEAM_ORIGIN→BEAM_TARGET', () => {
    const s5 = PHOTON_SEGMENTS[4]
    const node = s5[s5.length - 3] // el nodo central [0, 2.0, -1.85]
    const last = s5[s5.length - 1]
    const beamDir = [BEAM_TARGET[0] - BEAM_ORIGIN[0], BEAM_TARGET[1] - BEAM_ORIGIN[1], BEAM_TARGET[2] - BEAM_ORIGIN[2]]
    const photonDir = [last[0] - node[0], last[1] - node[1], last[2] - node[2]]
    const norm = (v: number[]) => {
      const l = Math.hypot(v[0], v[1], v[2])
      return [v[0] / l, v[1] / l, v[2] / l]
    }
    const a = norm(beamDir)
    const b = norm(photonDir)
    const dot = a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
    expect(dot).toBeGreaterThan(0.999)
  })

  it('connectionBeamStrength: ventana determinística del clímax', () => {
    expect(connectionBeamStrength(0.8)).toBe(0)
    expect(connectionBeamStrength(0.84)).toBe(0)
    expect(connectionBeamStrength(0.89)).toBeCloseTo(0.5)
    expect(connectionBeamStrength(0.95)).toBe(1)
    expect(connectionBeamStrength(1)).toBe(1)
  })

  it('beamPointAlong: 0 en el origen (nodo), 1 en el target (clúster), clamped', () => {
    expect(beamPointAlong(0)).toEqual(BEAM_ORIGIN)
    expect(beamPointAlong(1)).toEqual(BEAM_TARGET)
    const mid = beamPointAlong(0.5)
    expect(mid[0]).toBeCloseTo((BEAM_ORIGIN[0] + BEAM_TARGET[0]) / 2)
    expect(beamPointAlong(-1)[0]).toBe(BEAM_ORIGIN[0])
    expect(beamPointAlong(2)[2]).toBe(BEAM_TARGET[2])
  })

  it('beamClusterPoints: retícula determinística alrededor del target', () => {
    const a = beamClusterPoints()
    const b = beamClusterPoints()
    expect(a).toHaveLength(12)
    expect(a).toEqual(b) // determinístico
    for (const pt of a) {
      expect(Math.abs(pt[0] - BEAM_TARGET[0])).toBeLessThan(2.5)
      expect(Math.abs(pt[1] - BEAM_TARGET[1])).toBeLessThan(1.6)
      expect(Math.abs(pt[2] - BEAM_TARGET[2])).toBeLessThan(0.6)
    }
  })
})
