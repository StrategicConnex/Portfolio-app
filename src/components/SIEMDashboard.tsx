'use client'

import { motion, useInView, AnimatePresence } from 'framer-motion'
import { useRef, useEffect, useState, memo } from 'react'
import SectionHeader from './ui/SectionHeader'
import FadeIn from './ui/FadeIn'
import Icon from './ui/Icon'
import { useLanguage } from '@/context/LanguageContext'
import { 
  LOG_LINES, 
  PURDUE_ZONES, 
  THREAT_LEVELS, 
  OPERATIONAL_KPIS, 
  TOP_ATTACKERS, 
  TOP_ATTACKED, 
  ATTACK_VECTORS 
} from '@/data/siem'
import { 
  clamp, 
  randomizePercentages, 
  randomizeThreatCounts, 
  randomizeZones 
} from '@/lib/utils'

/* ─── Types ─── */
type LogLine = typeof LOG_LINES[0]
type QueuedLine = LogLine & { renderKey: number }

/* ─── Sub-components ─── */

const MitigationTooltip = memo(({ m }: { m: NonNullable<LogLine['mitigation']> }) => {
  const { t } = useLanguage()
  return (
    <motion.div
      initial={{ opacity: 0, y: -6, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.18 }}
      className="absolute bottom-[calc(100%+8px)] left-0 z-50 w-[min(90vw,400px)] p-3 rounded-lg border border-red-500/40 bg-[#0A1628] shadow-[0_0_24px_rgba(239,68,68,0.15)] pointer-events-none"
    >
      <div className="text-[0.65rem] text-red-500 font-bold tracking-[1.5px] uppercase mb-1.5">
        ⚡ {t('siem.ui.auto_response')}
      </div>
      <div className="text-[0.78rem] text-red-300 font-semibold mb-2">
        {m.action}
      </div>
      <ul className="list-none p-0 m-0 mb-1.5">
        {m.steps.map((s, i) => (
          <li key={i} className="text-[0.7rem] text-slate-400/85 py-0.5 pl-4 relative">
            <span className="absolute left-0 text-emerald-500">✓</span>{s}
          </li>
        ))}
      </ul>
      <div className="text-[0.65rem] text-emerald-500 font-mono border-t border-white/10 pt-1.5">
        {t('siem.ui.mttr')}: {m.time}
      </div>
    </motion.div>
  )
})
MitigationTooltip.displayName = 'MitigationTooltip'

