'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import SectionHeader from './ui/SectionHeader'
import Icon from './ui/Icon'

const certs = [
  { icon: 'certificate', text: 'Analista de sistemas – UNCO', tier: 'gold' },
  { icon: 'document', text: 'Project Management & IEC 62443 – Universidad Siglo 21', tier: 'gold' },
  { icon: 'cloud', text: 'VMware Certified Associate – VCA-DCV', tier: 'blue' },
  { icon: 'network', text: 'Cisco CCNA Routing & Switching', tier: 'blue' },
  { icon: 'security', text: 'Cisco CyberSecurity', tier: 'blue' },
  { icon: 'windows', text: 'Microsoft MCSE', tier: 'blue' },
  { icon: 'compliance', text: 'SOX · NIST · ISO 27001 · IEC 62443', tier: 'gold' },
  { icon: 'world', text: 'Inglés B2 – Intermedio Alto', tier: 'muted' },
]

export default function Certificaciones() {
  const ref    = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section style={{ padding: 'clamp(2rem, 5vw, 4rem) clamp(1rem, 5vw, 2rem)', background: 'var(--bg2)' }}>
      <div ref={ref} style={{ maxWidth: 1100, margin: 'auto' }}>
        <SectionHeader label="Formación" title="Certificaciones &" highlight="Educación" />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {certs.map((c, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 15 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.05 + 0.1 }}
              whileHover={{ scale: 1.02, borderColor: c.tier === 'gold' ? 'rgba(197,164,109,0.5)' : 'rgba(30,144,255,0.5)' }}
              style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.85rem',
                transition: 'border-color 0.2s',
              }}
            >
              {/* Icon badge */}
              <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: c.tier === 'gold'
                    ? 'rgba(197,164,109,0.15)'
                    : c.tier === 'blue'
                    ? 'rgba(30,144,255,0.12)'
                    : 'rgba(148,163,184,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Icon name={c.icon} label={c.text} size={20} />
                </div>

              {/* Text */}
              <span className={`text-[12px] sm:text-[13px] leading-snug ${c.tier === 'gold' ? 'text-white font-medium' : 'text-slate-400'}`}>
                {c.text}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
