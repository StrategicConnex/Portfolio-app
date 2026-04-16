'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import FadeIn from './ui/FadeIn'
import SectionHeader from './ui/SectionHeader'

/* ── Standards & Certifications (text-based, grayscale style) ── */
const standards = [
  { label: 'IEC 62443',   sub: 'Industrial Cybersecurity', color: '#94A3B8' },
  { label: 'NIST CSF',    sub: 'Cybersecurity Framework',  color: '#94A3B8' },
  { label: 'ISO 27001',   sub: 'Information Security',     color: '#94A3B8' },
  { label: 'SOX',         sub: 'Financial Compliance IT',  color: '#94A3B8' },
  { label: 'PMI',         sub: 'Project Management',       color: '#94A3B8' },
  { label: 'CCNA',        sub: 'Cisco Networking',         color: '#94A3B8' },
  { label: 'MCSE',        sub: 'Microsoft Certified',      color: '#94A3B8' },
  { label: 'VCA-DCV',     sub: 'VMware Certified',         color: '#94A3B8' },
]

/* ── Companies worked with ── */
const companies = [
  {
    name: 'YPY',
    full: 'YPY Oilfield Services',
    years: '2025 – Actual',
    sector: 'Oil & Gas',
    color: '#F97316',
    icon: '⚡',
  },
  {
    name: 'OPS',
    full: 'Oilfield Production Services SRL',
    years: '2013 – 2024',
    sector: 'Oil & Gas',
    color: '#C5A46D',
    icon: '🛢️',
  },
  {
    name: 'EXT',
    full: 'Exterran Argentina SRL',
    years: '2003 – 2013',
    sector: 'Natural Gas Processing',
    color: '#6366F1',
    icon: '🏭',
  },
]

/* ── Operators / clients referenced ── */
const operators = [
  { name: 'YPF',      color: '#94A3B8', desc: 'Homologación técnica' },
  { name: 'PAE',      color: '#94A3B8', desc: 'Gestión de legajos'  },
  { name: 'Vista Oil',color: '#94A3B8', desc: 'Servicios B2B'       },
  { name: 'Vaca Muerta', color: '#94A3B8', desc: 'Ecosistema regional' },
]

function BadgePill({ delay, children }: { delay: number; children: React.ReactNode }) {
  const ref    = useRef(null)
  const inView = useInView(ref, { once: true })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 10 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay, duration: 0.4 }}
      whileHover={{ scale: 1.04, borderColor: 'rgba(148,163,184,0.35)' }}
    >
      {children}
    </motion.div>
  )
}

export default function TrustBadges() {
  return (
    <section id="confianza" style={{ padding: '4rem 2rem', background: 'var(--bg2)', borderTop: '1px solid var(--border)' }}>
      <div style={{ maxWidth: 1100, margin: 'auto' }}>
        <SectionHeader label="Validación profesional" title="Empresas &" highlight="Estándares" />

        {/* Companies */}
        <FadeIn delay={0.05}>
          <p style={{ fontSize: '0.68rem', color: 'var(--muted)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '1rem', fontWeight: 600 }}>
            Historial corporativo
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.9rem', marginBottom: '3rem' }}>
            {companies.map((c, i) => (
              <BadgePill key={c.name} delay={i * 0.08}>
                <div style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 12, padding: '1.1rem 1.3rem',
                  display: 'flex', gap: '1rem', alignItems: 'center',
                  transition: 'border-color 0.2s',
                }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: 10, flexShrink: 0,
                    background: `rgba(${parseInt(c.color.slice(1,3),16)}, ${parseInt(c.color.slice(3,5),16)}, ${parseInt(c.color.slice(5,7),16)}, 0.1)`,
                    border: `1px solid ${c.color}33`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.5rem',
                  }}>
                    {c.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text)' }}>{c.full}</div>
                    <div style={{ fontSize: '0.72rem', color: c.color, fontWeight: 600 }}>{c.years}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>{c.sector}</div>
                  </div>
                </div>
              </BadgePill>
            ))}
          </div>
        </FadeIn>

        {/* Standards grid */}
        <FadeIn delay={0.15}>
          <p style={{ fontSize: '0.68rem', color: 'var(--muted)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '1rem', fontWeight: 600 }}>
            Certificaciones y estándares
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginBottom: '3rem' }}>
            {standards.map((s, i) => (
              <BadgePill key={s.label} delay={i * 0.05 + 0.1}>
                <div style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(148,163,184,0.15)',
                  borderRadius: 8, padding: '0.55rem 1rem',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.1rem',
                  minWidth: 90,
                  cursor: 'default',
                  transition: 'border-color 0.2s',
                }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'rgba(226,232,240,0.9)', letterSpacing: '0.5px' }}>{s.label}</span>
                  <span style={{ fontSize: '0.62rem', color: 'var(--muted)', textAlign: 'center', lineHeight: 1.2 }}>{s.sub}</span>
                </div>
              </BadgePill>
            ))}
          </div>
        </FadeIn>

        {/* Operators */}
        <FadeIn delay={0.2}>
          <p style={{ fontSize: '0.68rem', color: 'var(--muted)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '1rem', fontWeight: 600 }}>
            Ecosistema de operadoras — Vaca Muerta
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {operators.map((o, i) => (
              <BadgePill key={o.name} delay={i * 0.06}>
                <div style={{
                  background: 'rgba(255,255,255,0.025)',
                  border: '1px solid rgba(148,163,184,0.12)',
                  borderRadius: 6, padding: '0.45rem 1rem',
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  transition: 'border-color 0.2s',
                }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'rgba(226,232,240,0.75)' }}>{o.name}</span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--muted)' }}>·</span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--muted)' }}>{o.desc}</span>
                </div>
              </BadgePill>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
