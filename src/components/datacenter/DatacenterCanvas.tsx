'use client'

import { useEffect, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import type { QualityProfile } from '@/hooks/useAdaptiveQuality'
import { registerContext, useWebGLContextManager } from '@/hooks/useWebGLContextManager'
import { DATACENTER_TOKENS } from '@/lib/datacenter.tokens'
import { SCENES } from '@/lib/scenes'
import DatacenterEnvironment from './DatacenterEnvironment'
import SceneLighting from './SceneLighting'
import DatacenterCamera from './DatacenterCamera'
import DatacenterScene from './DatacenterScene'

const DPR: Record<QualityProfile, [number, number]> = {
  ULTRA: [1, 2],
  HIGH: [1, 1.5],
  MEDIUM: [1, 1.25],
  LOW: [1, 1],
  STATIC: [1, 1],
}

/**
 * DatacenterCanvas — capa Z-20, decorativa (SPEC §2):
 * fijo, `aria-hidden`, `pointer-events: none`, `frameloop="demand"`.
 * Fase 1: escena vacía (color + fog); la geometría llega en Fases 3–4.
 */
export default function DatacenterCanvas({ profile }: { profile: QualityProfile }) {
  const { setSuspended, reportContextLost, resetContextLost } = useWebGLContextManager()
  const fogRef = useRef<THREE.Fog>(null)

  useEffect(() => {
    const unregister = registerContext()
    return () => {
      unregister()
      setSuspended(false)
    }
  }, [setSuspended])

  if (profile === 'STATIC') return null

  const entry = SCENES[0].camera.entry

  return (
    <div
      aria-hidden="true"
      data-testid="datacenter-canvas"
      style={{ position: 'fixed', inset: 0, zIndex: 20, pointerEvents: 'none' }}
    >
      <Canvas
        dpr={DPR[profile]}
        frameloop="demand"
        camera={{ position: entry.position, fov: entry.fov }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.domElement.addEventListener('webglcontextlost', (e) => {
            e.preventDefault()
            reportContextLost()
          })
          gl.domElement.addEventListener('webglcontextrestored', () => {
            resetContextLost()
          })
        }}
      >
        <color attach="background" args={[DATACENTER_TOKENS.colors.bg]} />
        <fog
          ref={fogRef}
          attach="fog"
          args={[DATACENTER_TOKENS.colors.bg, DATACENTER_TOKENS.fog.near, DATACENTER_TOKENS.fog.far]}
        />
        <DatacenterEnvironment />
        <SceneLighting />
        <DatacenterScene profile={profile} />
        <DatacenterCamera fogRef={fogRef} />
      </Canvas>
    </div>
  )
}
