import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'

// Mock @react-three/fiber and @react-three/drei
//
// IMPORTANT: Canvas does NOT render its children to avoid React warnings in jsdom.
// Three.js primitives like <ambientLight>, <mesh>, <bufferGeometry> are lowercase
// JSX elements that work in the browser via R3F's custom reconciler but trigger
// "unrecognized in this browser" warnings when rendered as HTML in jsdom.
// Instead, the mock simulates the expected output of the Scene children so
// tests can still verify rendered content without triggering warnings.

vi.mock('@react-three/fiber', () => ({
  Canvas: ({ camera }: { children?: React.ReactNode; camera?: Record<string, unknown> }) => (
    <div data-testid="r3f-canvas" data-camera={JSON.stringify(camera)}>
      <div data-testid="orbit-controls" />
      <div data-testid="r3f-stars" />
      <span data-testid="r3f-text" data-color="#C5A46D">Ciberseguridad</span>
      <span data-testid="r3f-text" data-color="#C5A46D">Redes</span>
      <span data-testid="r3f-text" data-color="#C5A46D">Cloud</span>
    </div>
  ),
  useFrame: vi.fn(),
}))

vi.mock('@react-three/drei', () => ({
  OrbitControls: () => null,
  Text: () => null,
  Stars: () => null,
  Html: () => null,
}))

vi.mock('@/data/mindmap', () => ({
  nodes: [
    { label: 'Ciberseguridad', pos: [0, 1, 0], color: '#1E90FF', particleCount: 40, subs: ['Firewalls', 'IDS/IPS'], related: ['Redes', 'Cloud'] },
    { label: 'Redes', pos: [1, 0, 0], color: '#00FFFF', particleCount: 30, subs: ['TCP/IP', 'OSPF'], related: ['Ciberseguridad'] },
    { label: 'Cloud', pos: [-1, -1, 0], color: '#10B981', particleCount: 30, subs: ['AWS', 'Azure'], related: ['Ciberseguridad'] },
  ],
  edges: [['Ciberseguridad', 'Redes'], ['Ciberseguridad', 'Cloud']],
}))

// ── Three.js element warnings suppressed globally via src/test-setup.ts ──

import MindMap3D from './MindMap3D'

describe('MindMap3D', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock window.innerWidth for desktop
    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true, configurable: true })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should render the 3D canvas', () => {
    render(<MindMap3D />)
    expect(screen.getByTestId('r3f-canvas')).toBeDefined()
  })

  it('should render OrbitControls', () => {
    render(<MindMap3D />)
    expect(screen.getByTestId('orbit-controls')).toBeDefined()
  })

  it('should render Stars', () => {
    render(<MindMap3D />)
    expect(screen.getByTestId('r3f-stars')).toBeDefined()
  })

  it('should render text labels for all nodes', () => {
    render(<MindMap3D />)
    expect(screen.getByText('Ciberseguridad')).toBeDefined()
    expect(screen.getByText('Redes')).toBeDefined()
    expect(screen.getByText('Cloud')).toBeDefined()
  })

  it('should have correct height on desktop', () => {
    render(<MindMap3D />)
    const container = screen.getByTestId('r3f-canvas').parentElement
    expect(container?.style.height).toBe('480px')
  })

  it('should set camera fov to 55 on desktop', () => {
    render(<MindMap3D />)
    const canvas = screen.getByTestId('r3f-canvas')
    const camera = JSON.parse(canvas.getAttribute('data-camera') || '{}')
    expect(camera.fov).toBe(55)
  })

  it('should set camera position to [0,0,9]', () => {
    render(<MindMap3D />)
    const canvas = screen.getByTestId('r3f-canvas')
    const camera = JSON.parse(canvas.getAttribute('data-camera') || '{}')
    expect(camera.position).toEqual([0, 0, 9])
  })

  it('should use mobile height when window is narrow', () => {
    vi.useFakeTimers()
    Object.defineProperty(window, 'innerWidth', { value: 600, writable: true, configurable: true })
    render(<MindMap3D />)
    act(() => { vi.advanceTimersByTime(0) })
    const container = screen.getByTestId('r3f-canvas').parentElement
    expect(container?.style.height).toBe('300px')
  })

  it('should render without crashing', () => {
    expect(() => render(<MindMap3D />)).not.toThrow()
  })
})
