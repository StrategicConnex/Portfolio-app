import { describe, expect, it } from 'vitest'
import { FAILOVER_TIMELINE, failoverEvent, purdueForScene, PURDUE_BY_SCENE } from './datacenter.storyline'

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
