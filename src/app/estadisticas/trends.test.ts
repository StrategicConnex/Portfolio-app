import { describe, it, expect } from 'vitest'
import { sumLastDays, pctDelta, trendDirection, sparklinePath, type DayCount } from './trends'

const serie = (...counts: number[]): DayCount[] =>
  counts.map((count, i) => ({ day: `2026-09-${String(i + 1).padStart(2, '0')}`, count }))

describe('sumLastDays', () => {
  it('sums the trailing N days of the series', () => {
    expect(sumLastDays(serie(3, 0, 2, 5), 2)).toBe(7)
    expect(sumLastDays(serie(3, 0, 2, 5), 4)).toBe(10)
  })

  it('returns 0 for an empty series', () => {
    expect(sumLastDays([], 7)).toBe(0)
  })

  it('sums everything when the series is shorter than the window', () => {
    expect(sumLastDays(serie(1, 2), 7)).toBe(3)
  })
})

describe('pctDelta', () => {
  it('computes the rounded percentage change', () => {
    expect(pctDelta(12, 10)).toBe(20)
    expect(pctDelta(8, 10)).toBe(-20)
    expect(pctDelta(10, 10)).toBe(0)
  })

  it('returns null when there is no baseline to compare against', () => {
    expect(pctDelta(5, 0)).toBeNull()
  })
})

describe('trendDirection', () => {
  it('classifies up, down and flat deltas', () => {
    expect(trendDirection(20)).toBe('up')
    expect(trendDirection(-5)).toBe('down')
    expect(trendDirection(0)).toBe('flat')
  })

  it('treats a missing baseline as flat, not as an infinite rise', () => {
    expect(trendDirection(null)).toBe('flat')
  })
})

describe('sparklinePath', () => {
  it('builds a polyline across the viewBox for varying counts', () => {
    const d = sparklinePath(serie(0, 10, 5), 100, 32)
    expect(d).toMatch(/^M0 /)
    expect(d).toContain('L50 ')
    expect(d).toContain('L100 16') // 5 de 10 → mitad de altura
  })

  it('returns an empty path for empty, single-point or all-zero series', () => {
    expect(sparklinePath([], 100, 32)).toBe('')
    expect(sparklinePath(serie(7), 100, 32)).toBe('')
    expect(sparklinePath(serie(0, 0, 0), 100, 32)).toBe('')
  })
})
