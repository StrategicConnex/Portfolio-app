'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import SectionHeader from './ui/SectionHeader'
import FadeIn from './ui/FadeIn'

const jobs = [
  {
    period:  'Julio 2025 – Actual',
    company: 'YPY Oilfield Services',
    role:    'Project Manager IT | Cybersecurity Leader | SysAdmin',
    color:   '#1E90FF',
    badge:   'Actual',
    achievements: [
      { icon: '🛡️', text: 'Políticas de seguridad alineadas a ISO 27001 y NIST' },
      { icon: '🔍', text: 'SIEM Security Onion + IAM + Firewalls industriales' },
      { icon: '⚙️', text: 'Convergencia IT/OT: protección SCADA y control de procesos' },
      { icon: '☁️', text: 'Infraestructura híbrida: on-premise + Azure + AWS + VMware' },
    ],
    bullets: [
      'Planificación y ejecución de proyectos tecnológicos bajo metodología PMI con reporte a gerencia',
      'Diseño e implementación de políticas de seguridad alineadas a ISO 27001 y NIST; gestión de riesgos, vulnerabilidades e incidentes',
      'Administración de controles: firewalls, antivirus, IAM y SIEM (Security Onion)',
      'Aseguramiento de la convergencia IT/OT: protección de sistemas SCADA y control de procesos industriales',
      'Supervisión de infraestructuras Edge Computing para garantizar disponibilidad operativa',
      'Administración de servidores Windows/Linux en entornos on-premise, cloud (Azure, AWS) y VMware',
      'Gestión de Active Directory, DNS, DHCP, VPN, backup, recovery y monitoreo 24/7',
    ],
    tags: ['ISO 27001', 'NIST', 'Security Onion', 'SCADA', 'PMI', 'Azure', 'AWS', 'VMware', 'IAM'],
  },
  {
    period:  'Mayo 2013 – Noviembre 2024',
    company: 'Oilfield Production Services SRL',
    role:    'Sr. Network Architect',
    color:   '#C5A46D',
    badge:   '11 años',
    achievements: [
      { icon: '📡', text: '99.9% uptime en sistemas críticos de producción' },
      { icon: '📉', text: '−30% reducción de incidentes de seguridad' },
      { icon: '⚡', text: '−20% latencia con optimización Cisco / MikroTik' },
      { icon: '🤖', text: '−10h semanales por automatización Python + Power BI' },
      { icon: '🚀', text: '+25% eficiencia: virtualización datacenter vSphere/ESXi' },
      { icon: '🔒', text: 'SIEM Security Onion para detección temprana de intrusiones' },
    ],
    bullets: [
      'Diseño de arquitectura de red para sistemas críticos de producción con 99.9% de disponibilidad',
      'Implementación de políticas avanzadas de seguridad en redes satelitales y terrestres (−30% incidentes)',
      'Actualización y optimización de equipos Cisco y MikroTik (−20% latencia)',
      'Automatización de reportes de red con Python y Power BI (−10h semanales)',
      'Liderazgo de equipo de 3 ingenieros en virtualización de datacenter (vSphere, ESXi, vCenter, Nexus 1000v)',
      'Proyectos de actualización de servidores con equipos globales (−15% downtime)',
      'Diseño de anillos de fibra óptica y redes satelitales (VSAT) para telemetría de campo',
      'Implementación y mantenimiento de telefonía IP Cisco Unified Manager 8.5',
      'Implementación de aceleradores WAN Riverbed para optimización satelital',
      'Implementación de plataforma SIEM Security Onion',
      'Análisis de datos con Power BI y Python; desarrollo de scripts para análisis de logs',
    ],
    tags: ['Cisco', 'VSAT', 'MPLS', 'MikroTik', 'Riverbed', 'Python', 'VMware', 'Security Onion', 'Fibra Óptica', 'SQL Server'],
  },
  {
    period:  'Marzo 2003 – Mayo 2013',
    company: 'Exterran Argentina SRL',
    role:    'Business Technology & Infrastructure Manager',
    color:   '#6366F1',
    badge:   '10 años',
    achievements: [
      { icon: '🌐', text: 'Red MPLS: 5 bases + 33 sitios satelitales' },
      { icon: '💡', text: '−20% recursos físicos con virtualización regional' },
      { icon: '💰', text: '−20% costos de red vía renegociación de contratos' },
      { icon: '🏗️', text: 'HUB Latinoamérica en Buenos Aires: servidores regionales virtualizados' },
      { icon: '📋', text: 'Cumplimiento SOX implementado para el área de IT' },
    ],
    bullets: [
      'Diseño de la red MPLS nacional: 5 bases operativas y 33 sitios satelitales',
      'Reducción 20% en recursos físicos: virtualización de servidores regional en Latinoamérica',
      'Reducción 20% en costos de red: renegociación de contratos con proveedores clave',
      'Estabilidad mejorada 25%: implementación de Veeam, Backup Exec y aceleradores WAN Riverbed',
      'Diseño del HUB de Latinoamérica en Buenos Aires virtualizando todos los servidores regionales',
      'Implementación del cumplimiento SOX para el área de IT',
      'Diseño e implementación de telefonía IP (Cisco Unified Manager 8.5)',
      'Implementación de solución de backup corporativo y plan de contingencia',
    ],
    tags: ['MPLS', 'VSAT', 'SOX', 'Virtualización', 'Riverbed', 'Veeam', 'IP Telephony', 'HUB Latinoamérica'],
  },
]

