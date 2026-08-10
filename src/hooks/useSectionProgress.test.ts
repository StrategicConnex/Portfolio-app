import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSectionProgress } from './useSectionProgress'

describe('useSectionProgress', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'requestAnimationFrame',
      (cb: FrameRequestCallback) => setTimeout(() => cb(performance.now()), 0) as unknown as number,
    )
    vi.stubGlobal('cancelAnimationFrame', (id: number) => clearTimeout(id as unknown as number))
    Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true })
    Object.defineProperty(document.documentElement, 'scrollHeight', { value: 2000, configurable: true })
    Object.defineProperty(window, 'scrollY', { value: 500, configurable: true })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns a mutable progress ref and an active index', () => {
    const { result } = renderHook(() => useSectionProgress(['home', 'perfil']))
    expect(result.current.ref.current).toMatchObject({ active: -1 })
    expect(typeof result.current.ref.current.global).toBe('number')
    expect(typeof result.current.ref.current.section).toBe('number')
    expect(result.current.active).toBe(-1)
  })

  it('computes the active section from real DOM geometry on scroll', async () => {
    const fakeEl = (top: number, height: number) => ({
      getBoundingClientRect: () => ({
        top, height, bottom: top + height, left: 0, right: 0, width: 0, x: 0, y: top, toJSON: () => ({}),
      }),
    })
    const getById = vi.spyOn(document, 'getElementById').mockImplementation((id: string) => {
      if (id === 'home') return fakeEl(-300, 800) as unknown as HTMLElement
      if (id === 'perfil') return fakeEl(500, 800) as unknown as HTMLElement
      return null
    })

    const { result } = renderHook(() => useSectionProgress(['home', 'perfil']))
    await act(async () => {
      window.dispatchEvent(new Event('scroll'))
      await new Promise((r) => setTimeout(r, 30))
    })

    expect(result.current.active).toBe(0)
    // progreso de home: (400 - (-300)) / 800 = 0.875
    expect(result.current.ref.current.section).toBeCloseTo(0.875)
    // global: 500 / (2000 - 800) ≈ 0.4167
    expect(result.current.ref.current.global).toBeCloseTo(500 / 1200)
    getById.mockRestore()
  })

  it('regression: a section fully above the center (p=1) must not win forever', async () => {
    // home muy arriba (p clampado a 1 con la heurística vieja) vs perfil cuyo
    // punto medio está más cerca del centro del viewport (400).
    const fakeEl = (top: number, height: number) => ({
      getBoundingClientRect: () => ({
        top, height, bottom: top + height, left: 0, right: 0, width: 0, x: 0, y: top, toJSON: () => ({}),
      }),
    })
    const getById = vi.spyOn(document, 'getElementById').mockImplementation((id: string) => {
      if (id === 'home') return fakeEl(-2000, 800) as unknown as HTMLElement
      if (id === 'perfil') return fakeEl(100, 800) as unknown as HTMLElement
      return null
    })

    const { result } = renderHook(() => useSectionProgress(['home', 'perfil']))
    await act(async () => {
      window.dispatchEvent(new Event('scroll'))
      await new Promise((r) => setTimeout(r, 30))
    })

    // El centro (400) está en perfil [100, 900]: debe ganar perfil, no home.
    expect(result.current.active).toBe(1)
    // progreso de perfil: (400 - 100) / 800 = 0.375
    expect(result.current.ref.current.section).toBeCloseTo(0.375)
    getById.mockRestore()
  })
})
