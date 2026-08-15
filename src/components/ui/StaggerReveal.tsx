'use client'

import { useRef } from 'react'
import { motion, useInView, type Variants } from 'framer-motion'

/**
 * StaggerReveal — P4 CINEMATIC: container que anima sus hijos en secuencia
 * al entrar en el viewport. Cada hijo se revela con delay escalonado.
 * Más dramático que FadeIn individual — crea un "efecto dominó" visual.
 *
 * Uso:
 *   <StaggerReveal stagger={0.08}>
 *     <Card /><Card /><Card />
 *   </StaggerReveal>
 */
interface StaggerRevealProps {
  children: React.ReactNode
  className?: string
  stagger?: number
  direction?: 'up' | 'left' | 'right' | 'scale'
  once?: boolean
  margin?: string
}

const containerVariants = (stagger: number): Variants => ({
  hidden: {},
  visible: {
    transition: {
      staggerChildren: stagger,
    },
  },
})

const childVariants = (direction: string): Variants => {
  const map: Record<string, { hidden: Variants['hidden']; visible: Variants['visible'] }> = {
    up: {
      hidden: { opacity: 0, y: 50 },
      visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
    },
    left: {
      hidden: { opacity: 0, x: -60 },
      visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
    },
    right: {
      hidden: { opacity: 0, x: 60 },
      visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
    },
    scale: {
      hidden: { opacity: 0, scale: 0.85 },
      visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
    },
  }
  return map[direction] ?? map.up
}

export default function StaggerReveal({
  children,
  className = '',
  stagger = 0.08,
  direction = 'up',
  once = true,
  margin = '-60px',
}: StaggerRevealProps) {
  const ref = useRef(null)
  const inView = useInView(ref, { once, margin: margin as `${number}px` | `${number}%` | `${number}px ${number}px ${number}px ${number}px` })

  return (
    <motion.div
      ref={ref}
      className={className}
      variants={containerVariants(stagger)}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
    >
      {Array.isArray(children)
        ? children.map((child, i) => (
            <motion.div key={i} variants={childVariants(direction)}>
              {child}
            </motion.div>
          ))
        : <motion.div variants={childVariants(direction)}>{children}</motion.div>
      }
    </motion.div>
  )
}
