'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useCopilotVisualState, type CopilotVisualStatus } from '@/lib/copilotVisual'
import { DATACENTER_TOKENS } from '@/lib/datacenter.tokens'

/**
 * AI Node (Fase 7 — event bus visual): el 3D OBSERVA el estado del Copilot y
 * reacciona con color + pulso. Nunca controla su lógica (CONSTITUTION R4).
 *  - idle      → cian, respiración lenta
 *  - thinking  → azul, pulso medio
 *  - streaming → cian brillante, anillo expansivo
 *  - error     → rojo warning (semántica RED)
 *  - complete  → dorado (semántica GOLD / AI core)
 * Animado por MicroAnimDriver (invalidación híbrida): GPU idle en reposo.
 */
const COLORS: Record<CopilotVisualStatus, string> = {
  idle: DATACENTER_TOKENS.colors.dataCyan,
  thinking: DATACENTER_TOKENS.colors.primaryCold,
  streaming: DATACENTER_TOKENS.colors.dataCyan,
  error: DATACENTER_TOKENS.colors.warningRed,
  complete: DATACENTER_TOKENS.colors.gold,
}

const PULSE_SPEED: Record<CopilotVisualStatus, number> = {
  idle: 1.2,
  thinking: 2.2,
  streaming: 3.4,
  error: 4.5,
  complete: 2.8,
}

export default function CopilotNode() {
  const state = useCopilotVisualState()
  const core = useRef<THREE.Mesh>(null)
  const halo = useRef<THREE.Mesh>(null)
  const ring = useRef<THREE.Mesh>(null)
  const time = useRef(0)

  const color = COLORS[state]
  const speed = PULSE_SPEED[state]

  useFrame((_, delta) => {
    time.current += delta
    const t = time.current
    const pulse = 1 + 0.14 * Math.sin(t * speed)

    if (core.current) core.current.scale.setScalar(pulse)
    if (halo.current) halo.current.scale.setScalar(1 + 0.22 * Math.sin(t * speed * 0.6))

    if (ring.current) {
      const mat = ring.current.material as THREE.MeshBasicMaterial
      if (state === 'streaming') {
        // Anillo expansivo continuo durante streaming
        const cycle = (t * 1.1) % 1
        ring.current.scale.setScalar(1 + cycle * 1.4)
        mat.opacity = 0.55 * (1 - cycle)
        ring.current.rotation.z = t * 0.6
      } else {
        ring.current.scale.setScalar(1 + 0.08 * Math.sin(t * speed * 0.5))
        mat.opacity = 0.35 + 0.15 * Math.sin(t * speed * 0.5)
      }
    }
  })

  return (
    <group position={[0, 3.05, -2.4]}>
      <mesh ref={core}>
        <sphereGeometry args={[0.16, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.95} />
      </mesh>
      <mesh ref={halo}>
        <sphereGeometry args={[0.26, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.22} depthWrite={false} />
      </mesh>
      <mesh ref={ring}>
        <torusGeometry args={[0.55, 0.018, 8, 40]} />
        <meshBasicMaterial color={color} transparent opacity={0.45} depthWrite={false} />
      </mesh>
    </group>
  )
}
