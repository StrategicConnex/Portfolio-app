'use client'

import { useEffect, useRef, useState } from 'react'

export type SectionProgressState = { active: number; section: number; global: number }

export type SectionProgress = {
  /** Estado mutable leído por el bucle de cámara (sin re-renders por scroll). */
  ref: React.MutableRefObject<SectionProgressState>
  /** Solo cambia al cruzar de sección (para HUD). */
  active: number
}

/**
 * Progreso de scroll basado en geometría DOM real (SPEC §21) — nunca alturas
 * hardcoded. Un único listener pasivo + rAF-throttled alimenta un ref mutable;
 * el estado React solo cambia cuando cambia la sección activa.
 */
export function useSectionProgress(sectionIds: string[]): SectionProgress {
  const stateRef = useRef<SectionProgressState>({ active: -1, section: 0, global: 0 })
  const [active, setActive] = useState(-1)

  useEffect(() => {
    const measure = () => {
      const vh = window.innerHeight || 1
      const center = vh / 2
      const doc = document.documentElement
      const maxScroll = Math.max(1, doc.scrollHeight - vh)
      stateRef.current.global = Math.min(1, Math.max(0, window.scrollY / maxScroll))

      // Sección activa = la de punto medio más cercano al centro del viewport.
      // (La alternativa p=max(p, clamp) falla: una vez que la primera sección
      // queda arriba del centro con p=1, ninguna otra puede ganar.)
      let best = -1
      let bestDist = Infinity
      for (let i = 0; i < sectionIds.length; i++) {
        const el = document.getElementById(sectionIds[i])
        if (!el) continue
        const rect = el.getBoundingClientRect()
        if (rect.height <= 0) continue
        const dist = Math.abs(center - (rect.top + rect.height / 2))
        if (dist < bestDist) {
          bestDist = dist
          best = i
        }
      }
      if (best !== -1) {
        const rect = document.getElementById(sectionIds[best])!.getBoundingClientRect()
        const p = Math.min(1, Math.max(0, (center - rect.top) / rect.height))
        stateRef.current.active = best
        stateRef.current.section = p
        setActive((prev) => (prev === best ? prev : best))
      }
    }

    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(measure)
    }

    raf = requestAnimationFrame(measure)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [sectionIds])

  return { ref: stateRef, active }
}
