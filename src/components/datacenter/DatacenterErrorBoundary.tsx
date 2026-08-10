'use client'

import { Component, type ReactNode } from 'react'
import StaticPoster from './StaticPoster'

type Props = { children: ReactNode }
type State = { hasError: boolean }

/**
 * Aísla el 3D: un error de Three.js nunca debe tumbar el portfolio (SPEC §26).
 * Fallback ⇒ StaticPoster.
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
    if (this.state.hasError) return <StaticPoster />
    return this.props.children
  }
}
