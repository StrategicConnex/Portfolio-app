'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState, useMemo, memo } from 'react'
import SectionHeader from '@/components/ui/SectionHeader'
import FadeIn from '@/components/ui/FadeIn'
import { useLanguage } from '@/context/LanguageContext'
import LazyCyberAttackMap from './LazyCyberAttackMap'
import WebGLBoundary, { WebGLFallback } from './WebGLBoundary'
import {
  SIEM_LOG_LIMIT,
  type SIEMLevel,
  type SIEMLog,
  type SiemFeedPayload,
} from '@/lib/siem-feed'

/**
 * Panel SIEM sobre datos REALES.
 *
 * Todas las métricas provienen de `/api/siem-feed` (feed agregado
 * Abuse.ch Feodo Tracker + DShield/SANS ISC). Ya no hay datos de
 * demostración ni aleatorizadores: si un feed no responde, el panel lo
 * declara (`siem.feed.down`) y sigue mostrando solo datos reales. La
 * única "forma" propia son los colores de nivel y el reparto porcentual
 * calculado en cliente a partir de los conteos del payload.
 */

const POLL_INTERVAL_MS = 10_000
const SIDEBAR_ROWS = 5

const LEVEL_COLORS: Record<SIEMLevel, string> = {
  CRITICAL: '#EF4444',
  ALERT: '#F97316',
  WARN: '#F59E0B',
  INFO: '#10B981',
}

const LEVEL_ORDER: SIEMLevel[] = ['CRITICAL', 'ALERT', 'WARN', 'INFO']

/** Reparto porcentual sobre los conteos reales del payload. */
function withShare<T extends { count: number }>(items: T[]): Array<T & { pct: number }> {
  const total = items.reduce((sum, item) => sum + item.count, 0)
  return items.map((item) => ({
    ...item,
    pct: total > 0 ? Math.max(1, Math.round((item.count / total) * 100)) : 0,
  }))
}

/* ─── Sub-componentes ─── */

const MitigationTooltip = memo(({ m }: { m: NonNullable<SIEMLog['mitigation']> }) => {
  const { t } = useLanguage()
  return (
    <motion.div
      initial={{ opacity: 0, y: -6, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.18 }}
      className="absolute bottom-[calc(100%+8px)] left-0 z-50 w-[min(90vw,400px)] p-3 rounded-lg border border-amber-500/40 bg-[#0A1628] shadow-[0_0_24px_rgba(245,158,11,0.12)] pointer-events-none"
    >
      <div className="text-[0.65rem] text-amber-500 font-bold tracking-[1.5px] uppercase mb-1.5">
        ⚡ {t('siem.ui.mitigation')}
      </div>
      <div className="text-[0.78rem] text-amber-200 font-semibold mb-2">
        {m.action}
      </div>
      <ul className="list-none p-0 m-0 mb-1.5">
        {m.steps.map((s, i) => (
          <li key={i} className="text-[0.7rem] text-[var(--text-muted)]/85 py-0.5 pl-4 relative">
            <span className="absolute left-0 text-emerald-500">✓</span>{s}
          </li>
        ))}
      </ul>
      <div className="text-[0.65rem] text-emerald-500 font-mono border-t border-[var(--surface-border)] pt-1.5">
        {t('siem.ui.estimated')}: {m.time}
      </div>
    </motion.div>
  )
})
MitigationTooltip.displayName = 'MitigationTooltip'

