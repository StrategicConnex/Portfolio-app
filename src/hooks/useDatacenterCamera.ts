'use client'

import { useCallback, useRef } from 'react'
import * as THREE from 'three'
import type { RootState } from '@react-three/fiber'
import {
  computeSceneProgress,
  interpolateWaypoints,
  resolveSceneForSection,
  SCENES,
  type SceneConfig,
} from '@/lib/scenes'
import { DATACENTER_TOKENS } from '@/lib/datacenter.tokens'
import type { SectionProgress } from './useSectionProgress'

const { lambda, maxDelta, breathing, rotationByScene } = DATACENTER_TOKENS.camera

/**
 * Dolly de cámara con easing exponencial (SPEC §6): interpola waypoints
 * entry→mid→exit según el progreso de scroll, con suavizado (nunca cortes).
 * Sin allocations dentro del frame: vectores preasignados.
 */
export function useDatacenterCamera(scenes: SceneConfig[], progress: SectionProgress) {
  const current = useRef({
    position: new THREE.Vector3(...scenes[0].camera.entry.position),
    lookAt: new THREE.Vector3(...scenes[0].camera.entry.lookAt),
    fov: scenes[0].camera.entry.fov,
    fogNear: scenes[0].fog.near,
    fogFar: scenes[0].fog.far,
    roll: 0,
  })
  const targetPos = useRef(new THREE.Vector3())
  const targetLook = useRef(new THREE.Vector3())

  const update = useCallback(
    (state: RootState, delta: number, fogRef: React.RefObject<THREE.Fog | null>) => {
      const p = progress.ref.current
      const scene = resolveSceneForSection(p.active)
      if (!scene) return

      const sp = computeSceneProgress(scene, p.active, p.section)
      const wp = interpolateWaypoints(scene.camera, sp)
      targetPos.current.set(wp.position[0], wp.position[1], wp.position[2])
      targetLook.current.set(wp.lookAt[0], wp.lookAt[1], wp.lookAt[2])

      const d = Math.min(delta, maxDelta)
      const k = 1 - Math.exp(-lambda * d)
      const c = current.current

      c.position.lerp(targetPos.current, k)
      c.lookAt.lerp(targetLook.current, k)
      c.fov += (wp.fov - c.fov) * k
      c.fogNear += (scene.fog.near - c.fogNear) * k
      c.fogFar += (scene.fog.far - c.fogFar) * k

      // P1 — CINEMATIC: breathing (sutil oscilación vertical)
      const time = state.clock.getElapsedTime()
      const breathe = Math.sin(time * breathing.frequency * Math.PI * 2) * breathing.amplitude
      c.position.y += breathe

      // P1 — CINEMATIC: rotation (roll) por escena
      const sceneIndex = SCENES.indexOf(scene)
      const rotConfig = rotationByScene[sceneIndex] ?? rotationByScene[0]
      const targetRoll = sp < 0.5
        ? rotConfig.entry + (rotConfig.mid - rotConfig.entry) * (sp * 2)
        : rotConfig.mid + (rotConfig.exit - rotConfig.mid) * ((sp - 0.5) * 2)
      c.roll += (targetRoll - c.roll) * k

      state.camera.position.copy(c.position)
      state.camera.lookAt(c.lookAt)
      if (state.camera instanceof THREE.PerspectiveCamera) {
        state.camera.fov = c.fov
        state.camera.rotation.z = c.roll
        state.camera.updateProjectionMatrix()
      }
      if (fogRef.current) {
        fogRef.current.near = c.fogNear
        fogRef.current.far = c.fogFar
      }
    },
    [progress],
  )

  return { update }
}
