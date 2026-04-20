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
        <SectionHeader label="Proyecto freelance" title="Strategic" highlight="Connex"        <FadeIn delay={0.1}>
          <div style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 20,
            overflow: 'hidden',
          }}>
            {/* Top accent bar */}
            <div style={{ height: 3, background: 'linear-gradient(90deg, var(--blue), var(--gold))' }} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 p-6 sm:p-10">
              {/* Left */}
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--gold)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 700 }}>
                  Proyecto freelance · Full Stack
                </div>
                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white mb-3 leading-tight">
                  StrategicConnex
                </h3>
                <p className="text-slate-400 text-sm sm:text-base leading-relaxed mb-6">
                  Transformación digital para el ecosistema de Vaca Muerta. Dashboard de control documental, monitoreo
                  de KPIs industriales e integración B2B con operadoras líderes como
                  <span className="text-white font-medium"> YPF, PAE y Vista Energy</span>.
                </p>

                {/* Highlight chips */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                  {highlights.map(h => (
                    <div key={h.label} style={{
                      background: 'rgba(30,144,255,0.05)',
                      border: '1px solid rgba(30,144,255,0.12)',
                      borderRadius: 10,
                      padding: '0.75rem 1rem',
                    }}>
                      <div className="mb-2"><Icon name={h.icon} label={h.label} size={24} /></div>
                      <div className="text-xs sm:text-sm font-bold text-white mb-1">{h.label}</div>
                      <div className="text-[11px] sm:text-xs text-slate-500 leading-snug">{h.desc}</div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2 mb-6">
                  {techTags.map(t => <span key={t} className="tech-tag">{t}</span>)}
                </div>

                <div className="grid grid-cols-3 gap-3 mb-8">
                  {metrics.map(metric => (
                    <div key={metric.label} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '0.75rem' }}>
                      <div className="text-lg sm:text-xl font-extrabold mb-1" style={{ color: metric.color }}>{metric.value}</div>
                      <div className="text-[10px] sm:text-xs text-slate-500 leading-tight uppercase font-bold tracking-tighter">{metric.label}</div>
                    </div>
                  ))}
                </div>

                <motion.a
                  href="https://strategicconnex.vercel.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.04, boxShadow: '0 0 28px rgba(30,144,255,0.35)' }}
                  whileTap={{ scale: 0.97 }}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-blue-600 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-blue-500/20"
                >
                  Ver proyecto en vivo <span>↗</span>
                </motion.a>
              </div>

              {/* Right: Screenshot + metrics panel */}
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-800/20 border border-white/5 rounded-2xl p-3 flex flex-col h-[200px] sm:h-[180px]">
                    <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-3 font-bold">Captura Dashboard</div>
                    <div className="flex-1 relative rounded-xl overflow-hidden grayscale hover:grayscale-0 transition-all duration-700">
                      <Image 
                        src="/proyectopersonal.jpeg" 
                        alt="Captura del dashboard estratégico" 
                        fill 
                        style={{ objectFit: 'cover' }}
                      />
                    </div>
                  </div>
                  <div className="bg-slate-800/20 border border-white/5 rounded-2xl p-4 flex flex-col justify-center items-center text-center">
                    <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-4 font-bold">Control B2B</div>
                    <div className="text-xs text-slate-400 italic">Panel de seguimiento para operadoras de primer nivel</div>
                  </div>
                </div>

                <div style={{
                  background: 'rgba(30,144,255,0.04)',
                  border: '1px solid rgba(30,144,255,0.14)',
                  borderRadius: 14,
                  padding: '1.5rem',
                }}>
                  <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-6 font-bold">Lighthouse Scores</div>
                  {scores.map((s, i) => (
                    <ScoreBar key={s.label} {...s} delay={0.3 + i * 0.1} />
                  ))}
                </div>

                <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-6">
                  <div className="text-[10px] text-amber-500 font-bold tracking-widest uppercase mb-4">Arquitectura Técnica</div>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      'Next.js 14 App Router + SSG',
                      'Optimización Next/Image',
                      'CI/CD pipeline en Vercel',
                      'SEO semántico + schema',
                      'Homologación técnica Oil & Gas',
                    ].map(item => (
                      <div key={item} className="text-xs text-slate-400 flex gap-2 items-start">
                        <span className="text-amber-500">▸</span>{item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
