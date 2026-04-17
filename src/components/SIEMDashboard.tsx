'use client'

import { motion, useInView, AnimatePresence } from 'framer-motion'
import { useRef, useEffect, useState } from 'react'
import SectionHeader from './ui/SectionHeader'
import FadeIn from './ui/FadeIn'

type KasperskyLiveData = {
  success: boolean
  status: number
  source: string
  fetchedAt: string
  title?: string
  attackCount?: string
}

/* ─── Log lines with mitigation for ALERT events ─── */
const LOG_LINES = [
  { id: 1,  time: '04:12:33', level: 'INFO',  src: '10.0.1.24',   msg: 'SSH login success – admin@fw-ot-01',       color: '#10B981', mitigation: null },
  { id: 2,  time: '04:12:41', level: 'WARN',  src: '192.168.5.3', msg: 'Port scan detected on OT VLAN (DNP3)',     color: '#F59E0B', mitigation: null },
  { id: 3,  time: '04:12:58', level: 'ALERT', src: '172.16.0.88', msg: 'SCADA polling anomaly – Modbus register',  color: '#EF4444',
    mitigation: { action: 'Isolation triggered via Firewall Rule #OT-47', steps: ['Blocked src IP 172.16.0.88 on Level 2 ACL', 'SCADA session suspended — Historian notified', 'IEC 62443 Zone A lockdown activated'], time: '< 90s' } },
  { id: 4,  time: '04:13:05', level: 'INFO',  src: '10.0.1.1',    msg: 'Firewall rule applied: DENY ext→PLC zone',  color: '#10B981', mitigation: null },
  { id: 5,  time: '04:13:17', level: 'INFO',  src: '10.0.2.44',   msg: 'OPC UA session authenticated – Historian', color: '#10B981', mitigation: null },
  { id: 6,  time: '04:13:29', level: 'WARN',  src: '10.0.5.12',   msg: 'Failed auth x3 – IAM lockout triggered',  color: '#F59E0B', mitigation: null },
  { id: 7,  time: '04:13:41', level: 'ALERT', src: '172.16.0.4',  msg: 'Lateral movement attempt – blocked IAM',  color: '#EF4444',
    mitigation: { action: 'IAM lockout + AD account suspended', steps: ['Account disabled in Active Directory', 'Session tokens revoked – Azure AD B2C', 'SOC alert dispatched via Security Onion rule CR-214'], time: '< 45s' } },
  { id: 8,  time: '04:14:02', level: 'INFO',  src: '10.0.1.24',   msg: 'Backup job completed – Veeam OK (99.9%)', color: '#10B981', mitigation: null },
  { id: 9,  time: '04:14:18', level: 'WARN',  src: '192.168.2.9', msg: 'Unusual traffic pattern – OT Level 1',    color: '#F59E0B', mitigation: null },
  { id: 10, time: '04:14:33', level: 'ALERT', src: '10.0.0.5',    msg: 'CVE-2021-34527 pattern matched on host',  color: '#EF4444',
    mitigation: { action: 'Host quarantined – patch deployment initiated', steps: ['NIC isolation applied via VMware vSphere', 'Nessus scan queued for remediation validation', 'Change ticket #INC-2891 raised (NIST SP-800-61)'], time: '< 3 min' } },
  { id: 11, time: '04:14:49', level: 'INFO',  src: '10.0.1.1',    msg: 'Correlation rule fired: IEC 62443 Zone A', color: '#10B981', mitigation: null },
  { id: 12, time: '04:15:05', level: 'INFO',  src: '10.0.3.7',    msg: 'Python report generator – completed',     color: '#10B981', mitigation: null },
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
  { label: 'CRITICAL', count: 0,  color: '#EF4444' },
  { label: 'HIGH',     count: 2,  color: '#F97316' },
  { label: 'MEDIUM',   count: 7,  color: '#F59E0B' },
  { label: 'LOW',      count: 31, color: '#10B981' },
]

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
  const [liveData, setLiveData] = useState<KasperskyLiveData | null>(null)
  const [liveError, setLiveError] = useState<string | null>(null)

  useEffect(() => {
    const tick = () => setTimeStr(new Date().toTimeString().slice(0, 8))
    tick()

    const fetchLive = async () => {
      try {
        const res = await fetch('/api/kaspersky')
        const data = (await res.json()) as KasperskyLiveData
        setLiveData(data)
        if (!res.ok) {
          setLiveError(data.title || 'No se pudo obtener datos en vivo')
        } else {
          setLiveError(null)
        }
      } catch (error) {
        setLiveError('No se pudo conectar con Kaspersky en vivo')
      }
    }

    fetchLive()
    const interval = setInterval(fetchLive, 30000)

    const id = setInterval(tick, 1000)
    return () => {
      clearInterval(interval)
      clearInterval(id)
    }
  }, [])

  return (
    <section id="siem" style={{ padding: 'clamp(2rem, 5vw, 5rem) clamp(1rem, 5vw, 2rem)', background: 'var(--bg)' }}>
      <div style={{ maxWidth: 1100, margin: 'auto' }}>
        <SectionHeader label="Security Operations" title="SIEM" highlight="Dashboard" />

        <FadeIn delay={0.1}>
          <p style={{ color: 'var(--muted)', marginBottom: 'clamp(0.4rem, 1vw, 0.6rem)', fontSize: 'clamp(0.85rem, 1.8vw, 0.92rem)', maxWidth: 640 }}>
            Monitoreo en tiempo real bajo el{' '}
            <span style={{ color: 'var(--blue)', fontWeight: 600 }}>Modelo Purdue</span>{' '}
            e implementación{' '}
            <span style={{ color: 'var(--gold)', fontWeight: 600 }}>IEC 62443</span>.
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
                SECURITY ONION — OT/IT SIEM
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end', textAlign: 'right' }}>
              <span style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: 'var(--muted)' }}>
                IEC 62443 | NIST CSF | ISO 27001
              </span>
              <span style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: '#64748B' }}>{timeStr} UTC-3</span>
              <div style={{ marginTop: '0.65rem', padding: '0.5rem 0.75rem', borderRadius: 10, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)', color: liveError ? '#F97316' : '#10B981', fontSize: '0.72rem', minWidth: 220 }}>
                <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Kaspersky Cybermap</div>
                {liveData ? (
                  liveError ? (
                    <span>{liveError}</span>
                  ) : (
                    <span>{liveData.attackCount ? `Ataques detectados: ${liveData.attackCount}` : liveData.title || 'Datos en vivo conectados'}</span>
                  )
                ) : (
                  <span>Cargando datos en vivo...</span>
                )}
              </div>
            </div>
          </div>

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
                {zones.map((z, i) => <ZoneBar key={z.label} zone={z} delay={0.3 + i * 0.1} />)}
              </div>
            </div>

            {/* Stats col */}
            <div>
              <div style={{ fontSize: '0.68rem', color: '#EF4444', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '0.75rem', fontWeight: 700 }}>
                Threat Summary
              </div>
              {liveData && !liveError && (
                <div style={{ marginBottom: '1rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '0.75rem' }}>
                  <div style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 700, marginBottom: '0.35rem' }}>Datos en vivo de Kaspersky</div>
                  <div style={{ color: 'var(--muted)', fontSize: '0.72rem', marginBottom: '0.25rem' }}>{liveData.attackCount ? `Ataques detectados: ${liveData.attackCount}` : 'Sin métrica exacta disponible'}</div>
                  <div style={{ color: '#64748B', fontSize: '0.68rem' }}>Última actualización: {new Date(liveData.fetchedAt).toLocaleTimeString('es-AR', { hour12: false })}</div>
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                {threats.map(t => (
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
                { label: 'MTTR',     val: '< 15 min', icon: '⏱' },
                { label: 'Uptime',   val: '99.9%',    icon: '✅' },
                { label: 'Incid/M',  val: '−30%',     icon: '📉' },
                { label: 'Automat.', val: '−10h/sem', icon: '🤖' },
              ].map(k => (
                <div key={k.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '0.75rem' }}>
                  <span style={{ color: 'var(--muted)' }}>{k.icon} {k.label}</span>
                  <span style={{ color: 'var(--gold)', fontWeight: 700, fontFamily: 'monospace' }}>{k.val}</span>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
