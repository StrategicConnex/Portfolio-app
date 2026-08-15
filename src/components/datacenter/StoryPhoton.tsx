'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ALL_SECTIONS, SCENES, computeSceneProgress, resolveSceneForSection } from '@/lib/scenes'
import { samplePath } from '@/lib/datacenter.layout'
import { useSectionProgress } from '@/hooks/useSectionProgress'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import {
  buildPhotonPath,
  failoverEvent,
  photonArrival,
  photonDeparture,
  photonFailoverTint,
  photonGlobalProgress,
  PHOTON_COLOR_BY_SCENE,
  PHOTON_NODE_GLOBAL,
} from '@/lib/datacenter.storyline'
import { getGlowTexture, pointGeometry } from './glowTexture'

const TRAIL_COUNT = 7
const TRAIL_GAP = 0.008 // separación de la estela en progreso global
const LERP_RATE = 5 // suavizado del color/estado (SPEC §16 — nunca cortes bruscos)
const BASE_SIZE = 0.16
const BREATH = 0.03 // deriva viva de la cabeza (mínima, SPEC §3 restraint)

/** Colores del arco de temperatura pre-computados (cero allocations por frame,
 *  SPEC §32). */
const SCENE_COLORS: THREE.Color[] = PHOTON_COLOR_BY_SCENE.map((c) => new THREE.Color(c))

/**
 * P7d — EL FOTÓN (hilo de continuidad del storyline, audit de narrativa):
 * una partícula de luz que nace en el boot, viaja con los streams de data,
 * sobrevive al failover de resilience (va en la ruta B, la que transporta
 * todo en la ventana dead) y llega al nodo central en connection.
 *
 * Un único path continuo (datacenter.storyline.buildPhotonPath — 5 tramos
 * conectados extremo-a-extremo) parametrizado por progreso GLOBAL: el fotón
 * nunca salta en las fronteras de escena. El color es el arco de temperatura
 * del sitio (azul→cian→ámbar→champagne — misma identidad que el Phase Gate);
 * el failover lo modula con un pulso de intensidad (es EL portador en la
 * ventana dead) y la llegada a S5 es un bloom + respiración.
 *
 * Escritura directa a posiciones/materiales en useFrame (sin setState,
 * SPEC §32), geometría creada una vez, colores compartidos sin allocations.
 * Con prefers-reduced-motion → estático en el nodo de llegada (defensivo: el
 * canvas normalmente no monta en modo reduce).
 */