function TimelineItem({ job, index }: { job: typeof jobs[0]; index: number }) {
  const ref    = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: -30 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.65, delay: index * 0.12, ease: 'easeOut' }}
      style={{ position: 'relative', paddingLeft: '2.2rem', marginBottom: '3.5rem' }}
    >
      {/* Dot */}
      <motion.div
        initial={{ scale: 0 }}
        animate={inView ? { scale: 1 } : {}}
        transition={{ delay: index * 0.12 + 0.2, type: 'spring', stiffness: 260 }}
        style={{
          position: 'absolute', left: '-0.6rem', top: '0.4rem',
          width: 16, height: 16, borderRadius: '50%',
          background: job.color, border: '2px solid var(--bg2)',
          boxShadow: `0 0 0 3px ${job.color}44`, zIndex: 1,
        }}
      />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.3rem' }}>
        <div>
          <div style={{ fontSize: '0.72rem', color: job.color, letterSpacing: '1px', marginBottom: '0.2rem', fontWeight: 700 }}>
            {job.period}
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text)' }}>{job.company}</div>
          <div style={{ fontSize: '0.87rem', color: job.color, marginBottom: '0.9rem' }}>{job.role}</div>
        </div>
        <span style={{
          marginLeft: 'auto',
          background: `rgba(${parseInt(job.color.slice(1,3),16)}, ${parseInt(job.color.slice(3,5),16)}, ${parseInt(job.color.slice(5,7),16)}, 0.12)`,
          color: job.color,
          border: `1px solid ${job.color}33`,
          padding: '0.2rem 0.7rem',
          borderRadius: 20,
          fontSize: '0.7rem',
          fontWeight: 700,
          height: 'fit-content',
          whiteSpace: 'nowrap',
        }}>
          {job.badge}
        </span>
      </div>

      {/* Achievement chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
        {job.achievements.map((a) => (
          <div key={a.text} style={{
            display: 'flex', alignItems: 'center', gap: '0.35rem',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 8, padding: '0.3rem 0.7rem',
            fontSize: '0.78rem', color: 'var(--text)',
          }}>
            <span>{a.icon}</span><span>{a.text}</span>
          </div>
        ))}
      </div>

      {/* Collapsible bullets */}
      <ul style={{ listStyle: 'none', padding: 0, marginBottom: '1rem' }}>
        {job.bullets.map((b, i) => (
          <li key={i} style={{ fontSize: '0.85rem', color: 'var(--muted)', padding: '0.18rem 0 0.18rem 1rem', position: 'relative', lineHeight: 1.6 }}>
            <span style={{ position: 'absolute', left: 0, color: job.color }}>▸</span>
            {b}
          </li>
        ))}
      </ul>

      {/* Tags */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
        {job.tags.map(t => (
          <span key={t} style={{
            background: `rgba(${parseInt(job.color.slice(1,3),16)}, ${parseInt(job.color.slice(3,5),16)}, ${parseInt(job.color.slice(5,7),16)}, 0.08)`,
            color: job.color,
            border: `1px solid ${job.color}25`,
            padding: '0.15rem 0.55rem',
            borderRadius: 20, fontSize: '0.7rem', fontWeight: 500,
          }}>
            {t}
          </span>
        ))}
      </div>
    </motion.div>
  )
}

export default function Experiencia() {
  return (
    <section id="experiencia" style={{ padding: '5rem 2rem', background: 'var(--bg2)' }}>
      <div style={{ maxWidth: 1100, margin: 'auto' }}>
        <SectionHeader label="Trayectoria" title="Experiencia" highlight="Laboral" />

        <FadeIn delay={0.05}>
          <div style={{ marginBottom: '2.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            {[
              { label: '20+ años en el sector industrial', color: '#C5A46D' },
              { label: 'Oil & Gas · Neuquén · Argentina', color: '#1E90FF' },
              { label: 'IT/OT · Cloud · Security · Dev', color: '#10B981' },
            ].map(b => (
              <span key={b.label} style={{
                background: `rgba(${parseInt(b.color.slice(1,3),16)}, ${parseInt(b.color.slice(3,5),16)}, ${parseInt(b.color.slice(5,7),16)}, 0.1)`,
                color: b.color,
                border: `1px solid ${b.color}33`,
                padding: '0.35rem 0.9rem',
                borderRadius: 20, fontSize: '0.8rem', fontWeight: 600,
              }}>✦ {b.label}</span>
            ))}
          </div>
        </FadeIn>

        <div style={{ position: 'relative', paddingLeft: '0.5rem' }}>
          <div style={{
            position: 'absolute', left: 0, top: 0, bottom: 0, width: 2,
            background: 'linear-gradient(to bottom, #1E90FF, #C5A46D, #6366F1)',
            borderRadius: 1,
          }} />
          {jobs.map((job, i) => <TimelineItem key={job.company} job={job} index={i} />)}
        </div>
      </div>
    </section>
  )
}
