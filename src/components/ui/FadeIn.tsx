'use client'

import { motion, useInView, useReducedMotion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import { useRef } from 'react'

/* ── Variant presets ───────────────────────────────────────────────────── */

type VariantName = 'default' | 'hero' | 'scale' | 'blur' | 'clip'

const variants: Record<VariantName, Variants> = {
  /** Standard fade + 40px translate (original behaviour). */
  default: {
    hidden: { y: 40, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  },
  /** Dramatic scale-down + blur dissolve — for hero-area reveals. */
  hero: {
    hidden: { scale: 1.08, opacity: 0, filter: 'blur(8px)' },
    visible: { scale: 1, opacity: 1, filter: 'blur(0px)' },
  },
  /** Subtle scale-up + fade — for cards, badges, tiles. */
  scale: {
    hidden: { scale: 0.92, opacity: 0 },
    visible: { scale: 1, opacity: 1 },
  },
  /** Blur-only dissolve — for text-heavy sections (no translate). */
  blur: {
    hidden: { opacity: 0, filter: 'blur(6px)' },
    visible: { opacity: 1, filter: 'blur(0px)' },
  },
  /** Clip-path wipe from bottom — for dashboards, charts, panels. */
  clip: {
    hidden: { clipPath: 'inset(100% 0 0 0)', opacity: 0 },
    visible: { clipPath: 'inset(0% 0 0 0)', opacity: 1 },
  },
}

const directionOverrides: Record<string, Variants> = {
  up:    { hidden: { y: 40, opacity: 0 },  visible: { y: 0, opacity: 1 } },
  down:  { hidden: { y: -40, opacity: 0 }, visible: { y: 0, opacity: 1 } },
  left:  { hidden: { x: -40, opacity: 0 }, visible: { x: 0, opacity: 1 } },
  right: { hidden: { x: 40, opacity: 0 },  visible: { x: 0, opacity: 1 } },
  none:  { hidden: { opacity: 0 },          visible: { opacity: 1 } },
}

/* ── Component ─────────────────────────────────────────────────────────── */

interface FadeInProps {
  children: React.ReactNode
  delay?: number
  /** Legacy direction shorthand — overrides `variant` when set (except 'up' which is the default). */
  direction?: 'up' | 'down' | 'left' | 'right' | 'none'
  /** Cinematic variant. Ignored when `direction` is explicitly non-default. */
  variant?: VariantName
  className?: string
  once?: boolean
  /** Extra duration in seconds (default 0.65). */
  duration?: number
}

export default function FadeIn({
  children,
  delay = 0,
  direction = 'up',
  variant = 'default',
  className = '',
  once = true,
  duration = 0.65,
}: FadeInProps) {
  const ref = useRef(null)
  const inView = useInView(ref, { once, margin: '-80px' })
  const shouldReduceMotion = useReducedMotion()

  // If user prefers reduced motion, skip all transforms
  const reduced: Variants = { hidden: { opacity: 0 }, visible: { opacity: 1 } }

  // Direction overrides variant when explicitly non-default
  const useDirection = direction !== 'up'
  const v = shouldReduceMotion
    ? reduced
    : useDirection
      ? directionOverrides[direction]
      : variants[variant]

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={v}
      transition={{
        duration: shouldReduceMotion ? 0 : duration,
        delay,
        ease: variant === 'clip' ? [0.25, 0.1, 0.25, 1] : 'easeOut',
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/* ── StaggerReveal ─────────────────────────────────────────────────────── */

interface StaggerRevealProps {
  children: React.ReactNode
  /** Delay between children in seconds (default 0.1). */
  stagger?: number
  /** Delay before the first child (default 0). */
  delay?: number
  className?: string
  once?: boolean
}

/**
 * Orchestrates staggered reveal of its direct children.
 * Wrap each child in a <StaggerItem> for the cinematic variant.
 */
export function StaggerReveal({
  children,
  stagger = 0.1,
  delay = 0,
  className = '',
  once = true,
}: StaggerRevealProps) {
  const ref = useRef(null)
  const inView = useInView(ref, { once, margin: '-60px' })
  const shouldReduceMotion = useReducedMotion()

  const container: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: shouldReduceMotion ? 0 : delay,
        staggerChildren: shouldReduceMotion ? 0 : stagger,
      },
    },
  }

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={container}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/**
 * Child item for StaggerReveal. Wraps content in a motion.div with
 * the cinematic variant pre-applied.
 */
export function StaggerItem({
  children,
  variant = 'default',
  className = '',
}: {
  children: React.ReactNode
  variant?: VariantName
  className?: string
}) {
  const shouldReduceMotion = useReducedMotion()
  const v: Variants = shouldReduceMotion
    ? { hidden: { opacity: 0 }, visible: { opacity: 1 } }
    : variants[variant]

  return (
    <motion.div variants={v} className={className}>
      {children}
    </motion.div>
  )
}
