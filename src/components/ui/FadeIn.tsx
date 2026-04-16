'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

interface FadeInProps {
  children: React.ReactNode
  delay?: number
  direction?: 'up' | 'down' | 'left' | 'right' | 'none'
  className?: string
  once?: boolean
}

export default function FadeIn({
  children,
  delay = 0,
  direction = 'up',
  className = '',
  once = true,
}: FadeInProps) {
  const ref = useRef(null)
  const inView = useInView(ref, { once, margin: '-80px' })

  const dirMap = {
    up:    { hidden: { y: 40, opacity: 0 }, visible: { y: 0, opacity: 1 } },
    down:  { hidden: { y: -40, opacity: 0 }, visible: { y: 0, opacity: 1 } },
    left:  { hidden: { x: -40, opacity: 0 }, visible: { x: 0, opacity: 1 } },
    right: { hidden: { x: 40, opacity: 0 }, visible: { x: 0, opacity: 1 } },
    none:  { hidden: { opacity: 0 }, visible: { opacity: 1 } },
  }

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={dirMap[direction]}
      transition={{ duration: 0.65, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
