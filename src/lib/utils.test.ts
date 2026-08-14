import { describe, it, expect } from 'vitest'
import { clamp, hexToRgba, randomizePercentages, randomizeThreatCounts, randomizeZones } from './utils'

describe('clamp', () => {
  it('should return the value when within range', () => {
    expect(clamp(5, 0, 10)).toBe(5)
  })

  it('should return min when value is below range', () => {
    expect(clamp(-5, 0, 10)).toBe(0)
  })

  it('should return max when value is above range', () => {
    expect(clamp(15, 0, 10)).toBe(10)
  })

  it('should handle edge cases with zero', () => {
    expect(clamp(0, 0, 0)).toBe(0)
  })

  it('should handle negative ranges', () => {
    expect(clamp(-10, -20, -5)).toBe(-10)
    expect(clamp(-30, -20, -5)).toBe(-20)
    expect(clamp(0, -20, -5)).toBe(-5)
  })
})

describe('hexToRgba', () => {
  it('should convert a 6-digit hex to rgba', () => {
    expect(hexToRgba('#FF0000', 0.5)).toBe('rgba(255, 0, 0, 0.5)')
  })

  it('should convert #4DA3FF (DodgerBlue) correctly', () => {
    const result = hexToRgba('#4DA3FF', 1)
    expect(result).toBe('rgba(77, 163, 255, 1)')
  })

  it('should handle alpha of 0', () => {
    expect(hexToRgba('#000000', 0)).toBe('rgba(0, 0, 0, 0)')
  })

  it('should handle alpha of 0.5', () => {
    const result = hexToRgba('#E8D5AC', 0.5)
    expect(result).toMatch(/^rgba\(\d+, \d+, \d+, 0\.5\)$/)
  })

  it('should handle white color', () => {
    expect(hexToRgba('#FFFFFF', 0.8)).toBe('rgba(255, 255, 255, 0.8)')
  })

  it('should handle black color', () => {
    expect(hexToRgba('#000000', 0.1)).toBe('rgba(0, 0, 0, 0.1)')
  })
})

describe('randomizePercentages', () => {
  const base = [
    { label: 'A', pct: 50 },
    { label: 'B', pct: 30 },
    { label: 'C', pct: 20 },
  ]

  it('should return the same number of items', () => {
    const result = randomizePercentages(base)
    expect(result).toHaveLength(base.length)
  })

  it('should keep all original keys except pct', () => {
    const result = randomizePercentages(base)
    result.forEach((item, i) => {
      expect(item.label).toBe(base[i].label)
    })
  })

  it('should have all percentages between 1 and 100', () => {
    for (let i = 0; i < 20; i++) {
      const result = randomizePercentages(base)
      result.forEach(item => {
        expect(item.pct).toBeGreaterThanOrEqual(1)
        expect(item.pct).toBeLessThanOrEqual(100)
      })
    }
  })

  it('should sum to approximately 100%', () => {
    for (let i = 0; i < 10; i++) {
      const result = randomizePercentages(base)
      const total = result.reduce((sum, item) => sum + item.pct, 0)
      expect(total).toBeGreaterThanOrEqual(96)
      expect(total).toBeLessThanOrEqual(104)
    }
  })

  it('should sort items by pct descending', () => {
    for (let i = 0; i < 10; i++) {
      const result = randomizePercentages(base)
      for (let j = 0; j < result.length - 1; j++) {
        expect(result[j].pct).toBeGreaterThanOrEqual(result[j + 1].pct)
      }
    }
  })
})

describe('randomizeThreatCounts', () => {
  const base = [
    { label: 'CRITICAL', count: 4, color: '#EF4444' },
    { label: 'HIGH', count: 8, color: '#F97316' },
  ]

  it('should return the same number of items', () => {
    const result = randomizeThreatCounts(base)
    expect(result).toHaveLength(base.length)
  })

  it('should keep non-count properties', () => {
    const result = randomizeThreatCounts(base)
    expect(result[0].label).toBe('CRITICAL')
    expect(result[0].color).toBe('#EF4444')
  })

  it('should clamp counts between 0 and 40', () => {
    for (let i = 0; i < 20; i++) {
      const result = randomizeThreatCounts(base)
      result.forEach(item => {
        expect(item.count).toBeGreaterThanOrEqual(0)
        expect(item.count).toBeLessThanOrEqual(40)
      })
    }
  })
})

describe('randomizeZones', () => {
  const base = [
    { labelKey: 'siem.zone.enterprise', pct: 98, color: '#10B981', events: 1204 },
    { labelKey: 'siem.zone.field', pct: 97, color: '#E8D5AC', events: 87 },
  ]

  it('should return the same number of items', () => {
    const result = randomizeZones(base)
    expect(result).toHaveLength(base.length)
  })

  it('should keep original keys', () => {
    const result = randomizeZones(base)
    expect(result[0].labelKey).toBe('siem.zone.enterprise')
    expect(result[0].color).toBe('#10B981')
  })

  it('should clamp pct between 90 and 100', () => {
    for (let i = 0; i < 20; i++) {
      const result = randomizeZones(base)
      result.forEach(item => {
        expect(item.pct).toBeGreaterThanOrEqual(90)
        expect(item.pct).toBeLessThanOrEqual(100)
      })
    }
  })

  it('should clamp events between 10 and 1400', () => {
    for (let i = 0; i < 20; i++) {
      const result = randomizeZones(base)
      result.forEach(item => {
        expect(item.events).toBeGreaterThanOrEqual(10)
        expect(item.events).toBeLessThanOrEqual(1400)
      })
    }
  })
})
