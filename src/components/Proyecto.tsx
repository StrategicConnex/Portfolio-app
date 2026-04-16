'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import SectionHeader from './ui/SectionHeader'
import FadeIn from './ui/FadeIn'

const techTags = ['Next.js 14', 'Tailwind CSS', 'SSG', 'CI/CD', 'Vercel', 'SEO Semántico', 'TypeScript', 'Core Web Vitals']

const highlights = [
  { icon: '⚡', label: 'SSG + Next/Image', desc: 'Static Site Generation para tiempos de carga mínimos' },
  { icon: '🔍', label: 'SEO Semántico', desc: 'Arquitectura de información para YPF, PAE, Vista Oil' },
  { icon: '🚀', label: 'CI/CD en Vercel', desc: 'SDLC completo con alta disponibilidad y escalabilidad' },
  { icon: '📊', label: 'Dashboard B2B', desc: 'KPIs industriales + control documental + inteligencia comercial' },
]

const scores = [
  { label: 'Core Web Vitals', score: 97, color: '#1E90FF' },
  { label: 'Performance',     score: 95, color: '#1E90FF' },
  { label: 'SEO',             score: 100, color: '#10B981' },
  { label: 'Accesibilidad',   score: 92, color: '#C5A46D' },
  { label: 'Best Practices',  score: 96, color: '#8B5CF6' },
]

function ScoreBar({ label, score, color, delay }: { label: string; score: number; color: string; delay: number }) {
  const ref    = useRef(null)
  const inView = useInView(ref, { once: true })

  return (
    <div ref={ref} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.6rem' }}>
      <span style={{ fontSize: '0.76rem', color: 'var(--muted)', minWidth: 120 }}>{label}</span>
      <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.07)', borderRadius: 3, overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={inView ? { width: `${score}%` } : {}}
          transition={{ duration: 1.1, delay, ease: 'easeOut' }}
          style={{ height: '100%', borderRadius: 3, background: `linear-gradient(90deg, var(--blue), ${color})` }}
        />
      </div>
      <span style={{ fontSize: '0.77rem', fontWeight: 700, color, minWidth: 28, textAlign: 'right' }}>{score}</span>
    </div>
  )
}

export default function Proyecto() {
  return (
    <section id="proyecto" style={{ padding: '5rem 2rem', background: 'var(--bg)' }}>
      <div style={{ maxWidth: 1100, margin: 'auto' }}>
        <SectionHeader label="Proyecto destacado" title="Strategic" highlight="Connex" />

        <FadeIn delay={0.1}>
          <div style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 20,
            overflow: 'hidden',
          }}>
            {/* Top accent bar */}
            <div style={{ height: 3, background: 'linear-gradient(90deg, var(--blue), var(--gold))' }} />

            <div style={{ padding: '2.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', alignItems: 'start' }}>
              {/* Left */}
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--gold)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 700 }}>
                  Plataforma B2B · Full Stack · Vaca Muerta
                </div>
                <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text)', marginBottom: '0.5rem', lineHeight: 1.15 }}>
                  Inteligencia Comercial<br />
                  <span style={{ color: 'var(--gold)' }}>para Vaca Muerta</span>
                </h3>
                <p style={{ color: 'var(--muted)', fontSize: '0.88rem', lineHeight: 1.85, marginBottom: '1.25rem' }}>
                  Plataforma web de alto rendimiento centrada en la digitalización de servicios para el
                  ecosistema de Vaca Muerta. Dashboard de inteligencia para control documental,
                  seguimiento de KPIs industriales e integración comercial B2B con operadoras como
                  <span style={{ color: 'var(--text)' }}> YPF, PAE y Vista Oil</span>.
                </p>

                {/* Highlight chips */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginBottom: '1.5rem' }}>
                  {highlights.map(h => (
                    <div key={h.label} style={{
                      background: 'rgba(30,144,255,0.05)',
                      border: '1px solid rgba(30,144,255,0.12)',
                      borderRadius: 10,
                      padding: '0.75rem 0.9rem',
                    }}>
                      <div style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>{h.icon}</div>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.15rem' }}>{h.label}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--muted)', lineHeight: 1.4 }}>{h.desc}</div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.75rem' }}>
                  {techTags.map(t => <span key={t} className="tech-tag">{t}</span>)}
                </div>

                <motion.a
                  href="https://strategicconnex.vercel.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.04, boxShadow: '0 0 28px rgba(30,144,255,0.35)' }}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.8rem 1.8rem',
                    background: 'var(--blue)', color: '#fff',
                    textDecoration: 'none', fontWeight: 700, fontSize: '0.88rem',
                    borderRadius: 8, border: '2px solid var(--blue)',
                  }}
                >
                  Ver proyecto en vivo <span>↗</span>
                </motion.a>
              </div>

              {/* Right: Lighthouse panel */}
              <div>
                <div style={{
                  background: 'rgba(30,144,255,0.04)',
                  border: '1px solid rgba(30,144,255,0.14)',
                  borderRadius: 14,
                  padding: '1.75rem',
                  marginBottom: '1.25rem',
                }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--muted)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '1.1rem' }}>
                    Lighthouse Score
                  </div>
                  {scores.map((s, i) => (
                    <ScoreBar key={s.label} {...s} delay={0.3 + i * 0.1} />
                  ))}
                </div>

                <div style={{
                  background: 'rgba(197,164,109,0.06)',
                  border: '1px solid rgba(197,164,109,0.18)',
                  borderRadius: 14,
                  padding: '1.25rem 1.5rem',
                }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--gold)', fontWeight: 700, letterSpacing: '1px', marginBottom: '0.6rem', textTransform: 'uppercase' }}>
                    Arquitectura técnica
                  </div>
                  {[
                    'Next.js 14 App Router + SSG',
                    'Optimización Next/Image + lazy loading',
                    'CI/CD pipeline en Vercel',
                    'SEO semántico + schema markup',
                    'Homologación técnica: YPF · PAE · Vista',
                    'Dashboard KPIs industriales en tiempo real',
                  ].map(item => (
                    <div key={item} style={{ fontSize: '0.78rem', color: 'var(--muted)', padding: '0.2rem 0', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                      <span style={{ color: 'var(--gold)', flexShrink: 0 }}>▸</span>{item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>

      <style>{`
        @media (max-width: 700px) {
          #proyecto .proj-grid { grid-template-columns: 1fr !important; }
          #proyecto .highlight-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  )
}
