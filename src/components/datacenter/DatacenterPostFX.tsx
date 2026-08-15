'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { EffectComposer, DepthOfField, Bloom } from '@react-three/postprocessing'
import { getActiveScene } from '@/lib/activeScene'

/**
 * Post-processing (P0 audit):
 * - DepthOfField: focus distance cambia por escena (rack hero nítido, fondo difuso).
 * - Bloom: luminanceThreshold alto (0.65) — solo los LEDs y elementos emissive
 *   brillan. Intensity baja (0.35) para no quemar.
 *
 * frameloop="demand": los effects solo se procesan cuando hay scroll invalidation.
 * En reduced-motion el canvas no se monta (StaticPoster), así que no aplica.
 */

/** Focus distance por escena: S1=2.5 (rack hero), S2=4, S3=3, S4=5 (backup), S5=6 */
const FOCUS_BY_SCENE = [2.5, 4.0, 3.0, 5.0, 6.0]
const LAMBDA = 2.5

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function DatacenterPostFX() {
  const dofRef = useRef<any>(null)
  const currentFocus = useRef(3.0)

  useFrame((_, delta) => {
    const scene = getActiveScene()
    const target = FOCUS_BY_SCENE[scene] ?? 3.0
    const k = 1 - Math.exp(-LAMBDA * Math.min(delta, 0.1))
    currentFocus.current += (target - currentFocus.current) * k

    // focusDistance is a runtime setter on DepthOfFieldEffect but not in TS declarations
    if (dofRef.current) {
      dofRef.current.focusDistance = currentFocus.current
    }
  })

  return (
    <EffectComposer multisampling={0}>
      {/* DOF: focus distance driven by scene, subtle blur */}
      <DepthOfField
        ref={dofRef}
        focusDistance={3.0}
        focalLength={0.05}
        bokehScale={2}
        height={480}
      />
      {/* Bloom: only bright emissive elements (LEDs, DataRings, vent tiles) */}
      <Bloom
        luminanceThreshold={0.65}
        luminanceSmoothing={0.9}
        intensity={0.35}
        mipmapBlur
      />
    </EffectComposer>
  )
}
/* eslint-enable @typescript-eslint/no-explicit-any */
