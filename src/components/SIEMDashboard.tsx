'use client'

import { motion, useInView, AnimatePresence } from 'framer-motion'
import { useRef, useEffect, useState } from 'react'
import SectionHeader from './ui/SectionHeader'
import FadeIn from './ui/FadeIn'
import Icon from './ui/Icon'

/* ─── Log lines with mitigation for ALERT events ─── */
const LOG_LINES = [
  { id: 1,  time: '10:38:13', level: 'ALERT', src: '203.0.113.45 (US)',   msg: 'TCP Flood detected on edge firewall',          color: '#EF4444', mitigation: { action: 'DDoS mitigation activated via Radware DefensePro', steps: ['Traffic rerouted through scrubbing center', 'Rate-limit rules applied at edge', 'Malicious session terminated'], time: '< 60s' } },
  { id: 2,  time: '10:38:27', level: 'WARN',  src: '198.51.100.22 (CN)', msg: 'UDP Flood targeting public web gateway',      color: '#F97316', mitigation: null },
  { id: 3,  time: '10:38:39', level: 'ALERT', src: '192.0.2.18 (SG)',   msg: 'DNS Flood on resolver cluster',               color: '#EF4444', mitigation: { action: 'DNS sinkhole applied and cache refreshed', steps: ['Suspicious query patterns blocked', 'Recursive service isolated', 'Failover to secondary DNS enabled'], time: '< 90s' } },
  { id: 4,  time: '10:38:50', level: 'INFO',  src: '204.120.0.55 (DE)', msg: 'Botnet scan blocked against web application', color: '#10B981', mitigation: null },
  { id: 5,  time: '10:39:03', level: 'WARN',  src: '172.16.0.4 (IN)',   msg: 'IP Flood observed on VPN ingress',           color: '#F59E0B', mitigation: null },
  { id: 6,  time: '10:39:17', level: 'INFO',  src: '203.0.113.74 (US)', msg: 'SSH brute-force blocked by IDS rule',         color: '#10B981', mitigation: null },
  { id: 7,  time: '10:39:29', level: 'ALERT', src: '198.51.100.88 (CN)', msg: 'Low and Slow attack detected on API portal', color: '#EF4444', mitigation: { action: 'Connection throttling and behavioral blocklist enabled', steps: ['Slow POST requests dropped', 'Session anomaly logged', 'Client fingerprinting updated'], time: '< 2 min' } },
  { id: 8,  time: '10:39:42', level: 'INFO',  src: '192.0.2.20 (SG)',   msg: 'Threat intelligence feed updated',            color: '#10B981', mitigation: null },
  { id: 9,  time: '10:39:56', level: 'WARN',  src: '204.120.0.33 (DE)', msg: 'Application violation: SQL injection blocked', color: '#F97316', mitigation: null },
  { id: 10, time: '10:40:08', level: 'ALERT', src: '203.0.113.89 (US)', msg: 'DDoS mitigation applied for peak volumetrics', color: '#EF4444', mitigation: { action: 'Adaptive profile engaged and traffic filtered', steps: ['Botnet signatures enforced', 'Anomalous flows quarantined', 'Business-critical traffic preserved'], time: '< 45s' } },
]

type QueuedLine = typeof LOG_LINES[0] & { renderKey: number }

