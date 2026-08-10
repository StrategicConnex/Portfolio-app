'use client'

import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { ALL_SECTIONS, SCENES, resolveSceneForSection } from '@/lib/scenes'
import { DATACENTER_TOKENS } from '@/lib/datacenter.tokens'
import { useSectionProgress } from '@/hooks/useSectionProgress'
import { useDatacenterCamera } from '@/hooks/useDatacenterCamera'
import { setActiveScene } from '@/lib/activeScene'

const { settleMs } = DATACENTER_TOKENS.camera

/**
 * Controlador de cámara dentro del Canvas (SPEC §6, §10):
 * - `frameloop="demand"`: el scroll invalida el frame; durante la ventana de
 *   settle (650 ms tras el último scroll) se sigue invalidando para que el
 *   easing termine suavemente; después GPU idle.
 * - reduced-motion no aplica aquí: con reduce el canvas no se monta (poster).
 */
export default function DatacenterCamera({ fogRef }: { fogRef: React.RefObject<THREE.Fog | null> }) {
  const progress = useSectionProgress(ALL_SECTIONS)
  const { update } = useDatacenterCamera(SCENES, progress)
  const invalidate = useThree((s) => s.invalidate)
  const settleUntil = useRef(0)

  useEffect(() => {
    const onScroll = () => {
      settleUntil.current = performance.now() + settleMs
      invalidate()
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [invalidate])

  // frameloop="demand": al cruzar de sección el estado React cambia pero no
  // se programa un frame; invalidar aquí publica la escena nueva al HUD.
  useEffect(() => {
    if (progress.active >= 0) invalidate()
  }, [progress.active, invalidate])

  useFrame((state, delta) => {
    update(state, delta, fogRef)
    // HUD (SPEC §13): publica la escena activa — idempotente, sin re-renders si no cambia.
    const scene = resolveSceneForSection(progress.ref.current.active)
    if (scene) setActiveScene(SCENES.indexOf(scene))
    if (performance.now() < settleUntil.current) invalidate()
  })

  return null
}
