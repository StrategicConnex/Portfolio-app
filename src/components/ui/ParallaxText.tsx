'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'

/**
 * ParallaxText — P3 CINEMATIC: texto que se mueve a velocidad diferente
 * del canvas, creando profundidad entre capas DOM y 3D.
 * - speed: factor de parallax (0 = estático, 1 = mismo ritmo que scroll)
 * - direction: eje del parallax ('y' o 'x')
 * - Clamped: el parallax tiene límites para no salir del viewport
 */
export default function ParallaxText({
  children,
  speed = 0.3,
  direction = 'y',
  className = '',
}: {
  children: React.ReactNode
  speed?: number
  direction?: 'y' | 'x'
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })

  const y = useTransform(scrollYProgress, [0, 1], [speed * 100, -speed * 100])
  const x = useTransform(scrollYProgress, [0, 1], [speed * 60, -speed * 60])

  return (
    <motion.div
      ref={ref}
      className={className}
      style={direction === 'y' ? { y } : { x }}
    >
      {children}
    </motion.div>
  )
}
