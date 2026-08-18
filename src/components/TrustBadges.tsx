'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import FadeIn from './ui/FadeIn'
import SectionHeader from './ui/SectionHeader'
import Icon from './ui/Icon'
import { useLanguage } from '@/context/LanguageContext'

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
    yearsKey: 'trust.years.present',
    sector: 'Oil & Gas',
    color: '#F97316',
    text: 'var(--c-orange)',
    icon: 'energy',
  },
  {
    name: 'OPS',
    full: 'Oilfield Production Services SRL',
    yearsKey: 'trust.years.ops',
    sector: 'Oil & Gas',
    color: '#C5A46D',
    text: 'var(--gold)',
    icon: 'oil',
  },
  {
    name: 'EXT',
    full: 'Exterran Argentina SRL',
    yearsKey: 'trust.years.ext',
    sector: 'Natural Gas Processing',
    color: '#6366F1',
    text: 'var(--c-indigo)',
    icon: 'industry',
  },
]

/* ── Operators / clients referenced ── */
const operators = [
  { name: 'YPF',      color: '#94A3B8', descKey: 'trust.operators.homologacion' },
  { name: 'PAE',      color: '#94A3B8', descKey: 'trust.operators.gestion'  },
  { name: 'Vista Oil',color: '#94A3B8', descKey: 'trust.operators.b2b'       },
  { name: 'Vaca Muerta', color: '#94A3B8', descKey: 'trust.operators.regional' },
]

function BadgePill({ delay, children }: { delay: number; children: React.ReactNode }) {
  const ref    = useRef(null)
  const inView = useInView(ref, { once: true })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.92, y: 12 }}
      animate={inView ? { opacity: 1, scale: 1, y: 0 } : {}}
      transition={{ delay, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
      whileHover={{ scale: 1.04, borderColor: 'rgba(148,163,184,0.35)' }}
    >
      {children}
    </motion.div>
  )
}

export default function TrustBadges() {
  const { t } = useLanguage()

  return (
    <section id="confianza" className="py-16 sm:py-24 px-4 sm:px-6 md:px-8" style={{ background: 'var(--bg2)', borderTop: '1px solid var(--border)' }}>
      <div style={{ maxWidth: 1100, margin: 'auto' }}>
        <SectionHeader label={t('trust.label')} title={t('trust.title')} highlight={t('trust.highlight')} />

        {/* Companies */}
        <FadeIn delay={0.05} variant="blur">
          <p style={{ fontSize: 'clamp(0.63rem, 1.2vw, 0.68rem)', color: 'var(--text-subtle)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 'clamp(0.75rem, 1.5vw, 1rem)', fontWeight: 600 }}>
            {t('trust.history')}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(240px, 100%, 260px), 1fr))', gap: 'clamp(0.6rem, 1.5vw, 0.9rem)', marginBottom: 'clamp(2rem, 4vw, 3rem)' }}>
            {companies.map((c, i) => (
              <BadgePill key={c.name} delay={i * 0.08}>
                <div 
                  className="night-vision-card"
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--surface-border)',
                    borderRadius: 12, padding: 'clamp(0.8rem, 2vw, 1.1rem) clamp(0.9rem, 2vw, 1.3rem)',
                    display: 'flex', gap: 'clamp(0.6rem, 1.5vw, 1rem)', alignItems: 'center',
                    overflow: 'hidden'
                  }}
                >
                  <div style={{
                    width: 'clamp(44px, 10vw, 52px)', height: 'clamp(44px, 10vw, 52px)', borderRadius: 10, flexShrink: 0,
                    background: `rgba(${parseInt(c.color.slice(1,3),16)}, ${parseInt(c.color.slice(3,5),16)}, ${parseInt(c.color.slice(5,7),16)}, 0.12)`,
                    border: `1px solid ${c.color}33`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon name={c.icon} label={c.full} size={26} />
                  </div>
                  <div style={{ position: 'relative', zIndex: 3 }}>
                    <div style={{ fontSize: 'clamp(0.8rem, 1.6vw, 0.88rem)', fontWeight: 700, color: 'var(--text)' }}>{c.full}</div>
                    <div style={{ fontSize: 'clamp(0.65rem, 1.3vw, 0.72rem)', color: c.text, fontWeight: 600 }}>{t(c.yearsKey)}</div>
                    <div style={{ fontSize: 'clamp(0.63rem, 1.2vw, 0.7rem)', color: 'var(--text-muted)' }}>{c.sector}</div>
                  </div>
                </div>
              </BadgePill>
            ))}
          </div>
        </FadeIn>

        {/* Standards grid */}
        <FadeIn delay={0.15} variant="blur">
          <p style={{ fontSize: 'clamp(0.63rem, 1.2vw, 0.68rem)', color: 'var(--text-subtle)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 'clamp(0.75rem, 1.5vw, 1rem)', fontWeight: 600 }}>
            {t('trust.standards')}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginBottom: '3rem' }}>
            {standards.map((s, i) => (
              <BadgePill key={s.label} delay={i * 0.05 + 0.1}>
                <div style={{
                  background: 'var(--surface-fill)',
                  border: '1px solid var(--surface-border)',
                  borderRadius: 8, padding: '0.55rem 1rem',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.1rem',
                  minWidth: 90,
                  cursor: 'default',
                  transition: 'border-color 0.2s',
                }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '0.5px' }}>{s.label}</span>
                  <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.2 }}>{s.sub}</span>
                </div>
              </BadgePill>
            ))}
          </div>
        </FadeIn>

        {/* Operators */}
        <FadeIn delay={0.2} variant="blur">
          <p style={{ fontSize: '0.68rem', color: 'var(--text-subtle)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '1rem', fontWeight: 600 }}>
            {t('trust.ecosystem')}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {operators.map((o, i) => (
              <BadgePill key={o.name} delay={i * 0.06}>
                <div style={{
                  background: 'var(--surface-fill)',
                  border: '1px solid var(--surface-border)',
                  borderRadius: 6, padding: '0.45rem 1rem',
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  transition: 'border-color 0.2s',
                }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>{o.name}</span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>·</span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{t(o.descKey)}</span>
                </div>
              </BadgePill>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
