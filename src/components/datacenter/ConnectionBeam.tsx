'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ALL_SECTIONS, SCENES, computeSceneProgress, resolveSceneForSection } from '@/lib/scenes'
import { useSectionProgress } from '@/hooks/useSectionProgress'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import {
  beamClusterPoints,
  beamPointAlong,
  BEAM_ORIGIN,
  BEAM_TARGET,
  connectionBeamStrength,
  photonGlobalProgress,
} from '@/lib/datacenter.storyline'
import { getGlowTexture, pointGeometry } from './glowTexture'

const CLUSTER_COUNT = 12
const PACKET_COUNT = 10
const TOTAL = CLUSTER_COUNT + PACKET_COUNT
const PACKET_FLOW = 0.45 // velocidad de los paquetes a lo largo del haz
const SHAFT_WIDTH = 0.7
const SHAFT_OPACITY = 0.3
const BEAM_COLOR = '#E8D5AC' // champagne — el color del clímax (P2)

/**
 * P7e — CONEXIÓN COMO WAN (el clímax del storyline): el nodo central de S5
 * enciende un haz de luz hacia un CLÚSTER DISTANTE — el resto de la red — al
 * borde de la niebla (fog S5 near 18 / far 55). El datacenter es UN nodo, no
 * el mundo: la cámara del reveal diagonal (P3) muestra el haz emergiendo del
 * nodo y desvaneciéndose en lo desconocido, con paquetes de datos fluyendo
 * hacia la red y la granja distante emergiendo del dark.
 *
 * El fotón (P7d) llega al nodo, enciende el haz (photonArrival) y continúa
 * viajando por él (photonDeparture) — la línea del haz es la misma que el
 * último tramo del fotón (colinealidad testeada en la suite).
 *
 * 3 draw calls totales (2 planos cruzados del shaft + 1 Points de
 * clúster+paquetes) — medido en runtime: S3 peor caso 45 → 48 < 50 (SPEC §21).
 * Activación determinística por scroll (connectionBeamStrength), escritura
 * directa en useFrame (sin setState, SPEC §32), reduced-motion → haz estático
 * pleno con paquetes congelados (defensivo).
 */
export default function ConnectionBeam() {
  const progress = useSectionProgress(ALL_SECTIONS)
  const { reduced } = usePrefersReducedMotion()
  const glow = useMemo(() => getGlowTexture(), [])
  const cluster = useMemo(() => beamClusterPoints(), [])

  // 1 Points geometry: clúster (fijo, escrito al crear) + paquetes (fluyen).
  const geo = useMemo(() => {
    const g = pointGeometry(TOTAL)
    const arr = g.getAttribute('position').array as Float32Array
    cluster.forEach((pt, i) => {
      arr[i * 3] = pt[0]
      arr[i * 3 + 1] = pt[1]
      arr[i * 3 + 2] = pt[2]
    })
    return g
  }, [cluster])

  // Shaft: 2 planos cruzados (X) con el glow radial — el clásico streak
  // volumétrico barato. El setup (mitad del haz, cuaterniones q1/q2 — el spin
  // de 90° alrededor del eje del haz cruza el segundo plano) se calcula una
  // vez; los materials se mutan vía refs asignados por R3F (patrón del fotón,
  // SPEC §32 — cero re-renders).
  const shaftSetup = useMemo(() => {
    const o = new THREE.Vector3(...BEAM_ORIGIN)
    const t = new THREE.Vector3(...BEAM_TARGET)
    const dir = new THREE.Vector3().subVectors(t, o)
    const len = dir.length()
    const dirN = dir.clone().normalize()
    const mid = new THREE.Vector3().addVectors(o, t).multiplyScalar(0.5)
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dirN)
    const spin = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2)
    return { mid, q1: q.clone(), q2: q.clone().multiply(spin), scale: [SHAFT_WIDTH, len, 1] as [number, number, number] }
  }, [])
  const shaftMat1 = useRef<THREE.MeshBasicMaterial | null>(null)
  const shaftMat2 = useRef<THREE.MeshBasicMaterial | null>(null)

  const pointsRef = useRef<THREE.Points>(null)
  const pointsMat = useRef<THREE.PointsMaterial>(null)

  useFrame((state) => {
    const points = pointsRef.current
    if (!points) return

    // Progreso global (misma fuente que el fotón — el haz vive en S5).
    const p = progress.ref.current
    const scene = resolveSceneForSection(p.active)
    const sceneIndex = scene ? SCENES.indexOf(scene) : -1
    const sp = scene ? computeSceneProgress(scene, p.active, p.section) : 0
    const global = photonGlobalProgress(sceneIndex, sp)
    const strength = reduced ? 1 : connectionBeamStrength(global)

    // Paquetes fluyendo origen → target (wrap continuo, como DataStreams).
    const attr = points.geometry.getAttribute('position') as THREE.BufferAttribute
    const arr = attr.array as Float32Array
    const offset = reduced ? 0.4 : (state.clock.elapsedTime * PACKET_FLOW) % 1
    for (let i = 0; i < PACKET_COUNT; i++) {
      const t = (i / PACKET_COUNT + offset) % 1
      const pt = beamPointAlong(t)
      const j = (CLUSTER_COUNT + i) * 3
      arr[j] = pt[0]
      arr[j + 1] = pt[1]
      arr[j + 2] = pt[2]
    }
    attr.needsUpdate = true

    if (pointsMat.current) pointsMat.current.opacity = 0.42 * strength
    const so = SHAFT_OPACITY * strength
    if (shaftMat1.current) shaftMat1.current.opacity = so
    if (shaftMat2.current) shaftMat2.current.opacity = so
  })

  return (
    <group>
      <mesh position={shaftSetup.mid} quaternion={shaftSetup.q1} scale={shaftSetup.scale} frustumCulled={false}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          ref={shaftMat1}
          map={glow}
          color={BEAM_COLOR}
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh position={shaftSetup.mid} quaternion={shaftSetup.q2} scale={shaftSetup.scale} frustumCulled={false}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          ref={shaftMat2}
          map={glow}
          color={BEAM_COLOR}
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      <points ref={pointsRef} geometry={geo} frustumCulled={false}>
        <pointsMaterial
          ref={pointsMat}
          map={glow}
          size={0.5}
          color={BEAM_COLOR}
          transparent
          opacity={0}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  )
}
