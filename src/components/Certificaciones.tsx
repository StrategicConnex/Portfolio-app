'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import SectionHeader from './ui/SectionHeader'

const certs = [
  { icon: '🎓', text: 'Licenciatura en Ciencias de la Computación – UNCO', tier: 'gold' },
  { icon: '📋', text: 'Project Management & IEC 62443 – Universidad Siglo 21', tier: 'gold' },
  { icon: '🔷', text: 'VMware Certified Associate – VCA-DCV', tier: 'blue' },
  { icon: '🌐', text: 'Cisco CCNA Routing & Switching', tier: 'blue' },
  { icon: '🔒', text: 'Cisco CyberSecurity', tier: 'blue' },
  { icon: '🪟', text: 'Microsoft MCSE', tier: 'blue' },
  { icon: '📐', text: 'SOX · NIST · ISO 27001 · IEC 62443', tier: 'gold' },
  { icon: '🌍', text: 'Inglés B2 – Intermedio Alto', tier: 'muted' },
]

export default function Certificaciones() {
  const ref    = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section style={{ padding: 'clamp(2rem, 5vw, 4rem) clamp(1rem, 5vw, 2rem)', background: 'var(--bg2)' }}>
      <div ref={ref} style={{ maxWidth: 1100, margin: 'auto' }}>
        <SectionHeader label="Formación" title="Certificaciones &" highlight="Educación" />

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(240px, 100%, 260px), 1fr))',
          gap: 'clamp(0.6rem, 1.5vw, 0.9rem)',
        }}>
          {certs.map((c, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.07 + 0.1 }}
              whileHover={{ scale: 1.02, borderColor: c.tier === 'gold' ? 'rgba(197,164,109,0.5)' : 'rgba(30,144,255,0.5)' }}
              style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                padding: 'clamp(0.7rem, 2vw, 0.9rem) clamp(0.8rem, 2vw, 1.2rem)',
                display: 'flex',
                alignItems: 'center',
                gap: 'clamp(0.6rem, 1.5vw, 0.8rem)',
                transition: 'border-color 0.2s',
                cursor: 'default',
              }}
            >
              {/* Icon badge */}
              <div style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: c.tier === 'gold'
                  ? 'rgba(197,164,109,0.15)'
                  : c.tier === 'blue'
                  ? 'rgba(30,144,255,0.12)'
                  : 'rgba(148,163,184,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1rem',
                flexShrink: 0,
              }}>
                {c.icon}
              </div>

              {/* Text */}
              <span style={{
                fontSize: '0.82rem',
                color: c.tier === 'gold'
                  ? 'var(--text)'
                  : 'var(--muted)',
                lineHeight: 1.45,
                fontWeight: c.tier === 'gold' ? 500 : 400,
              }}>
                {c.text}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
