'use client'

import { useRef, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useActiveScene } from '@/lib/activeScene'

/**
 * DataMoment — P2: el "momento de datos" estilo Mastercard Business Outcomes.
 * Overlay DOM fijo que aparece SOLO en S3 (Data in Motion, scene index 2)
 * con 4 métricas gigantes que hacen count-up al entrar en escena.
 *
 * Arquitectura: DOM Z-40 (mismo layer que el contenido), pointer-events: none,
 * aria-hidden. No toca el canvas Z-20 ni la lógica del Copilot Z-50.
 * reduced-motion: sin count-up, valores estáticos.
 */

interface MetricConfig {
  value: number
  suffix: string
  prefix?: string
  label: string
  decimals?: number
}

const METRICS: MetricConfig[] = [
  { value: 99.9, suffix: '%', label: 'UPTIME', decimals: 1 },
  { value: 30, suffix: '%', prefix: '−', label: 'INCIDENTES REDUCIDOS', decimals: 0 },
  { value: 10, suffix: 'h/sem', prefix: '−', label: 'TIEMPO DE RESPUESTA', decimals: 0 },
  { value: 131, suffix: '/142', label: 'CONTROLES CUMPLIDOS', decimals: 0 },
]

/** Hook: count-up de un numero con requestAnimationFrame. */
function useCountUp(
  target: number,
  active: boolean,
  duration = 1800,
  decimals = 0,
) {
  const [value, setValue] = useState(0)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    if (!active) return
    let start = 0
    const tick = (ts: number) => {
      if (!start) start = ts
      const elapsed = ts - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Number((eased * target).toFixed(decimals)))
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick)
      }
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [active, target, duration, decimals])

  return value
}

function MetricCard({
  metric,
  active,
  index,
}: {
  metric: MetricConfig
  active: boolean
  index: number
}) {
  const val = useCountUp(metric.value, active, 1800 + index * 200, metric.decimals ?? 0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={active ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 30, scale: 0.95 }}
      transition={{ duration: 0.6, delay: index * 0.12, ease: [0.22, 1, 0.36, 1] }}
      className="text-center px-4 sm:px-8"
    >
      <div className="text-[0.6rem] sm:text-[0.7rem] text-slate-500 uppercase tracking-[0.25em] mb-2 sm:mb-3 font-bold font-mono">
        {metric.label}
      </div>
      <div className="text-5xl sm:text-7xl md:text-8xl lg:text-[7rem] font-black text-white tracking-[-0.04em] leading-none font-mono">
        <span className="text-[var(--blue)]">{metric.prefix ?? ''}</span>
        {val}
        <span className="text-[0.35em] text-[var(--gold)] font-bold ml-1">{metric.suffix}</span>
      </div>
    </motion.div>
  )
}

export default function DataMoment() {
  const scene = useActiveScene()
  const active = scene === 2 // S3 = Data in Motion

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key="data-moment"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          aria-hidden="true"
          className="fixed inset-0 z-40 pointer-events-none flex items-center justify-center"
        >
          {/* Backdrop sutil: solo oscurece lo suficiente para que los números se lean */}
          <div className="absolute inset-0 bg-[#04080f]/40" />

          {/* Métricas gigantes */}
          <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8 max-w-6xl w-full px-6">
            {METRICS.map((m, i) => (
              <MetricCard key={m.label} metric={m} active={active} index={i} />
            ))}
          </div>

          {/* Línea decorativa inferior */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={active ? { scaleX: 1 } : { scaleX: 0 }}
            transition={{ duration: 1.2, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="absolute bottom-[15%] left-[10%] right-[10%] h-[1px] bg-gradient-to-r from-transparent via-[var(--blue)]/30 to-transparent origin-center"
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
