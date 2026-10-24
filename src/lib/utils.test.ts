import { describe, it, expect } from 'vitest'
import { clamp, hexToRgba, toArgentinaTime } from './utils'

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

  it('should convert #1E90FF (DodgerBlue) correctly', () => {
    const result = hexToRgba('#1E90FF', 1)
    expect(result).toBe('rgba(30, 144, 255, 1)')
  })

  it('should handle alpha of 0', () => {
    expect(hexToRgba('#000000', 0)).toBe('rgba(0, 0, 0, 0)')
  })

  it('should handle alpha of 0.5', () => {
    const result = hexToRgba('#C5A46D', 0.5)
    expect(result).toMatch(/^rgba\(\d+, \d+, \d+, 0\.5\)$/)
  })

  it('should handle white color', () => {
    expect(hexToRgba('#FFFFFF', 0.8)).toBe('rgba(255, 255, 255, 0.8)')
  })

  it('should handle black color', () => {
    expect(hexToRgba('#000000', 0.1)).toBe('rgba(0, 0, 0, 0.1)')
  })
})

describe('toArgentinaTime', () => {
  it('should convert a UTC instant to Argentina time (UTC-3)', () => {
    expect(toArgentinaTime(new Date('2026-03-01T15:51:39Z'))).toBe('12:51:39')
  })

  it('should wrap across midnight', () => {
    expect(toArgentinaTime(new Date('2026-03-01T02:10:00Z'))).toBe('23:10:00')
  })

  it('should wrap across month end (non-leap year)', () => {
    expect(toArgentinaTime(new Date('2026-03-01T01:30:00Z'))).toBe('22:30:00')
  })

  it('should always return the HH:MM:SS format', () => {
    expect(toArgentinaTime(new Date('2026-10-24T05:07:09Z'))).toBe('02:07:09')
  })
})