/* ─── Mitigation tooltip ─── */
function MitigationTooltip({ m }: { m: NonNullable<typeof LOG_LINES[0]['mitigation']> }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.18 }}
      style={{
        position: 'absolute', bottom: 'calc(100% + 8px)', left: 0, zIndex: 50,
        background: '#0A1628',
        border: '1px solid rgba(239,68,68,0.4)',
        borderRadius: 8,
        padding: '0.75rem 1rem',
        minWidth: 320,
        maxWidth: 400,
        boxShadow: '0 0 24px rgba(239,68,68,0.15)',
        pointerEvents: 'none',
      }}
    >
      <div style={{ fontSize: '0.65rem', color: '#EF4444', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
        ⚡ Respuesta automática
      </div>
      <div style={{ fontSize: '0.78rem', color: '#FCA5A5', fontWeight: 600, marginBottom: '0.5rem' }}>
        {m.action}
      </div>
      <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 0.4rem' }}>
        {m.steps.map((s, i) => (
          <li key={i} style={{ fontSize: '0.7rem', color: 'rgba(148,163,184,0.85)', padding: '0.1rem 0', paddingLeft: '1rem', position: 'relative' }}>
            <span style={{ position: 'absolute', left: 0, color: '#10B981' }}>✓</span>{s}
          </li>
        ))}
      </ul>
      <div style={{ fontSize: '0.65rem', color: '#10B981', fontFamily: 'monospace', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.35rem' }}>
        MTTR: {m.time}
      </div>
    </motion.div>
  )
}

/* ─── Log scroller ─── */
function LogScroller() {
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
    <div style={{ fontFamily: 'monospace', fontSize: '0.72rem', lineHeight: 1.7, overflow: 'visible', minHeight: 160 }}>
      <AnimatePresence initial={false}>
        {queue.map((line) => (
          <motion.div
            key={line.renderKey}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            onMouseEnter={() => line.mitigation ? setHovered(line.renderKey) : null}
            onMouseLeave={() => setHovered(null)}
            style={{
              display: 'flex', gap: '0.6rem', padding: '0.15rem 0.4rem',
              borderRadius: 4, position: 'relative',
              cursor: line.mitigation ? 'help' : 'default',
              background: hovered === line.renderKey ? 'rgba(239,68,68,0.06)' : 'transparent',
              transition: 'background 0.2s',
            }}
          >
            <span style={{ color: 'rgba(148,163,184,0.5)', flexShrink: 0 }}>{line.time}</span>
            <span style={{ color: line.color, fontWeight: 700, minWidth: 40, flexShrink: 0 }}>{line.level}</span>
            <span style={{ color: '#64748B', flexShrink: 0, minWidth: 96 }}>{line.src}</span>
            <span style={{ color: 'var(--muted)', flex: 1 }}>{line.msg}</span>
            {line.mitigation && (
              <span style={{ color: '#EF4444', fontSize: '0.65rem', alignSelf: 'center', flexShrink: 0, opacity: 0.7 }}>
                hover ▸
              </span>
            )}

            {/* Mitigation tooltip */}
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
}

/* ─── Zone bars ─── */
const zones = [
  { label: 'Nivel 4 – Corporativo',   pct: 98,   color: '#10B981', events: 1204 },
  { label: 'Nivel 3 – SCADA/DCS',     pct: 99.9, color: '#1E90FF', events: 318  },
  { label: 'Nivel 2 – Control',        pct: 99.9, color: '#1E90FF', events: 142  },
  { label: 'Nivel 1 – Field Devices',  pct: 97,   color: '#C5A46D', events: 87   },
  { label: 'Nivel 0 – Sensores/OT',    pct: 100,  color: '#10B981', events: 23   },
]

const threats = [
  { label: 'CRITICAL', count: 4,  color: '#EF4444' },
  { label: 'HIGH',     count: 8,  color: '#F97316' },
  { label: 'MEDIUM',   count: 15, color: '#F59E0B' },
  { label: 'LOW',      count: 27, color: '#10B981' },
]

const TOP_ATTACKERS = [
  { label: 'United States', pct: 82 },
  { label: 'China', pct: 8 },
  { label: 'Singapore', pct: 5 },
  { label: 'Germany', pct: 3 },
  { label: 'India', pct: 2 },
]

const TOP_ATTACKED = [
  { label: 'United States', pct: 24 },
  { label: 'Switzerland', pct: 24 },
  { label: 'Canada', pct: 20 },
  { label: 'India', pct: 20 },
  { label: 'Israel', pct: 12 },
]

const ATTACK_VECTORS = [
  { label: 'TCP Flood', pct: 66 },
  { label: 'UDP Flood', pct: 28 },
  { label: 'DNS Flood', pct: 4 },
  { label: 'IP Flood', pct: 1 },
  { label: 'Low and Slow', pct: 1 },
]

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function randomizePercentages(items: { label: string; pct: number }[]) {
  const next = items.map(item => ({
    ...item,
    pct: clamp(item.pct + Math.round((Math.random() - 0.5) * 6), 1, 90),
  }))
  const total = next.reduce((sum, item) => sum + item.pct, 0)
  return next.map(item => ({
    ...item,
    pct: Math.max(1, Math.round((item.pct / total) * 100)),
  })).sort((a, b) => b.pct - a.pct)
}

function randomizeThreatCounts(items: { label: string; count: number; color: string }[]) {
  return items.map(item => ({
    ...item,
    count: clamp(item.count + Math.round((Math.random() - 0.5) * 4), 0, 40),
  }))
}

function randomizeZones(items: { label: string; pct: number; color: string; events: number }[]) {
  return items.map(item => ({
    ...item,
    pct: clamp(item.pct + Math.round((Math.random() - 0.5) * 2), 90, 100),
    events: clamp(item.events + Math.round((Math.random() - 0.5) * 16), 10, 1400),
  }))
}

function ZoneBar({ zone, delay }: { zone: typeof zones[0]; delay: number }) {
  const ref    = useRef(null)
  const inView = useInView(ref, { once: true })
  return (
    <div ref={ref} style={{ marginBottom: '0.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
        <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>{zone.label}</span>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.7rem', color: '#475569' }}>{zone.events} ev/h</span>
          <span style={{ fontSize: '0.72rem', color: zone.color, fontWeight: 700 }}>{zone.pct}%</span>
        </div>
      </div>
      <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={inView ? { width: `${zone.pct}%` } : {}}
          transition={{ duration: 1.2, delay, ease: 'easeOut' }}
          style={{ height: '100%', borderRadius: 3, background: `linear-gradient(90deg, ${zone.color}88, ${zone.color})` }}
        />
      </div>
    </div>
  )
}

export default function SIEMDashboard() {
  const [timeStr, setTimeStr] = useState('')
  const [liveThreats, setLiveThreats] = useState(threats)
  const [liveAttackers, setLiveAttackers] = useState(TOP_ATTACKERS)
  const [liveAttacked, setLiveAttacked] = useState(TOP_ATTACKED)
  const [liveVectors, setLiveVectors] = useState(ATTACK_VECTORS)
  const [liveZones, setLiveZones] = useState(zones)
  const [incidentActive, setIncidentActive] = useState(false)

  const incidentTimeoutRef = useRef<number | null>(null)

  const simulateIncident = () => {
    if (incidentActive) return
    setIncidentActive(true)

    setLiveZones(prev => prev.map(zone =>
      zone.label === 'Nivel 1 – Field Devices'
        ? { ...zone, pct: clamp(zone.pct - 8, 70, 98), events: zone.events + 90 }
        : zone
    ))

    setLiveThreats(prev => prev.map(t => {
      if (t.label === 'HIGH') return { ...t, count: clamp(t.count + 9, 0, 40) }
      if (t.label === 'CRITICAL') return { ...t, count: clamp(t.count + 5, 0, 40) }
      return t
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
    return () => {
      if (incidentTimeoutRef.current) {
        window.clearTimeout(incidentTimeoutRef.current)
      }
    }
  }, [])

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
    <section id="siem" style={{ padding: 'clamp(2rem, 5vw, 5rem) clamp(1rem, 5vw, 2rem)', background: 'var(--bg)' }}>
      <div style={{ maxWidth: 1100, margin: 'auto' }}>
        <SectionHeader label="Security Operations" title="SIEM" highlight="Dashboard" />

        <FadeIn delay={0.1}>
          <p style={{ color: 'var(--muted)', marginBottom: 'clamp(0.4rem, 1vw, 0.6rem)', fontSize: 'clamp(0.85rem, 1.8vw, 0.92rem)', maxWidth: 640 }}>
            Datos de amenaza en vivo basados en el mapa de Radware Live Threat Map, intervalos de 1 hora.
          </p>
          <p style={{ color: 'rgba(239,68,68,0.8)', fontSize: 'clamp(0.65rem, 1.3vw, 0.72rem)', letterSpacing: '1px', marginBottom: 'clamp(1.25rem, 3vw, 2rem)', fontFamily: 'monospace' }}>
            ▸ Hover sobre un evento ALERT para ver la acción de mitigación
          </p>
        </FadeIn>

        <FadeIn delay={0.15}>
          {/* Top bar */}
          <div style={{
            background: 'rgba(10,25,47,0.9)', border: '1px solid rgba(30,144,255,0.2)',
            borderRadius: '14px 14px 0 0', padding: 'clamp(0.5rem, 1.5vw, 0.65rem) clamp(0.8rem, 2vw, 1.25rem)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderBottom: '1px solid rgba(30,144,255,0.12)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(0.4rem, 1vw, 0.6rem)' }}>
              <motion.div
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' }}
              />
              <span style={{ fontFamily: 'monospace', fontSize: 'clamp(0.65rem, 1.3vw, 0.75rem)', color: '#10B981', fontWeight: 700 }}>
                RADWARE LIVE THREAT MAP — 1H
              </span>
            </div>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <span style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: 'var(--muted)' }}>
                IEC 62443 | NIST CSF | ISO 27001
              </span>
              <span style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: '#64748B' }}>{timeStr} UTC-3</span>
              <button
                type="button"
                onClick={simulateIncident}
                disabled={incidentActive}
                style={{
                  background: incidentActive ? '#334155' : 'linear-gradient(135deg, #1E3A8A, #2563EB)',
                  color: '#fff', border: 'none', borderRadius: 999, padding: '0.55rem 1rem',
                  fontSize: '0.72rem', fontWeight: 700, cursor: incidentActive ? 'not-allowed' : 'pointer',
                  boxShadow: incidentActive ? 'none' : '0 12px 30px rgba(37,99,235,0.18)',
                }}
              >
                {incidentActive ? 'Incidente Simulado' : 'Simular Incidente'}
              </button>
            </div>
          </div>

          {incidentActive && (
            <div style={{
              marginTop: '1rem', padding: '0.85rem 1rem', background: 'rgba(248,113,113,0.12)',
              border: '1px solid rgba(248,113,113,0.22)', borderRadius: 12, display: 'flex', gap: '0.75rem', alignItems: 'center',
              fontSize: '0.85rem', color: '#F8B4B4',
            }}>
              <span style={{ fontWeight: 700, color: '#F87171' }}>INCIDENTE SIMULADO – Purdue Nivel 1</span>
              <span>Detección de anomalía en dispositivos de campo. El SOC aplica mitigación automática y ajusta la disponibilidad de la zona.</span>
            </div>
          )}

          {/* Grid */}
          <div className="siem-grid" style={{
            background: 'rgba(10,25,47,0.75)', border: '1px solid rgba(30,144,255,0.15)',
            borderTop: 'none', borderRadius: '0 0 14px 14px', padding: '1.5rem',
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.25rem',
          }}>
            {/* Log col */}
            <div className="siem-span2" style={{ gridColumn: 'span 2' }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--blue)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '0.75rem', fontWeight: 700 }}>
                ▶ Event Stream – Nivel IT/OT
              </div>
              <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(30,144,255,0.12)', borderRadius: 8, padding: '0.75rem 1rem', position: 'relative', overflow: 'visible', minHeight: 200 }}>
                <LogScroller />
              </div>
              <div style={{ marginTop: '1.25rem' }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--blue)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '0.75rem', fontWeight: 700 }}>
                  Disponibilidad por Zona Purdue
                </div>
                {liveZones.map((z, i) => <ZoneBar key={z.label} zone={z} delay={0.3 + i * 0.1} />)}
              </div>
            </div>

            {/* Stats col */}
            <div>
              <div style={{ fontSize: '0.68rem', color: '#EF4444', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '0.75rem', fontWeight: 700 }}>
                Threat Summary
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                {liveThreats.map(t => (
                  <div key={t.label} style={{
                    background: 'rgba(0,0,0,0.3)', border: `1px solid ${t.color}22`,
                    borderRadius: 8, padding: '0.6rem 0.9rem',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <span style={{ fontSize: '0.7rem', color: t.color, fontWeight: 700, fontFamily: 'monospace' }}>{t.label}</span>
                    <span style={{ background: `${t.color}22`, color: t.color, borderRadius: 20, padding: '0.1rem 0.55rem', fontSize: '0.72rem', fontWeight: 800 }}>{t.count}</span>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--gold)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '0.75rem', fontWeight: 700 }}>
                KPIs Operativos
              </div>
              {[
                { label: 'MTTR',     val: '< 15 min', icon: 'timer' },
                { label: 'Uptime',   val: '99.9%',    icon: 'results' },
                { label: 'Incid/M',  val: '−30%',     icon: 'analytics' },
                { label: 'Automat.', val: '−10h/sem', icon: 'automation' },
              ].map(k => (
                <div key={k.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '0.75rem' }}>
                  <span style={{ color: 'var(--muted)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Icon name={k.icon} label={k.label} size={16} />{k.label}
                  </span>
                  <span style={{ color: 'var(--gold)', fontWeight: 700, fontFamily: 'monospace' }}>{k.val}</span>
                </div>
              ))}

              <div style={{ marginTop: '1.4rem', fontSize: '0.68rem', color: 'var(--blue)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '0.75rem', fontWeight: 700 }}>
                Top Attackers
              </div>
              {liveAttackers.map((item) => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid rgba(255,255,255,0.08)', fontSize: '0.8rem' }}>
                  <span>{item.label}</span>
                  <span style={{ color: 'var(--gold)', fontWeight: 700 }}>{item.pct}%</span>
                </div>
              ))}

              <div style={{ marginTop: '1.4rem', fontSize: '0.68rem', color: 'var(--blue)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '0.75rem', fontWeight: 700 }}>
                Top Attacked
              </div>
              {liveAttacked.map((item) => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid rgba(255,255,255,0.08)', fontSize: '0.8rem' }}>
                  <span>{item.label}</span>
                  <span style={{ color: 'var(--gold)', fontWeight: 700 }}>{item.pct}%</span>
                </div>
              ))}

              <div style={{ marginTop: '1.4rem', fontSize: '0.68rem', color: 'var(--blue)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '0.75rem', fontWeight: 700 }}>
                Top Network Attack Vectors
              </div>
              {liveVectors.map((item) => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid rgba(255,255,255,0.08)', fontSize: '0.8rem' }}>
                  <span>{item.label}</span>
                  <span style={{ color: 'var(--gold)', fontWeight: 700 }}>{item.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
