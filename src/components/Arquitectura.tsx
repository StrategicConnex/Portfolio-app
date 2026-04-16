'use client'

import dynamic from 'next/dynamic'
import SectionHeader from './ui/SectionHeader'
import FadeIn from './ui/FadeIn'

/* Carga el canvas 3D solo en cliente (Three.js no funciona en SSR) */
const MindMap3D = dynamic(() => import('./MindMap3D'), {
  ssr: false,
  loading: () => (
    <div style={{
      width: '100%', height: 480,
      background: 'rgba(30,144,255,0.03)',
      border: '1px solid rgba(30,144,255,0.15)',
      borderRadius: 16,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{ textAlign: 'center', color: 'var(--muted)' }}>
        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🌐</div>
        <p style={{ fontSize: '0.85rem' }}>Cargando mapa 3D…</p>
      </div>
    </div>
  ),
})

const domainCards = [
  { color: '#1E90FF', emoji: '🛡️', title: 'Ciberseguridad IT/OT', items: ['IEC 62443', 'NIST CSF', 'ISO 27001', 'SIEM – Security Onion', 'Modelo Purdue'] },
  { color: '#3B82F6', emoji: '🌐', title: 'Redes & Infraestructura', items: ['Cisco CCNA', 'MPLS', 'MikroTik', 'VSAT', 'Riverbed WAN'] },
  { color: '#06B6D4', emoji: '☁️', title: 'Cloud & Virtualización',  items: ['Azure', 'AWS', 'VMware vSphere', 'ESXi / vCenter', 'Windows Server'] },
  { color: '#F97316', emoji: '⚙️', title: 'OT / Industrial',         items: ['SCADA', 'Modbus', 'OPC UA', 'DNP3', 'Edge Computing'] },
  { color: '#8B5CF6', emoji: '💻', title: 'Desarrollo Web',          items: ['Next.js 14', 'React', 'Tailwind CSS', 'TypeScript', 'Vercel / CI-CD'] },
  { color: '#10B981', emoji: '🤖', title: 'Automatización',          items: ['Python', 'Power BI', 'Scripts PowerShell', 'Dashboards KPI'] },
]

export default function Arquitectura() {
  return (
    <section id="arquitectura" style={{ padding: '5rem 2rem', background: 'var(--bg2)' }}>
      <div style={{ maxWidth: 1100, margin: 'auto' }}>
        <SectionHeader label="Visión sistémica" title="Arquitectura" highlight="Mental 3D" />

        <FadeIn delay={0.05}>
          <p style={{ color: 'var(--muted)', marginBottom: '0.5rem', fontSize: '0.92rem', maxWidth: 580 }}>
            Mapa interactivo de competencias. Arrastrá para rotar · Scroll para zoom.
          </p>
          <p style={{ color: 'var(--blue)', fontSize: '0.72rem', letterSpacing: '1.5px', textTransform: 'uppercase', fontWeight: 600, marginBottom: '2rem' }}>
            Renderizado con React Three Fiber + Three.js
          </p>
        </FadeIn>

        {/* 3D Canvas */}
        <FadeIn delay={0.1}>
          <MindMap3D />
        </FadeIn>

        {/* Domain cards below */}
        <FadeIn delay={0.2}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '0.85rem',
            marginTop: '2.5rem',
          }}>
            {domainCards.map((card) => (
              <div
                key={card.title}
                style={{
                  background: `rgba(${parseInt(card.color.slice(1,3),16)}, ${parseInt(card.color.slice(3,5),16)}, ${parseInt(card.color.slice(5,7),16)}, 0.05)`,
                  border: `1px solid ${card.color}22`,
                  borderRadius: 10,
                  padding: '1rem 1.2rem',
                  transition: 'border-color 0.25s',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = card.color + '66')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = card.color + '22')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
                  <span style={{ fontSize: '1.1rem' }}>{card.emoji}</span>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: card.color, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {card.title}
                  </span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                  {card.items.map(item => (
                    <span key={item} style={{
                      background: `rgba(${parseInt(card.color.slice(1,3),16)}, ${parseInt(card.color.slice(3,5),16)}, ${parseInt(card.color.slice(5,7),16)}, 0.1)`,
                      color: card.color,
                      border: `1px solid ${card.color}20`,
                      padding: '0.12rem 0.5rem',
                      borderRadius: 20,
                      fontSize: '0.7rem',
                      fontWeight: 500,
                    }}>
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
