'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import SectionHeader from './ui/SectionHeader'
import FadeIn from './ui/FadeIn'

const categories = [
  {
    icon: '🛡️',
    cat: 'Seguridad',
    title: 'Ciberseguridad Industrial',
    color: '#1E90FF',
    tags: ['Security Onion (SIEM)', 'Firewalls', 'IAM', 'IEC 62443', 'NIST CSF', 'ISO 27001', 'SOX', 'Modelo Purdue', 'Incident Response'],
  },
  {
    icon: '🌐',
    cat: 'Redes',
    title: 'Infraestructura & Conectividad',
    color: '#3B82F6',
    tags: ['Cisco CCNA', 'MPLS', 'MikroTik', 'VSAT', 'Riverbed WAN', 'VPN', 'Fibra Óptica', 'DNS / DHCP'],
  },
  {
    icon: '☁️',
    cat: 'Cloud & Virtualización',
    title: 'Plataformas & Servidores',
    color: '#06B6D4',
    tags: ['Microsoft Azure', 'AWS', 'VMware vSphere', 'ESXi', 'vCenter', 'Windows Server 2003–2022', 'Active Directory', 'Linux'],
  },
  {
    icon: '⚙️',
    cat: 'OT / Industrial',
    title: 'Sistemas de Control',
    color: '#C5A46D',
    tags: ['SCADA', 'Modbus', 'OPC UA', 'DNP3', 'Edge Computing', 'Veeam Backup', 'Control Industrial'],
  },
  {
    icon: '💻',
    cat: 'Desarrollo',
    title: 'Web & Full-Stack',
    color: '#8B5CF6',
    tags: ['Next.js 14', 'React.js', 'Tailwind CSS', 'JavaScript ES6+', 'TypeScript', 'CI/CD', 'Vercel', 'SEO Técnico'],
  },
  {
    icon: '🤖',
    cat: 'Automatización & Datos',
    title: 'Inteligencia Operativa',
    color: '#10B981',
    tags: ['Python', 'Power BI', 'PowerShell', 'Dashboards KPI', 'Análisis de datos', 'Reportes automáticos'],
  },
]

function StackCard({ item, index }: { item: typeof categories[0]; index: number }) {
  const ref    = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -5, borderColor: item.color + '88' }}
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 14,
        padding: '1.6rem',
        transition: 'border-color 0.3s',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'default',
      }}
    >
      {/* Top accent */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={inView ? { scaleX: 1 } : {}}
        transition={{ delay: index * 0.08 + 0.3, duration: 0.5 }}
        style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: `linear-gradient(90deg, ${item.color}, transparent)`,
          transformOrigin: 'left',
        }}
      />

      <div style={{ fontSize: '1.6rem', marginBottom: '0.6rem' }}>{item.icon}</div>
      <div style={{ fontSize: '0.7rem', color: item.color, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '0.3rem', fontWeight: 600 }}>
        {item.cat}
      </div>
      <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.9rem' }}>
        {item.title}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
        {item.tags.map(t => (
          <span key={t} style={{
            background: `rgba(${parseInt(item.color.slice(1,3),16)}, ${parseInt(item.color.slice(3,5),16)}, ${parseInt(item.color.slice(5,7),16)}, 0.1)`,
            color: item.color,
            border: `1px solid ${item.color}33`,
            padding: '0.18rem 0.6rem',
            borderRadius: 20,
            fontSize: '0.73rem',
            fontWeight: 500,
          }}>
            {t}
          </span>
        ))}
      </div>
    </motion.div>
  )
}

export default function Stack() {
  return (
    <section id="stack" style={{ padding: 'clamp(2rem, 5vw, 5rem) clamp(1rem, 5vw, 2rem)', background: 'var(--bg)' }}>
      <div style={{ maxWidth: 1100, margin: 'auto' }}>
        <SectionHeader label="Tecnología" title="Stack" highlight="Tecnológico" />

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(240px, 100%, 290px), 1fr))',
          gap: 'clamp(0.75rem, 2vw, 1.25rem)',
        }}>
          {categories.map((item, i) => (
            <StackCard key={item.cat} item={item} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
