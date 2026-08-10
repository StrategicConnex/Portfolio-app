'use client'

import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'datacenter-reduce-motion'

function readMedia(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function readManual(): boolean | null {
  try {
    const v = window.localStorage.getItem(STORAGE_KEY)
    if (v === null) return null
    return v === '1'
  } catch {
    return null
  }
}

/**
 * Detección de prefers-reduced-motion + toggle manual persistido.
 * `reduced === true` ⇒ el 3D se congela o cae a StaticPoster (SPEC §8).
 * El toggle manual gana sobre la preferencia del SO (SPEC §8: toggle manual permitido).
 */
export function usePrefersReducedMotion(): { reduced: boolean; toggle: () => void } {
  const [reduced, setReduced] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    const manual = readManual()
    return manual !== null ? manual : readMedia()
  })

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => {
      // Solo responde a cambios del SO si el usuario no forzó un valor manual
      if (readManual() !== null) return
      setReduced(mq.matches)
    }
    if (typeof mq.addEventListener === 'function') {
      mq.addEventListener('change', onChange)
      return () => mq.removeEventListener('change', onChange)
    }
    // Fallback para navegadores antiguos
    if (typeof mq.addListener === 'function') {
      mq.addListener(onChange)
      return () => mq.removeListener(onChange)
    }
    return undefined
  }, [])

  const toggle = useCallback(() => {
    setReduced((prev) => {
      const next = !prev
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? '1' : '0')
      } catch {
        /* storage no disponible */
      }
      return next
    })
  }, [])

  return { reduced, toggle }
}