const LogScroller = memo(() => {
  const { t } = useLanguage()
  const renderKeyRef = useRef(LOG_LINES.length)
  const nextIdxRef   = useRef(6)
  const [hovered, setHovered] = useState<number | null>(null)
  const [queue, setQueue] = useState<QueuedLine[]>(() =>
    LOG_LINES.slice(0, 6).map((line, i) => ({ ...line, renderKey: i }))
  )

  useEffect(() => {
    const id = setInterval(() => {
      const line = LOG_LINES[nextIdxRef.current % LOG_LINES.length]
      const rk   = renderKeyRef.current
      nextIdxRef.current++
      renderKeyRef.current++
      setQueue(q => [...q.slice(1), { ...line, renderKey: rk }])
    }, 2200)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="font-mono text-[10px] sm:text-[0.72rem] leading-relaxed min-h-[160px] overflow-x-auto">
      <AnimatePresence initial={false}>
        {queue.map((line) => (
          <motion.div
            key={line.renderKey}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            onMouseEnter={() => line.mitigation && setHovered(line.renderKey)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => line.mitigation && setHovered(hovered === line.renderKey ? null : line.renderKey)}
            className={`flex gap-2 sm:gap-2.5 p-1 px-1.5 rounded transition-colors relative cursor-${line.mitigation ? 'help' : 'default'} ${
              hovered === line.renderKey ? 'bg-red-500/10' : ''
            }`}
          >
            <span className="text-slate-500 flex-shrink-0 w-12">{line.time}</span>
            <span style={{ color: line.color }} className="font-bold min-w-[35px] sm:min-w-[40px] flex-shrink-0">{line.level}</span>
            <span className="text-slate-400 flex-shrink-0 min-w-[80px] sm:min-w-[96px] truncate">{line.src}</span>
            <span className="text-slate-300 flex-1 min-w-[120px]">{line.msg}</span>
            {line.mitigation && (
              <span className="text-red-500 text-[9px] self-center opacity-70 hidden sm:inline">
                {t('siem.hover_hint').split(' ')[0]} ▸
              </span>
            )}
            <AnimatePresence>
              {hovered === line.renderKey && line.mitigation && (
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

const ZoneBar = memo(({ zone, delay }: { zone: (typeof PURDUE_ZONES)[0]; delay: number }) => {
  const { t } = useLanguage()
  const ref    = useRef(null)
  const inView = useInView(ref, { once: true })
  return (
    <div ref={ref} className="mb-2">
      <div className="flex justify-between mb-1">
        <span className="text-[0.72rem] text-slate-400">{t(zone.labelKey)}</span>
        <div className="flex gap-3">
          <span className="text-[0.7rem] text-slate-500">{zone.events} ev/h</span>
          <span style={{ color: zone.color }} className="text-[0.72rem] font-bold">{zone.pct}%</span>
        </div>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={inView ? { width: `${zone.pct}%` } : {}}
          transition={{ duration: 1.2, delay, ease: 'easeOut' }}
          style={{ background: `linear-gradient(90deg, ${zone.color}88, ${zone.color})` }}
          className="h-full rounded-full"
        />
      </div>
    </div>
  )
})
ZoneBar.displayName = 'ZoneBar'

/* ─── Main Component ─── */

export default function SIEMDashboard() {
  const { t } = useLanguage()
  const [timeStr, setTimeStr] = useState('')
  const [liveThreats, setLiveThreats] = useState(THREAT_LEVELS)
  const [liveAttackers, setLiveAttackers] = useState(TOP_ATTACKERS)
  const [liveAttacked, setLiveAttacked] = useState(TOP_ATTACKED)
  const [liveVectors, setLiveVectors] = useState(ATTACK_VECTORS)
  const [liveZones, setLiveZones] = useState(PURDUE_ZONES)
  const [incidentActive, setIncidentActive] = useState(false)

  const incidentTimeoutRef = useRef<number | null>(null)

  const simulateIncident = () => {
    if (incidentActive) return
    setIncidentActive(true)

    setLiveZones(prev => prev.map(zone =>
      zone.labelKey === 'siem.zone.field'
        ? { ...zone, pct: clamp(zone.pct - 8, 70, 98), events: zone.events + 90 }
        : zone
    ))

    setLiveThreats(prev => prev.map(threat => {
      if (threat.label === 'HIGH') return { ...threat, count: clamp(threat.count + 9, 0, 40) }
      if (threat.label === 'CRITICAL') return { ...threat, count: clamp(threat.count + 5, 0, 40) }
      return threat
    }))

    setLiveVectors(prev => prev.map(v =>
      v.label === 'IP Flood' ? { ...v, pct: clamp(v.pct + 10, 1, 100) } : v
    ))

    setLiveAttackers(prev => prev.map(a => {
      if (a.label === 'China') return { ...a, pct: clamp(a.pct + 5, 1, 100) }
      if (a.label === 'United States') return { ...a, pct: clamp(a.pct - 3, 1, 100) }
      return a
    }))

    if (incidentTimeoutRef.current) window.clearTimeout(incidentTimeoutRef.current)
    incidentTimeoutRef.current = window.setTimeout(() => {
      setIncidentActive(false)
      incidentTimeoutRef.current = null
    }, 7000)
  }

  useEffect(() => {
    const tick = () => setTimeStr(new Date().toTimeString().slice(0, 8))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const update = () => {
      setLiveThreats(prev => randomizeThreatCounts(prev))
      setLiveAttackers(prev => randomizePercentages(prev))
      setLiveAttacked(prev => randomizePercentages(prev))
      setLiveVectors(prev => randomizePercentages(prev))
      setLiveZones(prev => randomizeZones(prev))
    }
    update()
    const id = setInterval(update, 5500)
    return () => clearInterval(id)
  }, [])

  return (
    <section id="siem" className="py-20 px-6 bg-slate-950">
      <div className="max-w-6xl mx-auto">
        <SectionHeader label={t('siem.label')} title={t('siem.title')} highlight={t('siem.highlight')} />

        <FadeIn delay={0.1}>
          <p className="text-slate-400 mb-2 text-sm max-w-2xl">
            {t('siem.map_desc')}
          </p>
          <p className="text-red-500/80 text-[10px] tracking-wider mb-8 font-mono">
            {t('siem.hover_hint')}
          </p>
        </FadeIn>

        <FadeIn delay={0.15}>
          {/* Dashboard Header */}
          <div className="glass rounded-t-2xl p-4 flex flex-wrap items-center justify-between gap-4 border-b-0">
            <div className="flex items-center gap-2.5">
              <motion.div
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="w-2 h-2 rounded-full bg-emerald-500"
              />
              <span className="font-mono text-[10px] md:text-xs text-emerald-500 font-bold uppercase tracking-tight">
                RADWARE LIVE THREAT MAP — 1H
              </span>
            </div>
            
            <div className="flex gap-4 items-center flex-1 justify-end">
              <span className="hidden md:inline font-mono text-[10px] text-slate-500">
                IEC 62443 | NIST CSF | ISO 27001
              </span>
              <span className="font-mono text-xs text-slate-400">{timeStr} UTC-3</span>
              <button
                type="button"
                onClick={simulateIncident}
                disabled={incidentActive}
                className={`px-4 py-2 text-[10px] md:text-xs font-bold rounded-full transition-all ${
                  incidentActive 
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 cursor-pointer active:scale-95'
                }`}
              >
                {incidentActive ? t('siem.incident_btn_active') : t('siem.incident_btn')}
              </button>
            </div>
          </div>

          {/* Incident Alert Banner */}
          <AnimatePresence>
            {incidentActive && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-4 mb-1 bg-red-500/10 border-x border-red-500/20 flex gap-3 items-center text-xs md:text-sm text-red-200">
                  <span className="font-bold text-red-500 shrink-0">{t('siem.ui.incident_title')}</span>
                  <span>{t('siem.ui.incident_desc')}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Dashboard Content Grid */}
          <div className="scanline-container glass rounded-b-2xl p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 border-t-0 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            
            {/* Main Log Area */}
            <div className="lg:col-span-2 space-y-8">
              <div>
                <h4 className="text-[10px] text-blue-400 tracking-[2px] uppercase mb-4 font-bold">
                  ▶ {t('siem.ui.event_stream')}
                </h4>
                <div className="bg-black/60 border border-blue-500/10 rounded-xl p-4 overflow-visible shadow-inner backdrop-blur-md">
                  <LogScroller />
                </div>
              </div>
              
              <div>
                <h4 className="text-[10px] text-blue-400 tracking-[2px] uppercase mb-4 font-bold">
                  {t('siem.ui.availability')}
                </h4>
                <div className="space-y-1">
                  {liveZones.map((z, i) => <ZoneBar key={z.labelKey} zone={z} delay={0.3 + i * 0.1} />)}
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
                <div className="grid grid-cols-2 gap-2">
                  {liveThreats.map(threat => (
                    <div key={threat.label} className="bg-black/30 border border-white/5 rounded-lg p-3 flex justify-between items-center transition-hover hover:border-white/10">
                      <span style={{ color: threat.color }} className="text-[10px] font-bold font-mono">{threat.label}</span>
                      <span style={{ background: `${threat.color}20`, color: threat.color }} className="rounded-full px-2 py-0.5 text-[10px] font-black">{threat.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* KPIs */}
              <div>
                <h4 className="text-[10px] text-amber-500 tracking-[2px] uppercase mb-4 font-bold">
                  {t('siem.ui.operational_kpis')}
                </h4>
                <div className="space-y-0.5">
                  {OPERATIONAL_KPIS.map(k => (
                    <div key={k.labelKey} className="flex justify-between py-2 border-b border-white/5 text-xs">
                      <span className="text-slate-400 flex items-center gap-2">
                        <Icon name={k.icon} label={t(k.labelKey)} size={14} />{t(k.labelKey)}
                      </span>
                      <span className="text-amber-500 font-bold font-mono">{k.val}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Vertical Stats Lists */}
              <div className="space-y-6">
                {[
                  { title: t('siem.ui.top_attackers'), data: liveAttackers, color: 'text-blue-400' },
                  { title: t('siem.ui.top_attacked'), data: liveAttacked, color: 'text-blue-400' },
                  { title: t('siem.ui.attack_vectors'), data: liveVectors, color: 'text-blue-400' }
                ].map((stat) => (
                  <div key={stat.title}>
                    <h4 className={`text-[10px] ${stat.color} tracking-[2px] uppercase mb-3 font-bold`}>
                      {stat.title}
                    </h4>
                    <div className="space-y-1.5">
                      {stat.data.map((item) => (
                        <div key={item.label} className="flex justify-between px-1 text-[11px] text-slate-300">
                          <span>{item.label}</span>
                          <span className="text-amber-500 font-bold">{item.pct}%</span>
                        </div>
                      ))}
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
