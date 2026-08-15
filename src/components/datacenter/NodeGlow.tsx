'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ALL_SECTIONS, SCENES, computeSceneProgress, resolveSceneForSection } from '@/lib/scenes'
import { useSectionProgress } from '@/hooks/useSectionProgress'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import { connectionBeamStrength, PHOTON_NODE_GLOBAL, photonGlobalProgress } from '@/lib/datacenter.storyline'
import { getGlowTexture, pointGeometry } from './glowTexture'

/**
 * P5 — HERO MOMENT S5: NODE GLOW (brillo del nodo central).
 *
 * Un punto de luz intensa en el nodo central (origen del beam) que se enciende
 * cuando el fotón llega y el haz se activa. Simula el momento en que el
 * datacenter "se conecta" con el mundo exterior — un flash de champagne que
 * pulsa y luego se estabiliza como el "corazón" del clúster.
 *
 * 1 draw call (Points con glow texture), determinístico por scroll,
 * sin allocations por frame (SPEC §32). reduced-motion → glow estático.
 */
const BASE_SIZE = 0.6
const PEAK_SIZE = 1.8
const PULSE_FREQ = 2.5
const GLOW_COLOR = '#E8D5AC' // champagne — misma identidad que el beam

export default function NodeGlow() {
  const progress = useSectionProgress(ALL_SECTIONS)
  const { reduced } = usePrefersReducedMotion()
  const glow = useMemo(() => getGlowTexture(), [])
  const geo = useMemo(() => pointGeometry(1), [])
  const pointsRef = useRef<THREE.Points>(null)
  const mat = useRef<THREE.PointsMaterial>(null)
  const curOpacity = useRef(0)
  const curSize = useRef(BASE_SIZE)

  useFrame((state, delta) => {
    const p = pointsRef.current
    const m = mat.current
    if (!p || !m) return

    const prog = progress.ref.current
    const scene = resolveSceneForSection(prog.active)
    const sceneIndex = scene ? SCENES.indexOf(scene) : -1

    // Progreso global del fotón — el glow se enciende cuando el fotón llega.
    const sp = scene ? computeSceneProgress(scene, prog.active, prog.section) : 0
    const global = reduced ? PHOTON_NODE_GLOBAL : photonGlobalProgress(sceneIndex, sp)
    const beamStr = reduced ? 1 : connectionBeamStrength(global)

    // El glow se activa cuando el beam está encendido (llegada del fotón).
    const isS5 = scene?.id === 'connection'
    const targetOpacity = isS5 ? Math.min(1, beamStr * 1.4) : 0

    // Pulse sutil cuando el beam está activo.
    const pulse = beamStr > 0.5
      ? 1 + 0.15 * Math.sin(state.clock.elapsedTime * PULSE_FREQ) * beamStr
      : 1

    // Suavizado (SPEC §16).
    const k = 1 - Math.exp(-4 * Math.min(delta, 0.1))
    curOpacity.current += (targetOpacity - curOpacity.current) * k
    const targetSize = BASE_SIZE + (PEAK_SIZE - BASE_SIZE) * beamStr
    curSize.current += (targetSize * pulse - curSize.current) * k

    m.opacity = curOpacity.current
    m.size = curSize.current
  })

  return (
    <points ref={pointsRef} geometry={geo} position={[0, 2.0, -1.85]} frustumCulled={false}>
      <pointsMaterial
        ref={mat}
        map={glow}
        size={BASE_SIZE}
        color={GLOW_COLOR}
        transparent
        opacity={0}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}
