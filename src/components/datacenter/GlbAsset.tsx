'use client'

import { Component, Suspense, useEffect, useMemo, useState, type ReactNode } from 'react'
import GlbMesh from './GlbMesh'

/**
 * GlbAsset — slot de asset GLB resiliente (SPEC §37 + ASSET-PIPELINE.md §7).
 *
 * Contrato de fallback (nunca llega al `DatacenterErrorBoundary` global, que
 * desmontaría todo el canvas → StaticPoster):
 *
 * - `path` null → renderiza `fallback` (geometría procedural) sin requests.
 * - Pre-chequeo HEAD: un GLB ausente (404) o la red caída caen a `fallback`
 *   sin suspender ni lanzar.
 * - Durante la carga (Suspense) se muestra `fallback`: progresivo — el GLB
 *   reemplaza al procedural cuando está listo (SPEC §37 "sustituto procedural").
 * - GLB corrupto (HEAD ok, parse falla): lo captura el boundary LOCAL y cae a
 *   `fallback` con un console.warn defensivo.
 *
 * Debug (verificación runtime §37, inerte sin el parámetro):
 * `?dc-glb=<nombre>` (con o sin `.glb`) fuerza el path `/assets/3d/<nombre>.glb`.
 */
export default function GlbAsset({
  path,
  fallback,
  position,
  scale,
}: {
  path?: string | null
  fallback: ReactNode
  /** Posición del GLB en la escena (el fallback procedural se posiciona solo). */
  position?: [number, number, number]
  /** Escala del GLB para acoplarlo al slot (p. ej. storage en BackupUnits). */
  scale?: [number, number, number]
}) {
  const resolved = useMemo(() => resolveGlbPath(path), [path])
  const [available, setAvailable] = useState<boolean | null>(null)

  useEffect(() => {
    if (!resolved) return
    let cancelled = false
    fetch(resolved, { method: 'HEAD', cache: 'no-store' })
      .then((r) => {
        if (!cancelled) setAvailable(r.ok)
      })
      .catch(() => {
        if (!cancelled) setAvailable(false)
      })
    return () => {
      cancelled = true
    }
  }, [resolved])

  // Sin GLB configurado, comprobando o ausente → procedural siempre visible
  if (!resolved || available !== true) return <>{fallback}</>

  return (
    <AssetFallbackBoundary fallback={fallback}>
      <Suspense fallback={<>{fallback}</>}>
        <group position={position} scale={scale}>
          <GlbMesh path={resolved} />
        </group>
      </Suspense>
    </AssetFallbackBoundary>
  )
}

/** Resuelve la ruta final: path explícito > param debug `?dc-glb=` > null. */
export function resolveGlbPath(path?: string | null): string | null {
  if (path) return path
  if (typeof window === 'undefined') return null
  const p = new URLSearchParams(window.location.search).get('dc-glb')
  if (!p) return null
  return p.endsWith('.glb') ? `/assets/3d/${p}` : `/assets/3d/${p}.glb`
}

type BoundaryProps = { children: ReactNode; fallback: ReactNode }
type BoundaryState = { hasError: boolean }

/** Boundary LOCAL de asset (SPEC §37): un GLB roto cae a su fallback procedural
 * sin tocar el `DatacenterErrorBoundary` global (que desmontaría el canvas). */
export class AssetFallbackBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { hasError: false }

  static getDerivedStateFromError(): BoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: unknown) {
    console.warn('[datacenter] GLB fallback to procedural:', error)
  }

  render() {
    if (this.state.hasError) return <>{this.props.fallback}</>
    return this.props.children
  }
}