const LogScroller = memo(({ logs }: { logs: SIEMLog[] }) => {
  const [hovered, setHovered] = useState<string | null>(null)

  return (
    <div className="font-mono text-[10px] sm:text-[0.72rem] leading-relaxed min-h-[160px] overflow-x-auto">
      <AnimatePresence initial={false}>
        {logs.map((line) => (
          <motion.div
            key={line.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            onMouseEnter={() => line.mitigation && setHovered(line.id)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => line.mitigation && setHovered(hovered === line.id ? null : line.id)}
            className={`flex gap-2 sm:gap-2.5 p-1 px-1.5 rounded transition-colors relative cursor-${line.mitigation ? 'help' : 'default'} ${
              hovered === line.id ? 'bg-red-500/10' : ''
            }`}
          >
            <span className="text-[var(--text-subtle)] flex-shrink-0 w-12">{line.time}</span>
            <span
              style={{ color: LEVEL_COLORS[line.level] }}
              className="font-bold min-w-[35px] sm:min-w-[40px] flex-shrink-0"
            >
              {line.level}
            </span>
            <span className="text-[var(--text-muted)] flex-shrink-0 min-w-[80px] sm:min-w-[96px] truncate">
              {line.src}
            </span>
            <span className="text-[var(--text-secondary)] flex-1 min-w-[120px]">{line.msg}</span>
            {line.mitigation && (
              <span className="text-amber-500 text-[9px] self-center opacity-70 hidden sm:inline">▸</span>
            )}
            <AnimatePresence>
              {hovered === line.id && line.mitigation && (
                <MitigationTooltip m={line.mitigation} />
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
})
LogScroller.displayName = 'LogScroller'

/* ─── Main Component ─── */

export default function SIEMDashboard() {
  const { t } = useLanguage()
  const [timeStr, setTimeStr] = useState('')
  const [logs, setLogs] = useState<SIEMLog[]>([])
  const [payload, setPayload] = useState<SiemFeedPayload | null>(null)

  /* Reloj de cabecera (hora local del visitante). */
  useEffect(() => {
    const tick = () => setTimeStr(new Date().toTimeString().slice(0, 8))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  /* Sondeo del feed real. Dedupe por id (un IOC ya mostrado no se repite
     en la cola), las entradas nuevas entran por arriba y la cola queda
     limitada a SIEM_LOG_LIMIT. */
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const res = await fetch('/api/siem-feed', { headers: { Accept: 'application/json' } })
        if (!res.ok || cancelled) return
        const data = (await res.json()) as SiemFeedPayload
        if (cancelled) return
        setPayload(data)
        setLogs((prev) => {
          const combined = [...data.logs, ...prev]
          const unique = combined.filter(
            (l, i) => combined.findIndex((x) => x.id === l.id) === i,
          )
          return unique.slice(0, SIEM_LOG_LIMIT)
        })
      } catch {
        /* Red caída: el panel conserva un estado honesto, sin simular datos. */
      }
    }
    load()
    const id = setInterval(load, POLL_INTERVAL_MS)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [])

  /* ─── Métricas derivadas del payload real ─── */

  const levels = useMemo(
    () =>
      LEVEL_ORDER.map((label) => ({
        label,
        color: LEVEL_COLORS[label],
        count: payload ? payload.summary[label.toLowerCase() as keyof SiemFeedPayload['summary']] : 0,
      })),
    [payload],
  )

  const attackerRows = useMemo(
    () =>
      withShare(payload?.attackers ?? [])
        .slice(0, SIDEBAR_ROWS)
        .map((row) => ({ label: row.label, value: `${row.pct}%` })),
    [payload],
  )

  const portRows = useMemo(
    () =>
      (payload?.ports ?? [])
        .slice(0, SIDEBAR_ROWS)
        .map((row) => ({ label: `:${row.port}`, value: row.records.toLocaleString('en-US') })),
    [payload],
  )

  const malwareRows = useMemo(
    () =>
      (payload?.malware ?? [])
        .slice(0, SIDEBAR_ROWS)
        .map((row) => ({ label: row.label, value: `${row.count}` })),
    [payload],
  )

  const kpiRows = useMemo(
    () => [
      { labelKey: 'siem.kpi.c2_ips', value: payload ? `${payload.summary.c2Unique}` : '—' },
      { labelKey: 'siem.kpi.top_ports', value: payload ? `${payload.summary.targetedPorts}` : '—' },
      {
        labelKey: 'siem.kpi.scan_reports',
        value: payload ? payload.summary.scanReports.toLocaleString('en-US') : '—',
      },
      {
        labelKey: 'siem.kpi.updated',
        value: payload ? `${payload.lastUpdated.slice(11, 19)} UTC` : '—',
      },
    ],
    [payload],
  )

  const feedStatuses: Array<{ name: string; live: boolean }> = [
    { name: 'Abuse.ch Feodo Tracker', live: payload?.feedsStatus.feodo === 'live' },
    { name: 'DShield (SANS ISC)', live: payload?.feedsStatus.dshield === 'live' },
  ]

  const emptyState =
    logs.length > 0
      ? null
      : payload && !payload.usingLiveData
        ? t('siem.ui.no_data')
        : t('siem.ui.connecting')

  return (
    <section id="siem" className="console console-bg py-20 sm:py-32 px-4 sm:px-6 md:px-8">
      <div className="max-w-6xl mx-auto">
        <SectionHeader label={t('siem.label')} title={t('siem.title')} highlight={t('siem.highlight')} />

        <FadeIn delay={0.1} variant="blur">
          <p className="text-[var(--text-muted)] mb-2 text-sm max-w-2xl">
            {t('siem.map_desc')}
          </p>
          <p className="text-[10px] tracking-wider mb-6 font-mono" style={{ color: 'var(--danger)' }}>
            {t('siem.hover_hint')}
          </p>
        </FadeIn>

        <FadeIn delay={0.12} variant="blur">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <h3 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
                {t('siem.map.title')}
              </h3>
              <a
                href="/cyber-attack-map"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2"
              >
                {t('siem.map.open_full')}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
            <WebGLBoundary fallback={<WebGLFallback message={t('siem.map.unavailable')} />}>
              <LazyCyberAttackMap />
            </WebGLBoundary>
          </div>
        </FadeIn>

        <FadeIn delay={0.15} variant="clip" duration={0.8}>
          {/* Dashboard Header */}
          <div className="glass rounded-t-2xl p-4 flex flex-wrap items-center justify-between gap-4 border-b-0">
            <div className="flex items-center gap-2.5">
              <motion.div
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="w-2 h-2 rounded-full bg-emerald-500"
              />
              <span className="font-mono text-[10px] md:text-xs text-emerald-500 font-bold uppercase tracking-tight">
                {t('siem.live_badge')}
              </span>
            </div>

            <div className="flex gap-4 items-center flex-1 justify-end">
              <span className="hidden md:inline font-mono text-[10px] text-[var(--text-subtle)]">
                IEC 62443 | NIST CSF | ISO 27001
              </span>
              <span className="font-mono text-xs text-[var(--text-muted)]">{timeStr} UTC-3</span>
            </div>
          </div>

          {/* Dashboard Content Grid */}
          <div className="scanline-container glass rounded-b-2xl p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 border-t-0 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">

            {/* Main Log Area */}
            <div className="lg:col-span-2 space-y-8">
              <div>
                <h4 className="text-[10px] text-blue-400 tracking-[2px] uppercase mb-4 font-bold">
                  ▶ {t('siem.ui.event_stream')}
                </h4>
                <div
                  className="bg-black/60 border border-blue-500/10 rounded-xl p-4 overflow-visible shadow-inner backdrop-blur-md"
                  aria-live="polite"
                  aria-label={t('siem.ui.stream_aria')}
                >
                  {logs.length > 0 ? (
                    <LogScroller logs={logs} />
                  ) : (
                    <p className="text-[0.72rem] text-[var(--text-muted)] font-mono py-2">
                      {emptyState}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-[10px] text-blue-400 tracking-[2px] uppercase mb-4 font-bold">
                  {t('siem.ui.feed_status')}
                </h4>
                <div className="bg-black/30 border border-[var(--surface-border)] rounded-xl p-3">
                  {feedStatuses.map((feed) => (
                    <div key={feed.name} className="flex justify-between items-center text-xs">
                      <span className="text-[var(--text-secondary)] flex items-center gap-2 py-1">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${feed.live ? 'bg-emerald-500' : 'bg-red-500'}`}
                        />
                        {feed.name}
                      </span>
                      <span
                        style={{
                          background: feed.live ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                          color: feed.live ? '#10B981' : '#EF4444',
                        }}
                        className="rounded-full px-2 py-0.5 text-[10px] font-bold font-mono"
                      >
                        {feed.live ? t('siem.feed.live') : t('siem.feed.down')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar Stats Area */}
            <div className="space-y-8">
              {/* Threat Summary */}
              <div>
                <h4 className="text-[10px] text-red-500 tracking-[2px] uppercase mb-4 font-bold">
                  {t('siem.ui.threat_summary')}
                </h4>
                <div className="grid grid-cols-2 gap-2" aria-live="polite" aria-label={t('siem.ui.threat_summary_aria')}>
                  {levels.map((level) => (
                    <div key={level.label} className="bg-black/30 border border-[var(--surface-border)] rounded-lg p-3 flex justify-between items-center transition-hover hover:border-[var(--surface-border)]">
                      <span style={{ color: level.color }} className="text-[10px] font-bold font-mono">{level.label}</span>
                      <span
                        style={{ background: `${level.color}20`, color: level.color }}
                        className="rounded-full px-2 py-0.5 text-[10px] font-black"
                      >
                        {level.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Feed KPIs */}
              <div>
                <h4 className="text-[10px] text-amber-500 tracking-[2px] uppercase mb-4 font-bold">
                  {t('siem.ui.live_metrics')}
                </h4>
                <div className="space-y-0.5">
                  {kpiRows.map((k) => (
                    <div key={k.labelKey} className="flex justify-between py-2 border-b border-[var(--surface-border)] text-xs">
                      <span className="text-[var(--text-muted)]">{t(k.labelKey)}</span>
                      <span className="text-amber-500 font-bold font-mono">{k.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Vertical Stats Lists */}
              <div className="space-y-6">
                {[
                  { title: t('siem.ui.top_attackers'), rows: attackerRows },
                  { title: t('siem.ui.top_targeted'), rows: portRows },
                  { title: t('siem.ui.botnet_families'), rows: malwareRows },
                ].map((section) => (
                  <div key={section.title}>
                    <h4 className="text-[10px] text-blue-400 tracking-[2px] uppercase mb-3 font-bold">
                      {section.title}
                    </h4>
                    <div className="space-y-1.5">
                      {section.rows.length > 0 ? (
                        section.rows.map((row) => (
                          <div key={row.label} className="flex justify-between px-1 text-[11px] text-[var(--text-secondary)]">
                            <span className="truncate">{row.label}</span>
                            <span className="text-amber-500 font-bold">{row.value}</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-[11px] text-[var(--text-subtle)] px-1">—</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
