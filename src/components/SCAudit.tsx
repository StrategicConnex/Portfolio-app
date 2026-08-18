'use client'

import { memo } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import SectionHeader from './ui/SectionHeader'
import FadeIn from './ui/FadeIn'
import { useLanguage } from '@/context/LanguageContext'

/* ─── Feature card data ─── */
type FeatureKey =
  | 'rum'
  | 'vitals'
  | 'audit'
  | 'seo'
  | 'errors'
  | 'ai'
  | 'score'
  | 'reports'

interface Feature {
  key: FeatureKey
  icon: string
  color: string
  accent: string
}

const FEATURES: Feature[] = [
  { key: 'rum',     icon: '⟳',  color: 'text-[var(--info)]',    accent: 'border-cyan-500/20 bg-cyan-500/5 hover:border-cyan-500/40' },
  { key: 'vitals',  icon: '⚡', color: 'text-[var(--ok)]',      accent: 'border-emerald-500/20 bg-emerald-500/5 hover:border-emerald-500/40' },
  { key: 'audit',   icon: '⊕',  color: 'text-[var(--blue)]',    accent: 'border-blue-500/20 bg-blue-500/5 hover:border-blue-500/40' },
  { key: 'seo',     icon: '⌕',  color: 'text-[var(--violet)]',  accent: 'border-violet-500/20 bg-violet-500/5 hover:border-violet-500/40' },
  { key: 'errors',  icon: '⚠',  color: 'text-[var(--warn)]',    accent: 'border-amber-500/20 bg-amber-500/5 hover:border-amber-500/40' },
  { key: 'ai',      icon: '✦',  color: 'text-[var(--rose)]',    accent: 'border-rose-500/20 bg-rose-500/5 hover:border-rose-500/40' },
  { key: 'score',   icon: '◎',  color: 'text-[var(--teal)]',    accent: 'border-teal-500/20 bg-teal-500/5 hover:border-teal-500/40' },
  { key: 'reports', icon: '⊞',  color: 'text-[var(--indigo)]',  accent: 'border-indigo-500/20 bg-indigo-500/5 hover:border-indigo-500/40' },
]

/* ─── Metric pill data ─── */
interface Metric {
  label: string
  value: string
  sub: string
  status: 'good' | 'warn' | 'info'
}

const METRICS: Metric[] = [
  { label: 'LCP',           value: '1.8s',  sub: 'Largest Contentful Paint', status: 'good' },
  { label: 'CLS',           value: '0.03',  sub: 'Cumulative Layout Shift',  status: 'good' },
  { label: 'INP',           value: '210ms', sub: 'Interaction to Next Paint', status: 'warn' },
  { label: 'Lighthouse',    value: '91.4',  sub: 'Global Performance Index',  status: 'info' },
  { label: 'SEO Health',    value: '88%',   sub: 'Technical SEO Score',       status: 'good' },
  { label: 'Error Rate',    value: '0.2%',  sub: 'Frontend Error Rate',       status: 'good' },
]

const statusColor = (s: Metric['status']) =>
  s === 'good' ? 'text-[var(--ok)] border-emerald-500/20 bg-emerald-500/5'
  : s === 'warn' ? 'text-[var(--warn)] border-amber-500/20 bg-amber-500/5'
  : 'text-[var(--info)] border-cyan-500/20 bg-cyan-500/5'

