'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import Image from 'next/image'
import SectionHeader from './ui/SectionHeader'
import Icon from './ui/Icon'

const categories = [
  {
    icon: 'shield',
    cat: 'Seguridad',
    title: 'Ciberseguridad Industrial',
    color: '#1E90FF',
    tags: ['Security Onion (SIEM)', 'Firewalls', 'IAM', 'IEC 62443', 'NIST CSF', 'ISO 27001', 'SOX', 'Modelo Purdue', 'Incident Response'],
    img: '/stack_seguridad.png',
  },
  {
    icon: 'network',
    cat: 'Redes',
    title: 'Infraestructura & Conectividad',
    color: '#3B82F6',
    tags: ['Cisco CCNA', 'MPLS', 'MikroTik', 'VSAT', 'Riverbed WAN', 'VPN', 'Fibra Óptica', 'DNS / DHCP'],
    img: '/stack_redes.png',
  },
  {
    icon: 'cloud',
    cat: 'Cloud & Virtualización',
    title: 'Plataformas & Servidores',
    color: '#06B6D4',
    tags: ['Microsoft Azure', 'AWS', 'VMware vSphere', 'ESXi', 'vCenter', 'Windows Server 2003–2022', 'Active Directory', 'Linux'],
    img: '/stack_cloud.png',
  },
  {
    icon: 'automation',
    cat: 'OT / Industrial',
    title: 'Sistemas de Control',
    color: '#C5A46D',
    tags: ['SCADA', 'Modbus', 'OPC UA', 'DNP3', 'Edge Computing', 'Veeam Backup', 'Control Industrial'],
    img: '/stack_ot.png',
  },
  {
    icon: 'web',
    cat: 'Desarrollo',
    title: 'Web & Full-Stack',
    color: '#8B5CF6',
    tags: ['Next.js 14', 'React.js', 'Tailwind CSS', 'JavaScript ES6+', 'TypeScript', 'CI/CD', 'Vercel', 'SEO Técnico'],
    img: '/stack_web.png',
  },
  {
    icon: 'ai',
    cat: 'Automatización & Datos',
    title: 'Inteligencia Operativa',
    color: '#10B981',
    tags: ['Python', 'Power BI', 'PowerShell', 'Dashboards KPI', 'Análisis de datos', 'Reportes automáticos'],
    img: '/stack_data.png',
  },
]

function StackCard({ item, index }: { item: typeof categories[0]; index: number }) {
  const ref    = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={inView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.6, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -5, borderColor: item.color + '88' }}
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: '1.6rem',
        transition: 'border-color 0.3s, transform 0.3s',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'default',
        minHeight: '220px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
      }}
    >
      {/* Background and Overlay */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <Image 
          src={item.img} 
          alt={item.title}
          fill
          style={{ objectFit: 'cover', opacity: 0.15, filter: 'grayscale(0.5) brightness(0.6)' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to top, rgba(0,0,0,1) 30%, transparent 100%)` }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <div style={{ padding: '0.4rem', borderRadius: 8, background: `${item.color}15`, border: `1px solid ${item.color}33`, display: 'flex' }}>
            <Icon name={item.icon} label={item.cat} size={20} />
          </div>
          <div style={{ fontSize: '0.65rem', color: item.color, letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 700 }}>
            {item.cat}
          </div>
        </div>
        
        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '0.75rem' }}>
          {item.title}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
          {item.tags.map(t => (
            <span key={t} style={{
              background: 'rgba(255,255,255,0.04)',
              color: 'rgba(255,255,255,0.7)',
              border: '1px solid rgba(255,255,255,0.1)',
              padding: '0.15rem 0.55rem',
              borderRadius: 20,
              fontSize: '0.68rem',
              fontWeight: 500,
            }}>
              {t}
            </span>
          ))}
        </div>
      </div>
      
      {/* Top accent */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={inView ? { scaleX: 1 } : {}}
        transition={{ delay: index * 0.05 + 0.3, duration: 0.5 }}
        style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: `linear-gradient(90deg, ${item.color}, transparent)`,
          transformOrigin: 'left',
          opacity: 0.7
        }}
      />
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
