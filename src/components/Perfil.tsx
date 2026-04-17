'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import SectionHeader from './ui/SectionHeader'
import FadeIn from './ui/FadeIn'

const metrics = [
  { num: '99.9%', label: 'Disponibilidad de red comprometida', color: 'var(--blue)', icon: '🛡️' },
  { num: '−30%',  label: 'Reducción de incidentes de seguridad', color: '#10B981', icon: '📉' },
  { num: '−10h',  label: 'Ahorro semanal con automatización Python', color: 'var(--gold)', icon: '⚡' },
  { num: '+25%',  label: 'Eficiencia operativa en virtualización', color: '#8B5CF6', icon: '🚀' },
]

const competencias = [
  {
    grupo: 'Ciberseguridad Industrial',
    color: '#1E90FF',
    items: ['Modelo Purdue', 'IEC 62443', 'NIST CSF', 'ISO 27001', 'SOX', 'SIEM – Security Onion', 'IAM', 'Firewalls Industriales'],
  },
  {
    grupo: 'Redes & Infraestructura',
    color: '#3B82F6',
    items: ['Cisco CCNA', 'MPLS', 'MikroTik', 'VSAT', 'Riverbed WAN', 'VPN', 'Fibra Óptica', 'DNS / DHCP'],
  },
  {
    grupo: 'Cloud & Virtualización',
    color: '#06B6D4',
    items: ['Microsoft Azure', 'AWS', 'VMware vSphere', 'ESXi', 'vCenter', 'Nexus 1000v', 'Windows Server 2003–2022', 'Active Directory', 'Exchange', 'SQL Server', 'Linux'],
  },
  {
    grupo: 'OT / Control Industrial',
    color: '#C5A46D',
    items: ['SCADA', 'Modbus', 'OPC UA', 'DNP3', 'Edge Computing', 'Veeam Backup', 'Backup Exec', 'Control Industrial'],
  },
  {
    grupo: 'Desarrollo & Automatización',
    color: '#8B5CF6',
    items: ['Next.js 14', 'React.js', 'Tailwind CSS', 'JavaScript ES6+', 'TypeScript', 'Python', 'Power BI', 'CI/CD', 'Vercel'],
  },
  {
    grupo: 'Gestión & GRC',
    color: '#10B981',
    items: ['PMI / Project Management', 'GRC', 'Risk Analysis', 'Incident Response', 'Stakeholder Management', 'SDLC'],
  },
]

function MetricCard({ num, label, color, icon, delay }: { num: string; label: string; color: string; icon: string; delay: number }) {
  const ref    = useRef(null)
  const inView = useInView(ref, { once: true })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay, duration: 0.6, ease: 'easeOut' }}
      whileHover={{ y: -5 }}
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: '1.75rem 1.5rem',
        textAlign: 'center',
        cursor: 'default',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
      <div style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>{icon}</div>
      <div style={{ fontSize: '2.4rem', fontWeight: 800, color, lineHeight: 1 }}>{num}</div>
      <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '0.5rem', lineHeight: 1.45 }}>{label}</div>
    </motion.div>
  )
}

export default function Perfil() {
  return (
    <section id="perfil" style={{ padding: 'clamp(2rem, 5vw, 5rem) clamp(1rem, 5vw, 2rem)', background: 'var(--bg)' }}>
      <div style={{ maxWidth: 1100, margin: 'auto' }}>
        <SectionHeader label="Sobre mí" title="Perfil" highlight="Profesional" />

        <FadeIn delay={0.1}>
          <p style={{ color: 'var(--muted)', maxWidth: 840, marginBottom: '1.4rem', fontSize: 'clamp(0.85rem, 2vw, 0.97rem)', lineHeight: 1.75 }}>
            Profesional en Ciberseguridad y Arquitectura de Redes con{' '}
            <span style={{ color: 'var(--text)', fontWeight: 700 }}>más de 20 años</span>{' '}
            de trayectoria en el sector industrial. Especialista en la convergencia{' '}
            <span style={{ color: 'var(--blue)', fontWeight: 700 }}>IT/OT</span>{' '}
            con sólida experiencia en el diseño e implementación del{' '}
            <span style={{ color: 'var(--blue)', fontWeight: 700 }}>Modelo Purdue</span>{' '}
            para la protección de infraestructuras críticas en Oil &amp; Gas.
          </p>
          <p style={{ color: 'var(--muted)', maxWidth: 840, marginBottom: '3rem', fontSize: 'clamp(0.85rem, 2vw, 0.97rem)', lineHeight: 1.75 }}>
            Experto en defensa activa mediante{' '}
            <span style={{ color: 'var(--text)', fontWeight: 600 }}>SIEM (Security Onion)</span>,
            gestión de identidades (IAM) y aseguramiento de la continuidad operativa bajo los estándares{' '}
            <span style={{ color: 'var(--gold)', fontWeight: 700 }}>IEC 62443, NIST y SOX</span>.
            Perfil híbrido único: Infraestructura crítica + Desarrollo Full-Stack + Estrategia de Seguridad.
          </p>
        </FadeIn>

        {/* Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(180px, 100%, 200px), 1fr))', gap: 'clamp(0.75rem, 2vw, 1.25rem)', marginBottom: 'clamp(2rem, 5vw, 3.5rem)' }}>
          {metrics.map((m, i) => <MetricCard key={m.label} {...m} delay={i * 0.1 + 0.2} />)}
        </div>

        {/* Competencias grouped */}
        <FadeIn delay={0.3}>
          <div style={{ marginTop: '3rem', marginBottom: '1rem' }}>
            <p style={{ fontSize: 'clamp(0.65rem, 1.5vw, 0.72rem)', color: 'var(--blue)', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: 'clamp(0.75rem, 2vw, 1.25rem)' }}>
              Dominio técnico completo
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(250px, 100%, 280px), 1fr))', gap: 'clamp(0.75rem, 2vw, 0.9rem)' }}>
              {competencias.map((c) => (
                <motion.div
                  key={c.grupo}
                  whileHover={{ borderColor: c.color + '66' }}
                  style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: 'clamp(0.75rem, 2vw, 1.2rem)', transition: 'border-color 0.3s' }}
                >
                  <div style={{ fontSize: 'clamp(0.75rem, 1.5vw, 0.82rem)', color: 'var(--text)', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '0.8rem' }}>
                    {c.grupo}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                    {c.items.map(item => (
                      <span key={item} style={{
                        background: 'rgba(255,255,255,0.08)',
                        color: 'var(--text)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        padding: '0.24rem 0.65rem',
                        borderRadius: 22,
                        fontSize: 'clamp(0.75rem, 1.2vw, 0.82rem)',
                        fontWeight: 500,
                        minWidth: 'max-content',
                      }}>
                        {item}
                      </span>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
