'use client'

import { motion } from 'framer-motion'
import SectionHeader from './ui/SectionHeader'
import FadeIn from './ui/FadeIn'

const contacts = [
  {
    icon: '✉',
    iconBg: 'rgba(30,144,255,0.12)',
    iconColor: 'var(--blue)',
    label: 'palacios_juan@hotmail.com',
    sub: 'Email profesional',
    href: 'mailto:palacios_juan@hotmail.com',
  },
  {
    icon: '📞',
    iconBg: 'rgba(16,185,129,0.12)',
    iconColor: '#10B981',
    label: '+54 299 586 9435',
    sub: 'WhatsApp / Llamadas',
    href: 'https://wa.me/542995869435',
    external: true,
  },
  {
    icon: 'in',
    iconBg: 'rgba(10,102,194,0.18)',
    iconColor: '#0A66C2',
    label: 'linkedin.com/in/juanfpalacios',
    sub: 'LinkedIn',
    href: 'https://linkedin.com/in/juanfpalacios',
    external: true,
  },
  {
    icon: '📍',
    iconBg: 'rgba(197,164,109,0.12)',
    iconColor: 'var(--gold)',
    label: 'Neuquén, Argentina',
    sub: 'Disponible para trabajo remoto y presencial',
    href: null,
  },
]

export default function Contacto() {
  return (
    <section id="contacto" style={{ padding: '5rem 2rem', background: 'var(--bg2)' }}>
      <div style={{ maxWidth: 1100, margin: 'auto' }}>
        <SectionHeader label="Contacto" title="Trabajemos" highlight="Juntos" center />

        <div style={{ maxWidth: 580, margin: '0 auto' }}>
          <FadeIn delay={0.1}>
            <p style={{ color: 'var(--muted)', textAlign: 'center', marginBottom: '2rem', fontSize: '0.95rem', lineHeight: 1.8 }}>
              Especializado en proyectos de alta criticidad en entornos industriales Oil &amp; Gas.
              Disponible para consultoría, arquitectura IT/OT, ciberseguridad y liderazgo técnico.
            </p>
          </FadeIn>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '2rem' }}>
            {contacts.map((c, i) => (
              <FadeIn key={i} delay={i * 0.08 + 0.15} direction="left">
                {c.href ? (
                  <motion.a
                    href={c.href}
                    target={c.external ? '_blank' : undefined}
                    rel={c.external ? 'noopener noreferrer' : undefined}
                    whileHover={{ borderColor: c.iconColor, x: 4 }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '1rem',
                      padding: '1rem 1.4rem',
                      background: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: 10,
                      textDecoration: 'none', color: 'var(--text)',
                      transition: 'border-color 0.2s',
                    }}
                  >
                    <div style={{
                      width: 40, height: 40, borderRadius: 10,
                      background: c.iconBg, color: c.iconColor,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1rem', fontWeight: 700, flexShrink: 0,
                    }}>
                      {c.icon}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>{c.label}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>{c.sub}</div>
                    </div>
                    <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: c.iconColor, opacity: 0.7 }}>↗</span>
                  </motion.a>
                ) : (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '1rem',
                    padding: '1rem 1.4rem', background: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: 10, color: 'var(--text)',
                  }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10,
                      background: c.iconBg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1rem', flexShrink: 0,
                    }}>
                      {c.icon}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>{c.label}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>{c.sub}</div>
                    </div>
                  </div>
                )}
              </FadeIn>
            ))}
          </div>

          {/* CTA */}
          <FadeIn delay={0.55}>
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <motion.div
                animate={{ boxShadow: ['0 0 0px rgba(74,222,128,0)', '0 0 20px rgba(74,222,128,0.25)', '0 0 0px rgba(74,222,128,0)'] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                  background: 'rgba(34,197,94,0.08)', color: '#4ade80',
                  border: '1px solid rgba(34,197,94,0.25)',
                  padding: '0.5rem 1.25rem', borderRadius: 20,
                  fontSize: '0.84rem', fontWeight: 600,
                }}
              >
                <motion.div
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80', flexShrink: 0 }}
                />
                Disponible para proyectos de alta criticidad
              </motion.div>

              <motion.a
                href="mailto:palacios_juan@hotmail.com"
                whileHover={{ scale: 1.04, boxShadow: '0 0 24px rgba(197,164,109,0.3)' }}
                whileTap={{ scale: 0.97 }}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.75rem 2rem',
                  background: 'transparent', color: 'var(--gold)',
                  textDecoration: 'none', fontWeight: 700, fontSize: '0.9rem',
                  borderRadius: 8, border: '2px solid var(--gold)',
                }}
              >
                Iniciar conversación →
              </motion.a>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  )
}
