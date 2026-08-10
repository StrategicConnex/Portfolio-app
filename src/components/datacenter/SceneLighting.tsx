'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { getActiveScene } from '@/lib/activeScene'
import { DATACENTER_TOKENS } from '@/lib/datacenter.tokens'

/**
 * Atmósfera de luz por escena (SPEC §3: "los cambios de escena son transiciones
 * atmosféricas (niebla, luz)"). Lee la escena activa del store (sin estado
 * React en el frame loop — SPEC §22) y lerp las intensidades hacia los targets
 * de la escena. Semántica: frío = infraestructura, ámbar = resiliencia,
 * cyan = flujos de datos, S5 = luces sincronizadas (clímax luminoso).
 */
type LightTargets = {
  ambient: number
  dir: number
  cyan: number
  amber: number
  warmLow: number
  reveal: number
}

const TARGETS: LightTargets[] = [
  // S1 boot — frío, anticipación, acentos mínimos
  { ambient: 0.3, dir: 0.95, cyan: 0.45, amber: 0.06, warmLow: 0, reveal: 0 },
  // S2 arch — orden neutro frío, acentos sutiles
  { ambient: 0.38, dir: 1.1, cyan: 0.6, amber: 0.2, warmLow: 0, reveal: 0 },
  // S3 data — cyan dominante (flujos activos)
  { ambient: 0.4, dir: 1.2, cyan: 1.15, amber: 0.15, warmLow: 0, reveal: 0 },
  // S4 resil — ámbar cálido (backup/redundancia, nivel inferior)
  { ambient: 0.42, dir: 1.0, cyan: 0.3, amber: 0.95, warmLow: 1.15, reveal: 0 },
  // S5 conn — luces sincronizadas + luz de revelado frontal (clímax luminoso)
  { ambient: 0.72, dir: 2.0, cyan: 1.0, amber: 0.45, warmLow: 0.5, reveal: 3.0 },
]

const LAMBDA = 3.0

export default function SceneLighting() {
  const t = DATACENTER_TOKENS.colors
  const ambient = useRef<THREE.AmbientLight>(null)
  const dir = useRef<THREE.DirectionalLight>(null)
  const cyan = useRef<THREE.PointLight>(null)
  const amber = useRef<THREE.PointLight>(null)
  const warmLow = useRef<THREE.PointLight>(null)
  const reveal = useRef<THREE.PointLight>(null)
  const current = useRef({ ambient: 0.3, dir: 0.95, cyan: 0.45, amber: 0.06, warmLow: 0, reveal: 0 })

  useFrame((_, delta) => {
    const target = TARGETS[getActiveScene()] ?? TARGETS[0]
    const c = current.current
    const k = 1 - Math.exp(-LAMBDA * Math.min(delta, 0.1))

    c.ambient += (target.ambient - c.ambient) * k
    c.dir += (target.dir - c.dir) * k
    c.cyan += (target.cyan - c.cyan) * k
    c.amber += (target.amber - c.amber) * k
    c.warmLow += (target.warmLow - c.warmLow) * k
    c.reveal += (target.reveal - c.reveal) * k

    if (ambient.current) ambient.current.intensity = c.ambient
    if (dir.current) dir.current.intensity = c.dir
    if (cyan.current) cyan.current.intensity = c.cyan
    if (amber.current) amber.current.intensity = c.amber
    if (warmLow.current) warmLow.current.intensity = c.warmLow
    if (reveal.current) reveal.current.intensity = c.reveal
  })

  return (
    <>
      <ambientLight ref={ambient} intensity={0.3} color="#93a9c7" />
      <directionalLight ref={dir} position={[4, 8, 6]} intensity={0.95} color="#c3d6f7" />
      {/* decay=1 (lineal): el falloff físico (decay 2) anula los acentos a
          distancia >5u (1.7/16² ≈ 0.006) — nunca llegaban a la escena. */}
      {/* Acento cyan — flujos de datos (Escena 3) */}
      <pointLight ref={cyan} position={[6, -1, -3]} intensity={0.45} color={t.dataCyan} decay={1} />
      {/* Acento ámbar — resiliencia (Escena 4) */}
      <pointLight ref={amber} position={[0, 4, 2]} intensity={0.06} color={t.securityAmber} decay={1} />
      {/* Luz cálida baja — ilumina las unidades de backup en el nivel inferior */}
      <pointLight ref={warmLow} position={[0, -2.3, -5]} intensity={0} color={t.securityAmber} decay={1} />
      {/* Luz de revelado del clímax (S5): frontal, ilumina las caras del corredor */}
      <pointLight ref={reveal} position={[0, 4, 8]} intensity={0} color={t.primaryCold} decay={1} />
    </>
  )
}
