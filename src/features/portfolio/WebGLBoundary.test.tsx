import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import WebGLBoundary, { WebGLFallback } from './WebGLBoundary'

function Boom(): never {
  throw new Error('WebGL context could not be created')
}

describe('WebGLBoundary', () => {
  it('renders the 3D scene when it does not throw', () => {
    render(
      <WebGLBoundary fallback={<div>fallback</div>}>
        <div>scene</div>
      </WebGLBoundary>,
    )
    expect(screen.getByText('scene')).toBeTruthy()
    expect(screen.queryByText('fallback')).toBeNull()
  })

  it('degrades to the fallback instead of crashing the page', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      render(
        <WebGLBoundary fallback={<WebGLFallback message="3D no disponible" />}>
          <Boom />
        </WebGLBoundary>,
      )
      expect(screen.getByText('3D no disponible')).toBeTruthy()
    } finally {
      consoleError.mockRestore()
      consoleWarn.mockRestore()
    }
  })
})
