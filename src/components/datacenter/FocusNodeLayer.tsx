'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useFocusSection } from '@/lib/focusNode'
import { getFocusNodeForSection } from '@/lib/datacenter.focus'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import HudLabel from './HudLabel'

/**
 * Nodo focal (audit CREATIVE-AUDIT §5, gap G2): la sección activa del DOM se
 * ilumina con una baliza en su ancla 3D (`FOCUS_NODES`). El DOM publica la
 * sección vía `focusNode` store; este layer la OBSERVA (nunca la controla).
 *
 * Patrón visual idéntico al `CopilotNode` (core + halo + ring), pero con
 * fade-in al cambiar de sección — sin viajes de cámara (restraint, SPEC §3).
 * El pulso lo invalida `MicroAnimDriver`; con reduced-motion la baliza queda
 * estática (defensivo: el canvas normalmente no monta en modo reduce).
 */
export default function FocusNodeLayer() {
  const sectionId = useFocusSection()
  const { reduced } = usePrefersReducedMotion()
  const config = sectionId ? getFocusNodeForSection(sectionId) : null
  const core = useRef<THREE.Mesh>(null)
  const halo = useRef<THREE.Mesh>(null)
  const ring = useRef<THREE.Mesh>(null)
  const fade = useRef(0) // 0 → 1 en ~400ms al montar (cambio de sección = re-mount por key)
  const time = useRef(0)

  useFrame((_, delta) => {
    time.current += delta
    // reduced → estático: sin fade progresivo ni pulso
    fade.current = reduced ? 1 : Math.min(1, fade.current + delta / 0.4)
    const t = time.current
    const pulse = reduced ? 1 : 1 + 0.12 * Math.sin(t * 2.4)
    const haloPulse = reduced ? 1 : 1 + 0.2 * Math.sin(t * 1.4)
    const ringPulse = reduced ? 1 : 1 + 0.08 * Math.sin(t * 1.1)

    if (core.current) core.current.scale.setScalar(Math.max(0.001, fade.current * pulse))
    if (halo.current) halo.current.scale.setScalar(Math.max(0.001, fade.current * haloPulse))
    if (ring.current) {
      ;(ring.current.material as THREE.MeshBasicMaterial).opacity = 0.45 * fade.current
      ring.current.scale.setScalar(Math.max(0.001, fade.current * ringPulse))
    }
  })

  if (!config) return null

  return (
    <group key={config.sectionId} position={config.position}>
      <mesh ref={core}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshBasicMaterial color={config.color} transparent opacity={0.95} />
      </mesh>
      <mesh ref={halo}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshBasicMaterial color={config.color} transparent opacity={0.2} depthWrite={false} />
      </mesh>
      <mesh ref={ring}>
        <torusGeometry args={[0.42, 0.015, 8, 40]} />
        <meshBasicMaterial color={config.color} transparent opacity={0.4} depthWrite={false} />
      </mesh>
      <HudLabel position={[0, -0.55, 0]} labelKey={config.labelKey} scene={config.sceneIndex} variant="node" color={config.color} distanceFactor={10} />
    </group>
  )
}
