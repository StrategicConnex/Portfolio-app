'use client'

import { useRef, memo } from 'react'
import { motion, useInView } from 'framer-motion'
import SectionHeader from './ui/SectionHeader'
import FadeIn from './ui/FadeIn'
import Icon from './ui/Icon'
import { JOBS } from '@/data/experiencia'
import { hexToRgba } from '@/lib/utils'

/* ─── Timeline Item Component ─── */

const TimelineItem = memo(({ job, index }: { job: typeof JOBS[0]; index: number }) => {
  const ref    = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: -30 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.65, delay: index * 0.12, ease: 'easeOut' }}
      className="relative pl-9 mb-14"
    >
      {/* Connector Dot */}
      <motion.div
        initial={{ scale: 0 }}
        animate={inView ? { scale: 1 } : {}}
        transition={{ delay: index * 0.12 + 0.2, type: 'spring', stiffness: 260 }}
        style={{ 
          background: job.color, 
          boxShadow: `0 0 0 3px ${hexToRgba(job.color, 0.2)}` 
        }}
        className="absolute left-[-10px] top-1.5 w-4 h-4 rounded-full border-2 border-slate-900 z-10"
      />

      {/* Header Info */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
        <div className="space-y-1">
          <div style={{ color: job.color }} className="text-[11px] font-bold tracking-[1px] uppercase">
            {job.period}
          </div>
          <h3 className="text-lg md:text-xl font-extrabold text-slate-100">{job.company}</h3>
          <div style={{ color: job.color }} className="text-sm font-medium">
            {job.role}
          </div>
        </div>
        
        <span 
          style={{ 
            color: job.color,
            background: hexToRgba(job.color, 0.12),
            borderColor: hexToRgba(job.color, 0.2)
          }}
          className="border rounded-full px-3 py-0.5 text-[10px] font-bold shrink-0 self-start mt-1"
        >
          {job.badge}
        </span>
      </div>

      {/* Highlights Grid */}
      <div className="flex flex-wrap gap-2 mb-4">
        {job.achievements.map((a) => (
          <div key={a.text} className="flex items-center gap-2.5 bg-white/5 border border-white/10 rounded-lg p-2 px-3">
            <Icon name={a.icon} label={a.text} size={20} />
            <span className="text-xs text-slate-200">{a.text}</span>
          </div>
        ))}
      </div>

      {/* Detail Bullets */}
      <ul className="space-y-1.5 mb-5">
        {job.bullets.map((b, i) => (
          <li key={i} className="text-sm text-slate-400 pl-4 relative leading-relaxed">
            <span style={{ color: job.color }} className="absolute left-0">▸</span>
            {b}
          </li>
        ))}
      </ul>

      {/* Tech Keywords */}
      <div className="flex flex-wrap gap-1.5">
        {job.tags.map(t => (
          <span key={t} 
            style={{ 
              color: job.color,
              background: hexToRgba(job.color, 0.08),
              borderColor: hexToRgba(job.color, 0.15)
            }}
            className="border rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
          >
            {t}
          </span>
        ))}
      </div>
    </motion.div>
  )
})
TimelineItem.displayName = 'TimelineItem'

/* ─── Main Section Component ─── */

export default function Experiencia() {
  return (
    <section id="experiencia" className="py-20 px-6 bg-slate-900">
      <div className="max-w-6xl mx-auto">
        <SectionHeader label="Trayectoria" title="Experiencia" highlight="Laboral" />

        <FadeIn delay={0.05}>
          <div className="flex flex-wrap gap-3 mb-10 md:mb-14">
            {[
              { label: '20+ años en el sector industrial', color: '#C5A46D' },
              { label: 'Oil & Gas · Neuquén · Argentina', color: '#1E90FF' },
              { label: 'IT/OT · Cloud · Security · Dev', color: '#10B981' },
            ].map(b => (
              <span key={b.label} 
                style={{ 
                  color: b.color,
                  background: hexToRgba(b.color, 0.1),
                  borderColor: hexToRgba(b.color, 0.2)
                }}
                className="border rounded-full px-4 py-1.5 text-xs font-bold"
              >
                ✦ {b.label}
              </span>
            ))}
          </div>
        </FadeIn>

        {/* Timeline Horizontal Layout */}
        <div className="relative pl-2">
          {/* Vertical Line */}
          <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 via-amber-500 to-indigo-500 rounded-full opacity-50" />
          
          <div className="space-y-4">
            {JOBS.map((job, i) => (
              <TimelineItem key={job.company} job={job} index={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
