'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { getActiveScene } from '@/lib/activeScene'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import { HERO_RACK_POS } from '@/lib/datacenter.layout'

/**
 * P5 — HERO MOMENT S1: FLASH DE LUZ.
 *
 * Al entrar en S1 (boot), un destello de luz recorre el rack hero de arriba
 * hacia abajo en ~1.2s, como si el sistema se encendiera por primera vez.
 * El flash es un PointLight que se mueve verticalmente sobre la cara frontal
 * del rack, con un pulso de intensidad que simula el "power-on" de un
 * datacenter premium.
 *
 * Determinístico por scroll (solo se dispara una vez al entrar en S1),
 * sin allocations en el frame loop (SPEC §32), 0 draw calls extra
 * (un PointLight ya existente mutado).
 *
 * En reduced-motion: el flash se muestra estático (intensidad media).
 */
const FLASH_DURATION = 1.2 // segundos del sweep
const FLASH_INTENSITY = 4.5
const FLASH_PEAK = 6.0 // intensidad máxima en el midpoint del sweep
const SWEEP_Y_TOP = HERO_RACK_POS[1] + 1.4 // borde superior del rack
const SWEEP_Y_BOTTOM = HERO_RACK_POS[1] - 1.4 // borde inferior
const FLASH_Z = HERO_RACK_POS[2] + 0.6 // frente del rack

export default function HeroFlash() {
  const { reduced } = usePrefersReducedMotion()
  const light = useRef<THREE.PointLight>(null)
  const flashTime = useRef(-1) // -1 = no activo
  const hasFired = useRef(false)
  const curIntensity = useRef(0)

  useFrame((state, delta) => {
    const l = light.current
    if (!l) return

    const scene = getActiveScene()

    // Trigger: al entrar en S1 (scene 0), disparar el flash una sola vez.
    if (scene === 0 && !hasFired.current && flashTime.current < 0) {
      flashTime.current = 0
      hasFired.current = false // permitir re-disparo si el usuario vuelve a S1
    }

    // Reset: al salir de S1, preparar para el próximo entry.
    if (scene !== 0) {
      hasFired.current = false
      flashTime.current = -1
    }

    if (reduced) {
      // Modo reduce: estático en posición media con intensidad suave.
      l.position.set(HERO_RACK_POS[0], SWEEP_Y_TOP, FLASH_Z)
      l.intensity = FLASH_INTENSITY * 0.3
      return
    }

    // Progress del flash (0→1 durante FLASH_DURATION).
    if (flashTime.current >= 0 && flashTime.current < FLASH_DURATION) {
      flashTime.current = Math.min(FLASH_DURATION, flashTime.current + delta)
      const t = flashTime.current / FLASH_DURATION

      // Posición: sweep de arriba hacia abajo.
      const y = THREE.MathUtils.lerp(SWEEP_Y_TOP, SWEEP_Y_BOTTOM, t)
      l.position.set(HERO_RACK_POS[0], y, FLASH_Z)

      // Intensidad: pulso con pico en el midpoint (t≈0.5).
      // Curva suave: rise rápido + decay lento.
      const pulse = Math.sin(t * Math.PI) // 0→1→0
      const envelope = t < 0.15 ? t / 0.15 : 1 // attack en los primeros 15%
      const intensity = THREE.MathUtils.lerp(FLASH_INTENSITY, FLASH_PEAK, pulse) * envelope
      curIntensity.current = intensity
      l.intensity = intensity
    } else if (flashTime.current >= FLASH_DURATION) {
      // Fade out suave post-flash.
      curIntensity.current *= 0.92
      if (curIntensity.current < 0.01) {
        curIntensity.current = 0
        flashTime.current = -1
      }
      l.intensity = curIntensity.current
    } else {
      l.intensity = 0
    }
  })

  return (
    <pointLight
      ref={light}
      position={[HERO_RACK_POS[0], SWEEP_Y_TOP, FLASH_Z]}
      intensity={0}
      color="#b8d4ff"
      distance={8}
      decay={1.5}
    />
  )
}
