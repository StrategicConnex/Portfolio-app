'use client'

import { useEffect, useRef, useState } from 'react'
import { useActiveScene } from '@/lib/activeScene'

/**
 * SceneTransition — P2 CINEMATIC: flash sutil de fade-to-black al cruzar
 * de escena. Crea "puntuación visual" entre actos del storyline:
 * - El fade dura ~300ms (150ms fade in, 150ms fade out)
 * - Solo aparece en las transiciones de escena, no durante el scroll dentro
 * - Opacidad máxima ~0.3 (suficiente para marcar el cambio, no para ocultar)
 * - reduced-motion: sin transición (el usuario ya tiene motion reducido)
 */
export default function SceneTransition() {
  const scene = useActiveScene()
  const prevScene = useRef(scene)
  const [opacity, setOpacity] = useState(0)
  const timeoutRef = useRef<NodeJS.Timeout>(undefined)

  useEffect(() => {
    // Detectar cambio de escena
    if (scene !== prevScene.current) {
      prevScene.current = scene

      // Flash: fade in rápido + fade out
      setOpacity(0.35)

      // Fade out después de 150ms
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => {
        setOpacity(0)
      }, 150)
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [scene])

  // No renderizar si opacidad es 0
  if (opacity === 0) return null

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-[45] pointer-events-none bg-black transition-opacity duration-150"
      style={{ opacity }}
    />
  )
}
