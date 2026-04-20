'use client'

import { useRef, memo } from 'react'
import { motion, useInView } from 'framer-motion'
import SectionHeader from './ui/SectionHeader'
import FadeIn from './ui/FadeIn'
import Icon from './ui/Icon'
import { JOBS } from '@/data/experiencia'
import { hexToRgba } from '@/lib/utils'
import { useLanguage } from '@/context/LanguageContext'

/* ─── Timeline Item Component ─── */

const TimelineItem = memo(({ job, index }: { job: any; index: number }) => {
  const { t } = useLanguage()
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
            {t(job.periodKey)}
          </div>
          <h3 className="text-lg md:text-xl font-extrabold text-slate-100">{job.company}</h3>
          <div style={{ color: job.color }} className="text-sm font-medium">
            {t(job.roleKey)}
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
          {t(job.badgeKey)}
        </span>
      </div>

      {/* Highlights Grid */}
      <div className="flex flex-wrap gap-2 mb-4">
        {job.achievements.map((a: any) => (
          <div key={a.textKey} className="flex items-center gap-2.5 bg-white/5 border border-white/10 rounded-lg p-2 px-3">
            <Icon name={a.icon} label={t(a.textKey)} size={20} />
            <span className="text-xs text-slate-200">{t(a.textKey)}</span>
          </div>
        ))}
      </div>

      {/* Detail Bullets */}
      <ul className="space-y-1.5 mb-5">
        {job.bullets.map((bKey: string, i: number) => (
          <li key={i} className="text-sm text-slate-400 pl-4 relative leading-relaxed">
            <span style={{ color: job.color }} className="absolute left-0">▸</span>
            {t(bKey)}
          </li>
        ))}
      </ul>

      {/* Tech Keywords */}
      <div className="flex flex-wrap gap-1.5">
        {job.tags.map((tag: string) => (
          <span key={tag} 
            style={{ 
              color: job.color,
              background: hexToRgba(job.color, 0.08),
              borderColor: hexToRgba(job.color, 0.15)
            }}
            className="border rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
          >
            {tag}
          </span>
        ))}
      </div>
    </motion.div>
  )
})
TimelineItem.displayName = 'TimelineItem'

/* ─── Main Section Component ─── */

export default function Experiencia() {
  const { t } = useLanguage()
  return (
    <section id="experiencia" className="py-20 px-6 bg-slate-900">
      <div className="max-w-6xl mx-auto">
        <SectionHeader label={t('experience.label')} title={t('experience.title')} highlight={t('experience.highlight')} />

        <FadeIn delay={0.05}>
          <div className="flex flex-wrap gap-3 mb-10 md:mb-14">
            {[
              { label: t('experience.badge.years'), color: '#C5A46D' },
              { label: t('experience.badge.location'), color: '#1E90FF' },
              { label: t('experience.badge.tech'), color: '#10B981' },
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
