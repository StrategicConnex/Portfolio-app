import { describe, expect, it } from 'vitest'
import {
  buildPhotonPath,
  FAILOVER_TIMELINE,
  failoverEvent,
  photonArrival,
  photonFailoverTint,
  photonGlobalProgress,
  PHOTON_COLOR_BY_SCENE,
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

  it('photonArrival: 0 antes de la ventana final, 1 en el nodo, clamped', () => {
    expect(photonArrival(0.8)).toBe(0)
    expect(photonArrival(0.9)).toBe(0)
    expect(photonArrival(0.95)).toBeCloseTo(0.5)
    expect(photonArrival(1)).toBeCloseTo(1)
    expect(photonArrival(1.5)).toBe(1)
  })
})
