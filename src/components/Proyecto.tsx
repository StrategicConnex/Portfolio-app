'use client'

import Image from 'next/image'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import SectionHeader from './ui/SectionHeader'
import FadeIn from './ui/FadeIn'
import Icon from './ui/Icon'

const techTags = ['Next.js 14', 'Tailwind CSS', 'SSG', 'CI/CD', 'Vercel', 'SEO Semántico', 'TypeScript', 'Core Web Vitals']

const highlights = [
  { icon: 'speed', label: 'SSG + Next/Image', desc: 'Static Site Generation para tiempos de carga mínimos' },
  { icon: 'search', label: 'SEO Semántico', desc: 'Arquitectura de información para YPF, PAE, Vista Oil' },
  { icon: 'deployment', label: 'CI/CD en Vercel', desc: 'SDLC completo con alta disponibilidad y escalabilidad' },
  { icon: 'dashboard', label: 'Dashboard B2B', desc: 'KPIs industriales + control documental + inteligencia comercial' },
]

const metrics = [
  { label: 'Usuarios activos', value: '1.2K+', detail: 'Acceso móvil y desktop', color: '#1E90FF' },
  { label: 'Disponibilidad', value: '99.8%', detail: 'Uptime del servicio', color: '#10B981' },
  { label: 'Consultas procesadas', value: '1.5K/mes', detail: 'Trazabilidad B2B', color: '#F59E0B' },
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
    <section id="proyecto" style={{ padding: 'clamp(2rem, 5vw, 5rem) clamp(1rem, 5vw, 2rem)', background: 'var(--bg)' }}>
      <div style={{ maxWidth: 1100, margin: 'auto' }}>
        <SectionHeader label="Proyecto freelance" title="Strategic" highlight="Connex" />

        <FadeIn delay={0.1}>
          <div style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 20,
            overflow: 'hidden',
          }}>
            {/* Top accent bar */}
            <div style={{ height: 3, background: 'linear-gradient(90deg, var(--blue), var(--gold))' }} />

            <div style={{ padding: 'clamp(1.5rem, 4vw, 2.5rem)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'clamp(1.5rem, 4vw, 3rem)', alignItems: 'start' }}>
              {/* Left */}
              <div>
                <div style={{ fontSize: 'clamp(0.6rem, 1.2vw, 0.7rem)', color: 'var(--gold)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 700 }}>
                  Proyecto freelance · Full Stack · Vaca Muerta
                </div>
                <h3 style={{ fontSize: 'clamp(1.4rem, 4vw, 1.8rem)', fontWeight: 800, color: 'var(--text)', marginBottom: '0.5rem', lineHeight: 1.15 }}>
                  StrategicConnex<br />
                  <span style={{ color: 'var(--gold)' }}>Side project freelance</span>
                </h3>
                <p style={{ color: 'var(--muted)', fontSize: 'clamp(0.8rem, 1.8vw, 0.88rem)', lineHeight: 1.85, marginBottom: '1.25rem' }}>
                  Trabajo freelance desarrollado y gestionado por mí como especialista IT/OT y
                  ciberseguridad. Plataforma web de alto rendimiento para digitalizar servicios
                  del ecosistema de Vaca Muerta, con dashboard de control documental, monitoreo
                  de KPIs industriales e integración B2B con operadoras como
                  <span style={{ color: 'var(--text)' }}> YPF, PAE y Vista Oil</span>.
                </p>

                {/* Highlight chips */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'clamp(0.4rem, 1vw, 0.6rem)', marginBottom: '1.5rem' }}>
                  {highlights.map(h => (
                    <div key={h.label} style={{
                      background: 'rgba(30,144,255,0.05)',
                      border: '1px solid rgba(30,144,255,0.12)',
                      borderRadius: 10,
                      padding: 'clamp(0.5rem, 1.5vw, 0.75rem) clamp(0.6rem, 1.5vw, 0.9rem)',
                    }}>
                      <div style={{ marginBottom: '0.45rem' }}><Icon name={h.icon} label={h.label} size={28} /></div>
                      <div style={{ fontSize: 'clamp(0.68rem, 1.5vw, 0.78rem)', fontWeight: 700, color: 'var(--text)', marginBottom: '0.15rem' }}>{h.label}</div>
                      <div style={{ fontSize: 'clamp(0.65rem, 1.2vw, 0.7rem)', color: 'var(--muted)', lineHeight: 1.4 }}>{h.desc}</div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.75rem' }}>
                  {techTags.map(t => <span key={t} className="tech-tag">{t}</span>)}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '0.9rem', marginBottom: '1.75rem' }}>
                  {metrics.map(metric => (
                    <div key={metric.label} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '1rem' }}>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: metric.color, marginBottom: '0.35rem' }}>{metric.value}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--muted)', lineHeight: 1.5 }}>{metric.label}</div>
                    </div>
                  ))}
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

              {/* Right: Screenshot + metrics panel */}
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.9rem', marginBottom: '1.25rem' }}>
                  <div style={{ 
                    background: 'linear-gradient(135deg, rgba(14,165,233,0.18), rgba(15,23,42,0.08))', 
                    border: '1px solid rgba(255,255,255,0.08)', 
                    borderRadius: 16, 
                    minHeight: 180, 
                    padding: '0.75rem',
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.6rem' }}>Captura del dashboard</div>
                    <div style={{ flex: 1, borderRadius: 10, overflow: 'hidden', position: 'relative', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <Image 
                        src="/proyectopersonal.jpeg" 
                        alt="Captura del dashboard estratégico" 
                        fill 
                        style={{ objectFit: 'cover' }}
                      />
                    </div>
                  </div>
                  <div style={{ background: 'linear-gradient(135deg, rgba(234,179,8,0.16), rgba(15,23,42,0.08))', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, minHeight: 180, padding: '1rem' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.75rem' }}>Captura de control documental</div>
                    <div style={{ flex: 1, borderRadius: 12, background: 'rgba(255,255,255,0.06)', minHeight: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: '0.85rem' }}>
                      Panel de seguimiento B2B
                    </div>
                  </div>
                </div>

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
