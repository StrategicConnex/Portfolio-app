'use client'

import { Component, type ReactNode } from 'react'

type Props = { children: ReactNode }
type State = { hasError: boolean }

/**
 * Aísla el 3D: un error de Three.js nunca debe tumbar el portfolio (SPEC §26).
 * Fallback ⇒ desmontar el canvas: StaticPoster (capa base Z-10) ya está
 * siempre en el HTML inicial (page.tsx), así que queda visible sin duplicarlo.
 */
export default class DatacenterErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: unknown) {
    // Solo logging defensivo; el error no se propaga a la app
    console.error('[datacenter] 3D scene error, falling back to poster:', error)
  }

  render() {
    // El póster base (Z-10) ya está en el DOM; solo hay que retirar el canvas roto
    if (this.state.hasError) return null
    return this.props.children
  }
}
