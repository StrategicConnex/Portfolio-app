'use client'

import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import dynamic from 'next/dynamic'

const ParticleCanvas = dynamic(() => import('./ParticleCanvas'), { ssr: false })
const RadarSweep     = dynamic(() => import('./RadarSweep'),     { ssr: false })

const TEXT_VARIANTS: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.15,
      duration: 0.7,
      ease: 'easeOut',
    },
  }),
}

export default function Hero() {
  return (
    <section
      id="hero"
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '6rem 2rem 4rem',
        position: 'relative',
        overflow: 'hidden',
        background: 'var(--bg)',
      }}
    >
      {/* Three.js background */}
      <ParticleCanvas />

      {/* Purdue radar — visible md+ */}
      <div style={{ display: 'none' }} className="hero-radar">
        <RadarSweep />
      </div>

      {/* Subtle radial glow behind text */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 700, height: 700,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(30,144,255,0.07) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 800 }}>
        {/* Badge */}
        <motion.div
          custom={0} variants={TEXT_VARIANTS} initial="hidden" animate="visible"
          style={{ marginBottom: '1.5rem' }}
        >
          <span
            style={{
              display: 'inline-block',
              border: '1px solid var(--gold)',
              color: 'var(--gold)',
              fontSize: '0.72rem',
              letterSpacing: '3px',
              padding: '0.3rem 1rem',
              borderRadius: 20,
              textTransform: 'uppercase',
            }}
          >
            IT/OT · Ciberseguridad · Infraestructura
          </span>
        </motion.div>

        {/* Name */}
        <motion.h1
          custom={1} variants={TEXT_VARIANTS} initial="hidden" animate="visible"
          style={{
            fontSize: 'clamp(2.4rem, 6vw, 4rem)',
            fontWeight: 800,
            lineHeight: 1.1,
            marginBottom: '0.5rem',
            color: 'var(--text)',
            letterSpacing: '-0.5px',
          }}
        >
          Juan Felipe{' '}
          <span
            style={{
              background: 'linear-gradient(135deg, #1E90FF 0%, #C5A46D 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Palacios
          </span>
        </motion.h1>

        {/* Title */}
        <motion.p
          custom={2} variants={TEXT_VARIANTS} initial="hidden" animate="visible"
          style={{
            fontSize: 'clamp(1rem, 2.5vw, 1.4rem)',
            color: 'var(--blue)',
            fontWeight: 500,
            marginBottom: '1rem',
            letterSpacing: '0.5px',
          }}
        >
          IT/OT Cybersecurity Architect
        </motion.p>

        {/* Tagline */}
        <motion.p
          custom={3} variants={TEXT_VARIANTS} initial="hidden" animate="visible"
          style={{
            color: 'var(--muted)',
            fontSize: '1.05rem',
            maxWidth: 540,
            margin: '0 auto 2.5rem',
            lineHeight: 1.8,
          }}
        >
          Transformando infraestructura crítica en sistemas resilientes e inteligentes
        </motion.p>

        {/* CTAs */}
        <motion.div
          custom={4} variants={TEXT_VARIANTS} initial="hidden" animate="visible"
          style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}
        >
          <motion.a
            href="#experiencia"
            whileHover={{ scale: 1.04, boxShadow: '0 0 24px rgba(30,144,255,0.4)' }}
            whileTap={{ scale: 0.97 }}
            style={{
              padding: '0.75rem 1.8rem',
              borderRadius: 8,
              background: 'var(--blue)',
              color: '#fff',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '0.9rem',
              border: '2px solid var(--blue)',
              transition: 'background 0.2s',
            }}
          >
            Ver experiencia
          </motion.a>

          <motion.a
            href="#arquitectura"
            whileHover={{ scale: 1.04, boxShadow: '0 0 24px rgba(197,164,109,0.3)' }}
            whileTap={{ scale: 0.97 }}
            style={{
              padding: '0.75rem 1.8rem',
              borderRadius: 8,
              background: 'transparent',
              color: 'var(--gold)',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '0.9rem',
              border: '2px solid var(--gold)',
            }}
          >
            Explorar arquitectura
          </motion.a>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8, duration: 1 }}
          style={{ marginTop: '3.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}
        >
          <span style={{ fontSize: '0.7rem', color: 'var(--muted)', letterSpacing: '2px', textTransform: 'uppercase' }}>Scroll</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            style={{ width: 1.5, height: 28, background: 'linear-gradient(to bottom, var(--blue), transparent)', borderRadius: 2 }}
          />
        </motion.div>
      </div>
    </section>
  )
}
