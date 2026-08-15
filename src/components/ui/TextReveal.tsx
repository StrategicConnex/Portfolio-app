'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

/**
 * TextReveal — P1 editorial: cada linea se revela con clip-path inset
 * (como si apareciera de atras hacia adelante), con stagger por linea.
 * Mas dramatico que FadeIn generico — el texto se "materializa".
 *
 * Uso:
 *   <TextReveal as="h2" className="..." lines={["Titulo", "Subtitulo"]} />
 *   <TextReveal as="p" lines={[t('hero.tagline')]} delay={0.3} />
 */
interface TextRevealProps {
  lines: string[]
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span'
  className?: string
  lineClassName?: string
  delay?: number
  stagger?: number
}

export default function TextReveal({
  lines,
  as: Tag = 'p',
  className = '',
  lineClassName = '',
  delay = 0,
  stagger = 0.08,
}: TextRevealProps) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <Tag ref={ref} className={className} aria-label={lines.join(' ')}>
      {lines.map((line, i) => (
        <motion.span
          key={i}
          className={`block overflow-hidden ${lineClassName}`}
          style={{ lineHeight: 'inherit' }}
          initial={{ clipPath: 'inset(0 0 100% 0)' }}
          animate={inView ? { clipPath: 'inset(0 0 0% 0)' } : {}}
          transition={{
            duration: 0.6,
            delay: delay + i * stagger,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          {line}
        </motion.span>
      ))}
    </Tag>
  )
}
