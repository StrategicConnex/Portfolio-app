import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import StaticPoster from './StaticPoster'

describe('StaticPoster', () => {
  it('renders a decorative aria-hidden container at Z-10', () => {
    const { container } = render(<StaticPoster />)
    const el = container.querySelector('[aria-hidden="true"]') as HTMLElement | null
    expect(el).toBeDefined()
    expect(el!.style.position).toBe('fixed')
    expect(el!.style.zIndex).toBe('10')
    expect(el!.style.pointerEvents).toBe('none')
  })

  it('renders the Cold Cathedral poster as an <img> LCP candidate with fetchpriority=high', () => {
    const { container } = render(<StaticPoster />)
    const img = container.querySelector('img[data-poster-img]') as HTMLImageElement | null
    expect(img).toBeDefined()
    expect(img!.src).toContain('cold-cathedral-poster.webp')
    expect(img!.getAttribute('fetchpriority')).toBe('high')
    expect(img!.getAttribute('alt')).toBe('')
    // Dimensiones explícitas (evita unsized-images y CLS de ratio)
    expect(img!.getAttribute('width')).toBe('1400')
    expect(img!.getAttribute('height')).toBe('1867')
    // Chromium excluye del LCP imágenes con borde inferior >= viewport;
    // calc(100vh - 1px) garantiza candidatura LCP manteniendo full-bleed
    expect(img!.style.height).toBe('calc(100vh - 1px)')
    // El póster es decorativo: no debe ser anunciado por el screen reader
    expect(img!.getAttribute('aria-hidden')).toBeNull()
    expect(img!.closest('[aria-hidden="true"]')).toBeDefined()
  })
})
