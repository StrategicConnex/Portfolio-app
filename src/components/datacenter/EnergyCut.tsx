'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ALL_SECTIONS, computeSceneProgress, resolveSceneForSection } from '@/lib/scenes'
import { useSectionProgress } from '@/hooks/useSectionProgress'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import { failoverEvent } from '@/lib/datacenter.storyline'

/**
 * P5 — HERO MOMENT S4: CORTE DE ENERGÍA.
 *
 * Durante la ventana "dead" del failover (P7a), la iluminación ambiental de
 * la escena cae dramáticamente — como un corte de energía real en el datacenter.
 * El mundo se oscurece casi por completo (ambient → 0.03), los racks se vuelven
 * siluetas, y solo los LEDs de emergencia (backup units) quedan encendidos.
 *
 * Cuando la ruta B toma el control, la luz se recupera gradualmente pero con
 * una temperatura diferente (más ámbar/cálida) — el failover ya ocurrió y el
 * entorno cambió.
 *
 * Implementación: muta la intensidad de una AmbientLight compartida vía ref.
 * 0 draw calls extra (solo una light ya existente), determinístico por scroll
 * (reversible), sin allocations por frame (SPEC §32).
 *
 * reduced-motion: sin oscurecimiento (el canvas normalmente no monta en
 * reduced-motion, pero defensivo).
 */
const CUT_AMBIENT_MIN = 0.03 // casi oscura durante dead
const CUT_AMBIENT_RECOVER = 0.18 // recuperación parcial (más baja que normal)
const CUT_COLOR_NORMAL = new THREE.Color('#93a9c7') // azul frío normal
const CUT_COLOR_EMERGENCY = new THREE.Color('#c27a3a') // ámbar emergencia
const LERP_RATE = 4

export default function EnergyCut() {
  const progress = useSectionProgress(ALL_SECTIONS)
  const { reduced } = usePrefersReducedMotion()
  const light = useRef<THREE.AmbientLight>(null)
  const curIntensity = useRef(0.3)
  const curColor = useRef(CUT_COLOR_NORMAL.clone())

  useFrame((_, delta) => {
    const l = light.current
    if (!l || reduced) {
      if (l) l.intensity = 0
      return
    }

    const p = progress.ref.current
    const scene = resolveSceneForSection(p.active)
    if (!scene || scene.id !== 'resilience') {
      // Fuera de S4: light off (SceneLighting controla el ambient normal).
      l.intensity = 0
      return
    }

    const sp = computeSceneProgress(scene, p.active, p.section)
    const ev = failoverEvent(sp)

    // Target de intensidad y color según el estado del failover.
    let targetIntensity: number
    let targetColor: THREE.Color

    switch (ev.primary) {
      case 'dead':
        // Corte total: casi oscura, color ámbar de emergencia.
        targetIntensity = CUT_AMBIENT_MIN
        targetColor = CUT_COLOR_EMERGENCY
        break
      case 'fault':
        // Degradación: oscurece levemente.
        targetIntensity = 0.15
        targetColor = new THREE.Color('#7f8a9e') // más frío y tenso
        break
      case 'recover':
        // Recuperación: se aclara pero con temperatura ámbar.
        targetIntensity = CUT_AMBIENT_RECOVER
        targetColor = CUT_COLOR_EMERGENCY
        break
      default:
        // Normal: light off (SceneLighting controla).
        l.intensity = 0
        return
    }

    // Suavizado (SPEC §16 — nunca cortes bruscos).
    const k = 1 - Math.exp(-LERP_RATE * Math.min(delta, 0.1))
    curIntensity.current += (targetIntensity - curIntensity.current) * k
    curColor.current.lerp(targetColor, k)

    l.intensity = curIntensity.current
    l.color.copy(curColor.current)
  })

  return <ambientLight ref={light} intensity={0} color="#93a9c7" />
}
