'use client'

import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

/**
 * HoverCard — micro-interacción premium para cards:
 * - Lift sutil (translateY -6px) con spring easing
 * - Glow border azul que pulsa en el hover
 * - Border color transition de transparente a azul
 * - Backdrop blur sutil en hover (glassmorphism)
 * - Transición suave 0.35s (ease-out)
 */

interface HoverCardProps {
  children: ReactNode
  className?: string
  accentColor?: string
  lift?: number
}

export default function HoverCard({
  children,
  className = '',
  accentColor = '#4DA3FF',
  lift = -6,
}: HoverCardProps) {
  return (
    <motion.div
      whileHover={{ y: lift }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className={`group relative ${className}`}
      style={{
        borderRadius: '1rem',
        border: '1px solid rgba(255,255,255,0.05)',
        transition: 'border-color 0.35s ease-out, box-shadow 0.35s ease-out, backdrop-filter 0.35s ease-out',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget
        el.style.borderColor = `${accentColor}44`
        el.style.boxShadow = `0 8px 32px ${accentColor}18, 0 0 0 1px ${accentColor}22, inset 0 1px 0 ${accentColor}11`
        el.style.backdropFilter = 'blur(8px)'
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget
        el.style.borderColor = 'rgba(255,255,255,0.05)'
        el.style.boxShadow = 'none'
        el.style.backdropFilter = 'blur(0px)'
      }}
    >
      {children}
    </motion.div>
  )
}
