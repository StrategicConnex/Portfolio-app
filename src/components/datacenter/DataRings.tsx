'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useActiveScene } from '@/lib/activeScene'
import { buildEmbodiedMetrics, type EmbodiedMetric } from '@/lib/datacenterData'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import HudLabel from './HudLabel'

/**
 * Datos encarnados (audit CREATIVE-AUDIT §5, gap G3 — estilo Mastercard):
 * anillos de progreso holográficos alimentados por los datos REALES de
 * `src/data/` (ver `datacenterData.ts`). Cada anillo es un arco de toro cuya
 * apertura (0→2π) es proporcional al valor de la métrica; el contador (value)
 * y el label i18n van en un HudLabel.
 *
 * Solo los anillos de la escena activa se montan (useActiveScene, store).
 * Pulso suave invalidado por MicroAnimDriver; estático con reduced-motion.
 * El arco completo (fondo tenue) + arco de progreso = 2 meshes por anillo;
 * 13 métricas → ~26 draw calls adicionales en el peor caso, pero solo se
 * montan los de la escena activa (S2=4, S3=8, S4=1 → máx. 8 visibles).
 */
function MetricRing({ metric }: { metric: EmbodiedMetric }) {
  const { reduced } = usePrefersReducedMotion()
  const pulse = useRef(0)
  const baseMat = useRef<THREE.MeshBasicMaterial>(null)
  const arcMat = useRef<THREE.MeshBasicMaterial>(null)

  // Apertura del arco proporcional al valor (0-100 → 0-2π); mínimo visible
  // para valores pequeños (un anillo vacío de 2% aún se lee como presencia).
  const arc = useMemo(() => {
    const frac = Math.max(0.02, Math.min(1, metric.value / 100))
    return frac * Math.PI * 2
  }, [metric.value])

  useFrame((_, delta) => {
    pulse.current = reduced ? 1 : Math.min(1, pulse.current + delta / 0.6)
    if (baseMat.current) baseMat.current.opacity = 0.14 * pulse.current
    if (arcMat.current) arcMat.current.opacity = 0.8 * pulse.current
  })

  const radius = metric.radius ?? 0.55

  return (
    <group position={metric.position}>
      {/* Fondo del anillo: arco completo tenue */}
      <mesh>
        <torusGeometry args={[radius, 0.025, 8, 48, Math.PI * 2]} />
        <meshBasicMaterial ref={baseMat} color={metric.color} transparent opacity={0.14} depthWrite={false} />
      </mesh>
      {/* Progreso: arco proporcional al valor */}
      <mesh rotation={[0, 0, -Math.PI / 2]}>
        <torusGeometry args={[radius, 0.045, 8, 48, arc]} />
        <meshBasicMaterial ref={arcMat} color={metric.color} transparent opacity={0.8} depthWrite={false} />
      </mesh>
      <HudLabel
        position={[0, 0, 0.15]}
        labelKey={metric.labelKey}
        scene={metric.scene}
        variant="node"
        color={metric.color}
        distanceFactor={9}
        value={metric.display}
        countUp
      />
    </group>
  )
}

export default function DataRings() {
  const activeScene = useActiveScene()
  const metrics = useMemo(() => buildEmbodiedMetrics(), [])
  const visible = useMemo(() => metrics.filter((m) => m.scene === activeScene), [metrics, activeScene])

  return (
    <>
      {visible.map((m) => (
        <MetricRing key={m.id} metric={m} />
      ))}
    </>
  )
}
