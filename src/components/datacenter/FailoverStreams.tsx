'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ALL_SECTIONS, computeSceneProgress, resolveSceneForSection } from '@/lib/scenes'
import { samplePath } from '@/lib/datacenter.layout'
import { failoverEvent, type FailoverState } from '@/lib/datacenter.storyline'
import { useSectionProgress } from '@/hooks/useSectionProgress'
import { useActiveScene } from '@/lib/activeScene'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'

const PER_PATH = 40
const LERP_RATE = 6 // suavizado del evento (SPEC §16 — nunca cortes bruscos)

const CYAN = new THREE.Color('#22d3ee')
const AMBER = new THREE.Color('#f59e0b')
const FAULT_DARK = new THREE.Color('#7f1d1d')

/**
 * Failover de resiliencia (audit P7a — semántica de red real): dos rutas
 * gemelas sobre la fila de storage de S4. A (replicación primaria, fila
 * frontal) y B (respaldo, fila trasera) ejecutan un evento determinístico por
 * progreso de scroll (datacenter.storyline.failoverEvent):
 *   normal → A degrada (ámbar) y B despierta → A muere y B transporta todo
 *   → A se recupera y B vuelve a standby → restaurado.
 * El tráfico (puntos animados como DataStreams) fluye SIEMPRE en ambas rutas;
 * lo que cambia es el material (color + opacidad) que narra el corte y el
 * reroute. Determinístico por scroll (reversible), sin setState (mutación de
 * material en useFrame, SPEC §32), invalidado por MicroAnimDriver. En tier
 * STATIC/LOW no se monta; con reduced-motion no hay evento (defensivo).
 */
type MatTarget = { color: THREE.Color; opacity: number }

const TARGETS: Record<'primary' | 'backup', Record<FailoverState, MatTarget>> = {
  primary: {
    normal: { color: CYAN, opacity: 0.9 },
    fault: { color: AMBER, opacity: 0.45 },
    dead: { color: FAULT_DARK, opacity: 0.12 },
    recover: { color: AMBER, opacity: 0.55 },
    restored: { color: CYAN, opacity: 0.9 },
  },
  backup: {
    normal: { color: CYAN, opacity: 0.14 },
    fault: { color: AMBER, opacity: 0.5 },
    dead: { color: CYAN, opacity: 0.9 },
    recover: { color: CYAN, opacity: 0.45 },
    restored: { color: CYAN, opacity: 0.14 },
  },
}

/** Rutas del failover (nivel del storage, y=-1.75 por encima de las unidades
 *  de backup — dentro del encuadre de la cámara S4). */
const ROUTES = {
  primary: [
    [-4.6, -1.75, -3.6],
    [0, -1.75, -4.4],
    [4.6, -1.75, -3.6],
  ] as [number, number, number][],
  backup: [
    [-4.6, -1.75, -6.4],
    [0, -1.75, -7.2],
    [4.6, -1.75, -6.4],
  ] as [number, number, number][],
}

function buildPoints(path: [number, number, number][]) {
  const positions = new Float32Array(PER_PATH * 3)
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  for (let i = 0; i < PER_PATH; i++) {
    const pt = samplePath(path, i / (PER_PATH - 1))
    positions[i * 3] = pt[0]
    positions[i * 3 + 1] = pt[1]
    positions[i * 3 + 2] = pt[2]
  }
  return geo
}

export default function FailoverStreams() {
  const activeScene = useActiveScene()
  const progress = useSectionProgress(ALL_SECTIONS)
  const { reduced } = usePrefersReducedMotion()
  const primaryGeo = useMemo(() => buildPoints(ROUTES.primary), [])
  const backupGeo = useMemo(() => buildPoints(ROUTES.backup), [])
  const primaryRef = useRef<THREE.Points>(null)
  const backupRef = useRef<THREE.Points>(null)
  const primaryMat = useRef<THREE.PointsMaterial>(null)
  const backupMat = useRef<THREE.PointsMaterial>(null)
  // Colores actuales (para lerp sin allocaciones por frame).
  const curColor = useRef({ primary: CYAN.clone(), backup: CYAN.clone() })
  const curOpacity = useRef({ primary: 0.9, backup: 0.14 })

  // Solo en la escena de resiliencia (S4).
  const visible = activeScene === 3
  const staticReduced = reduced ? TARGETS.primary.normal : null

  useFrame((state, delta) => {
    const prim = primaryRef.current
    const back = backupRef.current
    if (!prim || !back) return
    const attrP = prim.geometry.getAttribute('position') as THREE.BufferAttribute
    const attrB = back.geometry.getAttribute('position') as THREE.BufferAttribute
    const posP = attrP.array as Float32Array
    const posB = attrB.array as Float32Array
    const offset = (state.clock.elapsedTime * 1.6) % 1

    // Anima los puntos de ambas rutas (siempre fluyendo).
    for (let i = 0; i < PER_PATH; i++) {
      const tt = (i / (PER_PATH - 1) + offset) % 1
      const a = samplePath(ROUTES.primary, tt)
      const b = samplePath(ROUTES.backup, tt)
      posP[i * 3] = a[0]
      posP[i * 3 + 1] = a[1]
      posP[i * 3 + 2] = a[2]
      posB[i * 3] = b[0]
      posB[i * 3 + 1] = b[1]
      posB[i * 3 + 2] = b[2]
    }
    attrP.needsUpdate = true
    attrB.needsUpdate = true

    // Estado del evento: determinístico por progreso de la escena S4.
    const p = progress.ref.current
    const scene = resolveSceneForSection(p.active)
    const sp = scene && scene.id === 'resilience' ? computeSceneProgress(scene, p.active, p.section) : 1
    const ev = staticReduced ? null : failoverEvent(sp)
    const tP = ev ? TARGETS.primary[ev.primary] : TARGETS.primary.normal
    const tB = ev ? TARGETS.backup[ev.backup] : TARGETS.backup.normal

    const k = 1 - Math.exp(-LERP_RATE * Math.min(delta, 0.1))
    if (primaryMat.current) {
      curOpacity.current.primary += (tP.opacity - curOpacity.current.primary) * k
      curColor.current.primary.lerp(tP.color, k)
      primaryMat.current.opacity = curOpacity.current.primary
      primaryMat.current.color.copy(curColor.current.primary)
    }
    if (backupMat.current) {
      curOpacity.current.backup += (tB.opacity - curOpacity.current.backup) * k
      curColor.current.backup.lerp(tB.color, k)
      backupMat.current.opacity = curOpacity.current.backup
      backupMat.current.color.copy(curColor.current.backup)
    }
  })

  if (!visible) return null

  return (
    <group>
      <points ref={primaryRef} geometry={primaryGeo} frustumCulled={false}>
        <pointsMaterial
          ref={primaryMat}
          size={0.085}
          color="#22d3ee"
          transparent
          opacity={0.9}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
      <points ref={backupRef} geometry={backupGeo} frustumCulled={false}>
        <pointsMaterial
          ref={backupMat}
          size={0.075}
          color="#22d3ee"
          transparent
          opacity={0.14}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  )
}
