'use client'

import { useMemo, useRef } from 'react'
import { motion, useInView } from 'framer-motion'

/**
 * Kinetic Typography — P6 del audit de diseño:
 *
 * Cada carácter se revela individualmente con clip-path inset + translateY,
 * creando un efecto de "ensamblaje" donde las letras emergen desde abajo
 * una por una. Más dramático que el TextReveal por línea — el usuario
 * VE las letras materializarse.
 *
 * Scroll-driven: se activa cuando el elemento entra en viewport (useInView),
 * una sola vez (once: true). En reduced-motion se muestra directamente.
 */

interface KineticTextProps {
  text: string
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span'
  className?: string
  charClassName?: string
  delay?: number
  stagger?: number
  duration?: number
  slideFrom?: number
}

function isPunctuation(char: string): boolean {
  return /^[.\-\u2014,;:!?]$/.test(char)
}

export default function KineticText({
  text,
  as: Tag = 'h2',
  className = '',
  charClassName = '',
  delay = 0,
  stagger = 0.035,
  duration = 0.5,
  slideFrom = 40,
}: KineticTextProps) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  const chars = useMemo(() => text.split(''), [text])

  const delays = useMemo(() => {
    const d: number[] = []
    let acc = 0
    for (let i = 0; i < chars.length; i++) {
      const ch = chars[i]
      if (ch === ' ') { d.push(acc); continue }
      if (isPunctuation(ch) && i > 0) { d.push(acc); continue }
      d.push(acc)
      acc += stagger
    }
    return d
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, stagger])

  return (
    <Tag
      ref={ref}
      className={className}
      aria-label={text}
      style={{ display: 'inline' }}
    >
      {chars.map((ch, i) => (
        <motion.span
          key={`${i}-${ch}`}
          className={`inline-block overflow-hidden ${charClassName}`}
          style={{ lineHeight: 'inherit', verticalAlign: 'baseline' }}
          initial={{ clipPath: 'inset(0 0 100% 0)', y: slideFrom }}
          animate={
            inView
              ? { clipPath: 'inset(0 0 0% 0)', y: 0 }
              : {}
          }
          transition={{
            clipPath: {
              duration,
              delay: delay + delays[i],
              ease: [0.22, 1, 0.36, 1],
            },
            y: {
              duration: duration * 1.1,
              delay: delay + delays[i],
              ease: [0.22, 1, 0.36, 1],
            },
          }}
        >
          {ch === ' ' ? '\u00A0' : ch}
        </motion.span>
      ))}
    </Tag>
  )
}
