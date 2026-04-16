'use client'

import { motion, useInView, AnimatePresence } from 'framer-motion'
import { useRef, useEffect, useState } from 'react'
import SectionHeader from './ui/SectionHeader'
import FadeIn from './ui/FadeIn'

/* ─────────── SIEM-style log lines ─────────── */
const LOG_LINES = [
  { id: 1,  time: '04:12:33', level: 'INFO',  src: '10.0.1.24',   msg: 'SSH login success – admin@fw-ot-01',       color: '#10B981' },
  { id: 2,  time: '04:12:41', level: 'WARN',  src: '192.168.5.3',  msg: 'Port scan detected on OT VLAN (DNP3)',     color: '#F59E0B' },
  { id: 3,  time: '04:12:58', level: 'ALERT', src: '172.16.0.88',  msg: 'SCADA polling anomaly – Modbus register',  color: '#EF4444' },
  { id: 4,  time: '04:13:05', level: 'INFO',  src: '10.0.1.1',    msg: 'Firewall rule applied: DENY ext→PLC zone',  color: '#10B981' },
  { id: 5,  time: '04:13:17', level: 'INFO',  src: '10.0.2.44',   msg: 'OPC UA session authenticated – Historian',  color: '#10B981' },
  { id: 6,  time: '04:13:29', level: 'WARN',  src: '10.0.5.12',   msg: 'Failed auth x3 – IAM lockout triggered',   color: '#F59E0B' },
  { id: 7,  time: '04:13:41', level: 'INFO',  src: '10.0.1.1',    msg: 'IDS rule matched: CVE-2021-34527 pattern',  color: '#10B981' },
  { id: 8,  time: '04:13:55', level: 'ALERT', src: '172.16.0.4',  msg: 'Lateral movement attempt – blocked IAM',   color: '#EF4444' },
  { id: 9,  time: '04:14:02', level: 'INFO',  src: '10.0.1.24',   msg: 'Backup job completed – Veeam OK (99.9%)',   color: '#10B981' },
  { id: 10, time: '04:14:18', level: 'WARN',  src: '192.168.2.9', msg: 'Unusual traffic pattern – OT Level 1',     color: '#F59E0B' },
  { id: 11, time: '04:14:33', level: 'INFO',  src: '10.0.1.1',    msg: 'Correlation rule fired: IEC 62443 Zone A',  color: '#10B981' },
  { id: 12, time: '04:14:49', level: 'INFO',  src: '10.0.3.7',    msg: 'Python report generator – completed',       color: '#10B981' },
]

/* ─────────── Zone stats ─────────── */
const zones = [
  { label: 'Nivel 4 – Corporativo',   pct: 98, color: '#10B981', events: 1204 },
  { label: 'Nivel 3 – SCADA/DCS',     pct: 99.9, color: '#1E90FF', events: 318 },
  { label: 'Nivel 2 – Control',       pct: 99.9, color: '#1E90FF', events: 142 },
  { label: 'Nivel 1 – Field Devices', pct: 97,   color: '#C5A46D', events: 87  },
  { label: 'Nivel 0 – Sensores/OT',   pct: 100,  color: '#10B981', events: 23  },
]

/* ─────────── Threat summary ─────────── */
const threats = [
  { label: 'CRITICAL', count: 0,  color: '#EF4444' },
  { label: 'HIGH',     count: 2,  color: '#F97316' },
  { label: 'MEDIUM',   count: 7,  color: '#F59E0B' },
  { label: 'LOW',      count: 31, color: '#10B981' },
]

// Each queued line gets a globally unique renderKey so AnimatePresence
// never sees duplicate keys even after the 12-item pool wraps around.
type QueuedLine = typeof LOG_LINES[0] & { renderKey: number }

