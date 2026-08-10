import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import StaticPoster from './StaticPoster'

describe('StaticPoster', () => {
  it('renders a decorative aria-hidden container', () => {
    const { container } = render(<StaticPoster />)
    const el = container.querySelector('[aria-hidden="true"]')
    expect(el).toBeDefined()
  })

  it('renders system telemetry text', () => {
    const { container } = render(<StaticPoster />)
    expect(container.textContent).toContain('SYS IDLE')
  })
})