export default function StoryPhoton() {
  const progress = useSectionProgress(ALL_SECTIONS)
  const { reduced } = usePrefersReducedMotion()
  const path = useMemo(() => buildPhotonPath(), [])
  const glow = useMemo(() => getGlowTexture(), [])
  const headGeo = useMemo(() => pointGeometry(1), [])
  const trailGeo = useMemo(() => pointGeometry(TRAIL_COUNT), [])
  const headRef = useRef<THREE.Points>(null)
  const trailRef = useRef<THREE.Points>(null)
  const headMat = useRef<THREE.PointsMaterial>(null)
  const trailMat = useRef<THREE.PointsMaterial>(null)
  const curColor = useRef(new THREE.Color(PHOTON_COLOR_BY_SCENE[0]))
  const curSize = useRef(BASE_SIZE)
  const curOpacity = useRef(0.95)
  const trailColor = useRef(new THREE.Color(PHOTON_COLOR_BY_SCENE[0]))
  const headPos = useRef(new THREE.Vector3())

  useFrame((state, delta) => {
    const head = headRef.current
    const trail = trailRef.current
    if (!head || !trail) return

    // Progreso global del viaje (data-driven por scroll, SPEC §20/§21).
    const p = progress.ref.current
    const scene = resolveSceneForSection(p.active)
    const sceneIndex = scene ? SCENES.indexOf(scene) : -1
    const sp = scene ? computeSceneProgress(scene, p.active, p.section) : 0
    // reduced-motion: el fotón espera estático en el nodo central (no viaja
    // por el haz — defensivo: el canvas normalmente no monta en modo reduce).
    const global = reduced ? PHOTON_NODE_GLOBAL : photonGlobalProgress(sceneIndex, sp)

    // Posición de la cabeza + estela (t a lo largo del path, clamped en los
    // extremos — el fotón se congrega en su nacimiento y se asienta al llegar).
    const h = samplePath(path, global)
    headPos.current.set(h[0] + Math.sin(state.clock.elapsedTime * 1.3) * BREATH, h[1] + Math.cos(state.clock.elapsedTime * 0.9) * BREATH * 0.6, h[2])
    const headAttr = head.geometry.getAttribute('position') as THREE.BufferAttribute
    const headArr = headAttr.array as Float32Array
    headArr[0] = headPos.current.x
    headArr[1] = headPos.current.y
    headArr[2] = headPos.current.z
    headAttr.needsUpdate = true

    const trailAttr = trail.geometry.getAttribute('position') as THREE.BufferAttribute
    const trailArr = trailAttr.array as Float32Array
    for (let i = 0; i < TRAIL_COUNT; i++) {
      const tt = Math.max(0, global - (i + 1) * TRAIL_GAP)
      const q = samplePath(path, tt)
      trailArr[i * 3] = q[0]
      trailArr[i * 3 + 1] = q[1]
      trailArr[i * 3 + 2] = q[2]
    }
    trailAttr.needsUpdate = true

    // Color = arco de temperatura por escena (identidad del Phase Gate).
    const idx = Math.min(SCENE_COLORS.length - 1, Math.max(0, sceneIndex))
    const k = 1 - Math.exp(-LERP_RATE * Math.min(delta, 0.1))
    curColor.current.lerp(SCENE_COLORS[idx], k)

    // Failover (P7a): el fotón es el portador en la ventana dead → pulso.
    let boost = { sizeBoost: 0, opacityBoost: 0 }
    if (!reduced && sceneIndex === 3) {
      boost = photonFailoverTint(failoverEvent(sp).primary)
    }

    // Llegada (S5, P7d) + partida por el haz (P7e): bloom en el nodo central,
    // luego el fotón continúa viajando por el haz hacia el clúster distante —
    // se encoge levemente al receder hacia la niebla (dep 0→1).
    const arr = reduced ? 1 : photonArrival(global)
    const dep = reduced ? 0 : photonDeparture(global)
    const breathe = 1 + 0.9 * arr + 0.35 * arr * Math.sin(state.clock.elapsedTime * 3)

    if (headMat.current) {
      curSize.current += (BASE_SIZE * (1 + boost.sizeBoost) * breathe * (1 - 0.3 * dep) - curSize.current) * k
      curOpacity.current += (Math.min(1, 0.95 * (1 + boost.opacityBoost) + 0.05 * arr) * (1 - 0.25 * dep) - curOpacity.current) * k
      headMat.current.size = curSize.current
      headMat.current.opacity = curOpacity.current
      headMat.current.color.copy(curColor.current)
    }
    if (trailMat.current) {
      trailColor.current.lerp(curColor.current, k * 0.6)
      trailMat.current.color.copy(trailColor.current)
      trailMat.current.size = BASE_SIZE * 0.38 * (1 + boost.sizeBoost * 0.5) * (1 + arr * 0.6) * (1 - 0.4 * dep)
      trailMat.current.opacity = Math.min(1, 0.35 + 0.1 * boost.opacityBoost + 0.25 * arr) * (1 - 0.4 * dep)
    }
  })

  return (
    <group>
      <points ref={headRef} geometry={headGeo} frustumCulled={false}>
        <pointsMaterial
          ref={headMat}
          map={glow}
          size={BASE_SIZE}
          color={PHOTON_COLOR_BY_SCENE[0]}
          transparent
          opacity={0.95}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
      <points ref={trailRef} geometry={trailGeo} frustumCulled={false}>
        <pointsMaterial
          ref={trailMat}
          map={glow}
          size={BASE_SIZE * 0.38}
          color={PHOTON_COLOR_BY_SCENE[0]}
          transparent
          opacity={0.35}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  )
}