function LogScroller() {
  const renderKeyRef = useRef(LOG_LINES.length)          // monotonic counter
  const nextIdxRef   = useRef(LOG_LINES.length % LOG_LINES.length) // next source idx

  const [queue, setQueue] = useState<QueuedLine[]>(() =>
    LOG_LINES.slice(0, 6).map((line, i) => ({ ...line, renderKey: i }))
  )

  useEffect(() => {
    const id = setInterval(() => {
      const srcIdx  = nextIdxRef.current % LOG_LINES.length
      const line    = LOG_LINES[srcIdx]
      const rk      = renderKeyRef.current
      nextIdxRef.current++
      renderKeyRef.current++
      setQueue(q => [...q.slice(1), { ...line, renderKey: rk }])
    }, 1800)
    return () => clearInterval(id)
  }, [])

  return (
    <div style={{ fontFamily: 'monospace', fontSize: '0.72rem', lineHeight: 1.7, overflow: 'hidden', height: 170 }}>
      <AnimatePresence initial={false}>
        {queue.map((line) => (
          <motion.div
            key={line.renderKey}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            style={{ display: 'flex', gap: '0.6rem', padding: '0.1rem 0' }}
          >
            <span style={{ color: 'rgba(148,163,184,0.5)', flexShrink: 0 }}>{line.time}</span>
            <span style={{ color: line.color, fontWeight: 700, minWidth: 40, flexShrink: 0 }}>{line.level}</span>
            <span style={{ color: '#64748B', flexShrink: 0, minWidth: 96 }}>{line.src}</span>
            <span style={{ color: 'var(--muted)' }}>{line.msg}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
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
  // SSR-safe clock: start empty to avoid hydration mismatch, populate client-side
  const [timeStr, setTimeStr] = useState('')

  useEffect(() => {
    function tick() {
      setTimeStr(new Date().toTimeString().slice(0, 8))
    }
    tick()                              // run immediately on mount
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <section id="siem" style={{ padding: '5rem 2rem', background: 'var(--bg)' }}>
      <div style={{ maxWidth: 1100, margin: 'auto' }}>
        <SectionHeader label="Security Operations" title="SIEM" highlight="Dashboard" />

        <FadeIn delay={0.1}>
          <p style={{ color: 'var(--muted)', marginBottom: '2.5rem', fontSize: '0.92rem', maxWidth: 640 }}>
            Visualización en tiempo real del ecosistema de seguridad IT/OT bajo el{' '}
            <span style={{ color: 'var(--blue)', fontWeight: 600 }}>Modelo Purdue</span>{' '}
            e implementación{' '}
            <span style={{ color: 'var(--gold)', fontWeight: 600 }}>IEC 62443</span>.
          </p>
        </FadeIn>

        <FadeIn delay={0.15}>
          {/* Top bar */}
          <div style={{
            background: 'rgba(10,25,47,0.9)',
            border: '1px solid rgba(30,144,255,0.2)',
            borderRadius: '14px 14px 0 0',
            padding: '0.65rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(30,144,255,0.12)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <motion.div
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' }}
              />
              <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#10B981', fontWeight: 700 }}>
                SECURITY ONION — OT/IT SIEM
              </span>
            </div>
            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
              <span style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: 'var(--muted)' }}>
                IEC 62443 | NIST CSF | ISO 27001
              </span>
              <span style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: '#64748B' }}>
                {timeStr} UTC-3
              </span>
            </div>
          </div>

          {/* Main grid */}
          <div className="siem-grid" style={{
            background: 'rgba(10,25,47,0.75)',
            border: '1px solid rgba(30,144,255,0.15)',
            borderTop: 'none',
            borderRadius: '0 0 14px 14px',
            padding: '1.5rem',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '1.25rem',
          }}>
            {/* Col 1: Log stream */}
            <div className="siem-span2" style={{ gridColumn: 'span 2' }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--blue)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '0.75rem', fontWeight: 700 }}>
                ▶ Event Stream – Nivel IT/OT
              </div>
              <div style={{
                background: 'rgba(0,0,0,0.4)',
                border: '1px solid rgba(30,144,255,0.12)',
                borderRadius: 8,
                padding: '0.75rem 1rem',
              }}>
                <LogScroller />
              </div>

              {/* Zone availability */}
              <div style={{ marginTop: '1.25rem' }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--blue)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '0.75rem', fontWeight: 700 }}>
                  Disponibilidad por Zona Purdue
                </div>
                {zones.map((z, i) => <ZoneBar key={z.label} zone={z} delay={0.3 + i * 0.1} />)}
              </div>
            </div>

            {/* Col 2: Threat summary + stats */}
            <div>
              <div style={{ fontSize: '0.68rem', color: '#EF4444', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '0.75rem', fontWeight: 700 }}>
                Threat Summary
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                {threats.map(t => (
                  <div key={t.label} style={{
                    background: 'rgba(0,0,0,0.3)',
                    border: `1px solid ${t.color}22`,
                    borderRadius: 8,
                    padding: '0.6rem 0.9rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                    <span style={{ fontSize: '0.7rem', color: t.color, fontWeight: 700, fontFamily: 'monospace' }}>{t.label}</span>
                    <span style={{
                      background: `${t.color}22`,
                      color: t.color,
                      borderRadius: 20,
                      padding: '0.1rem 0.55rem',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                    }}>{t.count}</span>
                  </div>
                ))}
              </div>

              <div style={{ fontSize: '0.68rem', color: 'var(--gold)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '0.75rem', fontWeight: 700 }}>
                KPIs Operativos
              </div>
              {[
                { label: 'MTTR',     val: '< 15 min',  icon: '⏱' },
                { label: 'Uptime',   val: '99.9%',     icon: '✅' },
                { label: 'Incid/M',  val: '−30%',      icon: '📉' },
                { label: 'Automat.', val: '−10h/sem',  icon: '🤖' },
              ].map(k => (
                <div key={k.label} style={{
                  display: 'flex', justifyContent: 'space-between',
                  padding: '0.4rem 0',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  fontSize: '0.75rem',
                }}>
                  <span style={{ color: 'var(--muted)' }}>{k.icon} {k.label}</span>
                  <span style={{ color: 'var(--gold)', fontWeight: 700, fontFamily: 'monospace' }}>{k.val}</span>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>
      </div>

      <style>{`
        @media (max-width: 700px) {
          #siem .grid-3 { grid-template-columns: 1fr !important; }
          #siem .span-2 { grid-column: span 1 !important; }
        }
      `}</style>
    </section>
  )
}
