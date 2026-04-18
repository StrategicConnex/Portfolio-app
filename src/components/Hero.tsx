'use client'

import Image from 'next/image'
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
        padding: 'clamp(2rem, 5vw, 6rem) clamp(1rem, 5vw, 2rem) clamp(2rem, 5vw, 4rem)',
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
      <motion.div
        aria-hidden="true"
        animate={{
          scale: [1, 1.05, 1],
          opacity: [0.07, 0.1, 0.07],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 700, height: 700,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(30,144,255,0.07) 0%, rgba(197,166,109,0.03) 50%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Animated gradient background */}
      <motion.div
        animate={{
          backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'linear',
        }}
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'linear-gradient(45deg, rgba(30,144,255,0.02), rgba(197,166,109,0.01), rgba(30,144,255,0.02))',
          backgroundSize: '400% 400%',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Content with Glassmorphism */}
      <motion.div
        className="hero-content"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: 900,
          padding: '3rem',
          borderRadius: 24,
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.05)',
        }}
      >
        <motion.div
          className="hero-avatar"
          custom={0} variants={TEXT_VARIANTS} initial="hidden" animate="visible"
          style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'center' }}
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            style={{
              width: 140,
              height: 140,
              borderRadius: '50%',
              overflow: 'hidden',
              border: '2px solid rgba(255, 255, 255, 0.2)',
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(255, 255, 255, 0.1)',
              position: 'relative',
            }}
          >
            <picture>
              <source srcSet="/JuanPalacios.webp" type="image/webp" />
              <source srcSet="/JuanPalacios.jpg" type="image/jpeg" />
              <Image
                src="/JuanPalacios.jpg"
                alt="Foto de perfil de Juan Palacios"
                width={140}
                height={140}
                sizes="(max-width: 640px) 110px, 140px"
                quality={85}
                priority
                loading="eager"
                placeholder="blur"
                blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA
                AAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0
                DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg=="
                style={{ borderRadius: '50%' }}
              />
            </picture>
          </motion.div>
        </motion.div>

        <div className="hero-copy">
          {/* Badge */}
          <motion.div
          custom={1} variants={TEXT_VARIANTS} initial="hidden" animate="visible"
          style={{ marginBottom: '1.5rem' }}
        >
          <motion.span
            whileHover={{ scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            style={{
              display: 'inline-block',
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(197, 166, 109, 0.3)',
              color: 'var(--gold)',
              fontSize: '0.72rem',
              letterSpacing: '2px',
              padding: '0.4rem 1.2rem',
              borderRadius: 24,
              textTransform: 'uppercase',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
            }}
          >
            React • AI • Analytics • Commercial Strategy
          </motion.span>
        </motion.div>

        {/* Name */}
        <motion.h1
          custom={2} variants={TEXT_VARIANTS} initial="hidden" animate="visible"
          style={{
            fontSize: 'clamp(2.8rem, 7vw, 4.5rem)',
            fontWeight: 900,
            lineHeight: 1.05,
            marginBottom: '0.75rem',
            color: 'var(--text)',
            letterSpacing: '-1px',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          }}
        >
          Juan{' '}
          <span
            style={{
              background: 'linear-gradient(135deg, #1E90FF 0%, #C5A46D 50%, #38BDF8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              textShadow: 'none',
            }}
          >
            Palacios
          </span>
        </motion.h1>

        {/* Title */}
        <motion.p
          custom={3} variants={TEXT_VARIANTS} initial="hidden" animate="visible"
          style={{
            fontSize: 'clamp(1.1rem, 2.8vw, 1.5rem)',
            color: 'var(--blue)',
            fontWeight: 600,
            marginBottom: '1.25rem',
            letterSpacing: '0.3px',
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
            lineHeight: 1.4,
          }}
        >
          Project Manager IT | Cibersecurity Leader | Cloud System Administrator | SysAdmin | Divulgador de #CulturaSegura | AI Solutions Architect | LLM Applications
        </motion.p>

        {/* Tagline */}
        <motion.p
          custom={4} variants={TEXT_VARIANTS} initial="hidden" animate="visible"
          style={{
            color: 'var(--muted)',
            fontSize: '1.15rem',
            maxWidth: 600,
            margin: '0 auto 3rem',
            lineHeight: 1.7,
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
            fontWeight: 400,
          }}
        >
          Building intelligent digital solutions for business growth.
        </motion.p>

        {/* CTAs */}
        <motion.div
          custom={5} variants={TEXT_VARIANTS} initial="hidden" animate="visible"
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
    </div>
    </section>
  )
}
