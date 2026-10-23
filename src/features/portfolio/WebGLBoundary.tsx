'use client'

import { Component, type ReactNode } from 'react'

interface WebGLBoundaryProps {
  children: ReactNode
  /** Rendered when the 3D scene throws (no WebGL context, driver loss, …). */
  fallback: ReactNode
}

interface WebGLBoundaryState {
  failed: boolean
}

/**
 * Local error boundary for WebGL/three scenes.
 *
 * A failing `THREE.WebGLRenderer` (headless browsers, GPUs without WebGL,
 * context loss) throws during render. Without a local boundary that error
 * escalates to the root `app/error.tsx` and replaces the whole page, so the
 * map must degrade alone: the rest of the site keeps working.
 */
export default class WebGLBoundary extends Component<WebGLBoundaryProps, WebGLBoundaryState> {
  state: WebGLBoundaryState = { failed: false }

  static getDerivedStateFromError(): WebGLBoundaryState {
    return { failed: true }
  }

  componentDidCatch(error: unknown) {
    console.warn('[WebGLBoundary] 3D scene disabled:', error)
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

/** Accessible placeholder shown when the 3D scene is unavailable. */
export function WebGLFallback({ message }: { message: string }) {
  return (
    <div
      role="status"
      className="flex h-[320px] w-full flex-col items-center justify-center gap-2 rounded-xl border border-blue-500/30 bg-black/70 px-6 text-center"
    >
      <span aria-hidden="true" className="text-2xl">
        🌐
      </span>
      <p className="max-w-md text-sm text-gray-300">{message}</p>
    </div>
  )
}

/**
 * Cheap WebGL probe run on the client before mounting the three.js canvas.
 * Returns false on browsers/devices without a usable context (headless CI,
 * GPUs on a blocklist, hardware acceleration disabled), so the map degrades
 * without ever creating a renderer or logging three.js errors.
 */
export function hasWebGLSupport(): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return false
  }
  try {
    const canvas = document.createElement('canvas')
    const gl =
      (canvas.getContext('webgl2') as WebGL2RenderingContext | null) ??
      (canvas.getContext('webgl') as WebGLRenderingContext | null)
    if (!gl) return false
    // Release the probe context so it does not consume one of the browser's
    // limited WebGL slots.
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    return true
  } catch {
    return false
  }
}
