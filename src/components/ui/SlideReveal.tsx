'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

/**
 * SlideReveal — P5 HERO MOMENT: reveal dramático con wipe de fondo.
 * El contenido se desliza desde un lado mientras una "cortina" de color
 * se retira, creando un momento de impacto visual.
 *
 * Uso:
 *   <SlideReveal color="#4DA3FF" direction="left">
 *     <h2>Título dramático</h2>
 *   </SlideReveal>
 */
interface SlideRevealProps {
  children: React.ReactNode
  color?: string
  direction?: 'left' | 'right'
  className?: string
  delay?: number
}

export default function SlideReveal({
  children,
  color = '#4DA3FF',
  direction = 'left',
  className = '',
  delay = 0,
}: SlideRevealProps) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  const slideFrom = direction === 'left' ? '-100%' : '100%'

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      {/* Background wipe */}
      <motion.div
        className="absolute inset-0 z-10"
        style={{ background: color }}
        initial={{ x: slideFrom }}
        animate={inView ? { x: '100%' } : { x: slideFrom }}
        transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      />

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, x: direction === 'left' ? -80 : 80 }}
        animate={inView ? { opacity: 1, x: 0 } : {}}
        transition={{ duration: 0.7, delay: delay + 0.3, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </div>
  )
}