/* ─── Component ─── */
const SCAudit = () => {
  const { t } = useLanguage()

  return (
    <section
      id="scaudit"
      className="py-24 sm:py-32 relative overflow-hidden"
      aria-label={t('scaudit.label')}
    >
      {/* ── Background separators ── */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#1E90FF30] to-transparent" />
      <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#C5A46D20] to-transparent" />

      {/* ── Decorative gradient orb ── */}
      <div
        className="absolute top-1/3 right-0 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(30,144,255,0.04) 0%, transparent 70%)',
        }}
        aria-hidden="true"
      />

      <div className="container px-4 mx-auto max-w-7xl">

        {/* ── Section header ── */}
        <FadeIn>
          <SectionHeader
            label={t('scaudit.label')}
            title={t('scaudit.title')}
            highlight={t('scaudit.highlight')}
            center={false}
          />
        </FadeIn>

        {/* ── Description + Badge row ── */}
        <FadeIn delay={0.1}>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-14 -mt-4">
            <p className="text-[var(--text-muted)] text-[0.9rem] leading-relaxed max-w-2xl">
              {t('scaudit.description')}
            </p>
            <div className="flex flex-wrap gap-2 sm:ml-auto flex-shrink-0">
              {['SOC 2', 'Lighthouse v12', 'GSC API'].map(badge => (
                <span
                  key={badge}
                  className="text-[0.6rem] font-bold uppercase tracking-widest px-2.5 py-1 rounded border border-[var(--surface-border)] bg-[var(--surface-fill)] text-[var(--text-muted)]"
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>
        </FadeIn>

        {/* ── Main grid: image left + features right ── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-10 xl:gap-16 items-start mb-16">

          {/* Left: product visual */}
          <FadeIn direction="left" delay={0.1}>
            <div className="relative rounded-2xl overflow-hidden border border-[var(--surface-border)] shadow-[0_30px_80px_rgba(0,0,0,0.6)] group">
              {/* Scanline effect overlay */}
              <div
                className="absolute inset-0 z-10 pointer-events-none"
                style={{
                  background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(30,144,255,0.015) 2px, rgba(30,144,255,0.015) 4px)',
                }}
                aria-hidden="true"
              />
              {/* Status bar */}
              <div className="absolute top-3 left-3 z-20 flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-md px-2.5 py-1.5 border border-[var(--surface-border)]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[0.6rem] font-mono font-bold text-[var(--ok)] uppercase tracking-widest">
                  {t('scaudit.status.live')}
                </span>
              </div>
              <Image
                src="/scaudit-dashboard.webp"
                alt={t('scaudit.img.alt')}
                width={960}
                height={600}
                className="w-full h-auto block transition-transform duration-700 group-hover:scale-[1.01]"
                priority={false}
              />
              {/* Bottom gradient overlay */}
              <div
                className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
                style={{ background: 'linear-gradient(to top, var(--bg) 0%, transparent 100%)' }}
                aria-hidden="true"
              />
            </div>
          </FadeIn>

          {/* Right: feature cards grid */}
          <FadeIn direction="right" delay={0.2}>
            <div className="grid grid-cols-2 gap-3">
              {FEATURES.map((f, i) => (
                <motion.div
                  key={f.key}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: 0.05 * i }}
                  className={`glass rounded-xl p-4 border transition-all duration-300 cursor-default group ${f.accent}`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`text-xl leading-none mt-0.5 flex-shrink-0 ${f.color}`}
                      aria-hidden="true"
                    >
                      {f.icon}
                    </span>
                    <div className="min-w-0">
                      <div className={`text-[0.72rem] font-bold mb-0.5 transition-colors ${f.color}`}>
                        {t(`scaudit.feat.${f.key}.name`)}
                      </div>
                      <div className="text-[0.65rem] text-[var(--text-subtle)] leading-relaxed line-clamp-2 group-hover:text-[var(--text-muted)] transition-colors">
                        {t(`scaudit.feat.${f.key}.desc`)}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </FadeIn>
        </div>

        {/* ── Metrics bar ── */}
        <FadeIn delay={0.3}>
          <div className="glass scanline-container rounded-2xl border border-[var(--surface-border)] overflow-hidden mb-10">
            {/* Bar header */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-[var(--surface-border)] bg-[var(--surface-fill)]">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-[0.6rem] font-mono font-bold text-blue-400 uppercase tracking-[2px]">
                  {t('scaudit.metrics.title')}
                </span>
              </div>
              <span className="text-[0.58rem] text-[var(--text-faint)] font-mono">{t('scaudit.metrics.source')}</span>
            </div>

            {/* Metrics row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-x divide-[var(--surface-border)]">
              {METRICS.map((m) => (
                <div key={m.label} className="px-5 py-4 flex flex-col gap-1 hover:bg-[var(--surface-fill)] transition-colors">
                  <span className="text-[0.58rem] text-[var(--text-subtle)] uppercase tracking-widest font-bold">{m.label}</span>
                  <span className={`text-xl font-black font-mono ${statusColor(m.status).split(' ')[0]}`}>{m.value}</span>
                  <span className="text-[0.58rem] text-[var(--text-faint)] leading-tight">{m.sub}</span>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>

        {/* ── CTA block ── */}
        <FadeIn delay={0.35}>
          <div
            className="relative rounded-2xl border border-[var(--surface-border)] overflow-hidden p-8 sm:p-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6"
            style={{ background: 'linear-gradient(135deg, rgba(30,144,255,0.06) 0%, rgba(197,164,109,0.04) 100%)' }}
          >
            {/* Left copy */}
            <div className="max-w-lg">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[0.58rem] font-extrabold uppercase tracking-[3px] text-blue-400">
                  {t('scaudit.cta.badge')}
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] mb-1.5 tracking-tight">
                {t('scaudit.cta.title')}
              </h3>
              <p className="text-[0.82rem] text-[var(--text-muted)] leading-relaxed">
                {t('scaudit.cta.desc')}
              </p>
            </div>

            {/* Right CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
              <a
                href="https://scaudit.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold tracking-tight text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                style={{ background: 'linear-gradient(135deg, #1E90FF, #1a6bcc)', boxShadow: '0 0 24px rgba(30,144,255,0.3)' }}
              >
                <span aria-hidden="true">→</span>
                {t('scaudit.cta.primary')}
              </a>
              <a
                href="#scaudit"
                onClick={(e) => {
                  e.preventDefault()
                  document.getElementById('scaudit')?.scrollIntoView({ behavior: 'smooth' })
                }}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold tracking-tight text-[var(--text-secondary)] border border-[var(--border-interactive)] hover:border-[var(--surface-border-strong)] hover:text-[var(--text-primary)] transition-all duration-200 bg-[var(--surface-fill)] hover:bg-[var(--surface-fill-strong)]"
              >
                {t('scaudit.cta.secondary')}
              </a>
            </div>
          </div>
        </FadeIn>

      </div>
    </section>
  )
}

export default memo(SCAudit)
