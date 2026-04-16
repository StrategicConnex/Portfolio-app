'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import SectionHeader from './ui/SectionHeader'
import FadeIn from './ui/FadeIn'

const nodes = [
  {
    id: 'ciberseguridad',
    label: 'Ciberseguridad',
    emoji: '🛡️',
    x: '50%',
    y: '10%',
    color: '#1E90FF',
    skills: ['IEC 62443', 'NIST CSF', 'ISO 27001', 'SOX', 'SIEM – Security Onion', 'IAM', 'Firewalls', 'Modelo Purdue', 'Incident Response'],
    desc: 'Defensa activa de infraestructuras industriales críticas con estándares internacionales.',
  },
  {
    id: 'redes',
    label: 'Redes',
    emoji: '🌐',
    x: '15%',
    y: '35%',
    color: '#3B82F6',
    skills: ['Cisco CCNA', 'MPLS', 'MikroTik', 'VSAT', 'Riverbed WAN', 'VPN / SD-WAN', 'Fibra óptica', 'DNS / DHCP'],
    desc: 'Diseño y gestión de redes de alta disponibilidad en entornos industriales remotos.',
  },
  {
    id: 'cloud',
    label: 'Cloud',
    emoji: '☁️',
    x: '83%',
    y: '35%',
    color: '#06B6D4',
    skills: ['Microsoft Azure', 'AWS', 'VMware vSphere', 'ESXi / vCenter', 'Windows Server', 'Active Directory', 'Linux'],
    desc: 'Arquitectura híbrida cloud/on-premise con virtualización y alta disponibilidad.',
  },
  {
    id: 'ot',
    label: 'OT / Industrial',
    emoji: '⚙️',
    x: '15%',
    y: '68%',
    color: '#C5A46D',
    skills: ['SCADA', 'Modbus', 'OPC UA', 'DNP3', 'Edge Computing', 'Control Industrial', 'Veeam Backup'],
    desc: 'Protección y convergencia de sistemas de control industrial con entornos IT.',
  },
  {
    id: 'desarrollo',
    label: 'Desarrollo',
    emoji: '💻',
    x: '83%',
    y: '68%',
    color: '#8B5CF6',
    skills: ['Next.js 14', 'React.js', 'Tailwind CSS', 'JavaScript ES6+', 'CI/CD', 'Vercel', 'SEO Técnico'],
    desc: 'Desarrollo de plataformas web de alto rendimiento con arquitectura moderna.',
  },
  {
    id: 'automatizacion',
    label: 'Automatización',
    emoji: '🤖',
    x: '50%',
    y: '88%',
    color: '#10B981',
    skills: ['Python', 'Power BI', 'Scripts PowerShell', 'Reportes automáticos', 'Dashboards KPI', 'Análisis de datos'],
    desc: 'Reducción de carga operativa mediante automatización e inteligencia de datos.',
  },
]

// SVG lines between nodes
const connections = [
  ['ciberseguridad', 'redes'],
  ['ciberseguridad', 'cloud'],
  ['ciberseguridad', 'ot'],
  ['redes', 'ot'],
  ['cloud', 'desarrollo'],
  ['ot', 'automatizacion'],
  ['desarrollo', 'automatizacion'],
  ['redes', 'cloud'],
]

function nodePos(n: typeof nodes[0]) {
  return {
    cx: parseFloat(n.x),
    cy: parseFloat(n.y),
  }
}

export default function Arquitectura() {
  const [active, setActive] = useState<string | null>(null)

  const activeNode = nodes.find(n => n.id === active)

  return (
    <section
      id="arquitectura"
      style={{ padding: '5rem 2rem', background: 'var(--bg2)' }}
    >
      <div style={{ maxWidth: 1100, margin: 'auto' }}>
        <SectionHeader label="Visión sistémica" title="Arquitectura" highlight="Mental" />

        <FadeIn delay={0.1}>
          <p style={{ color: 'var(--muted)', marginBottom: '3rem', fontSize: '0.95rem', maxWidth: 640 }}>
            Haz clic en cualquier nodo para explorar las competencias de cada dominio.
          </p>
        </FadeIn>

        <FadeIn delay={0.2}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'start' }}>

            {/* Network map */}
            <div
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: 440,
                aspectRatio: '1 / 1',
                background: 'rgba(30,144,255,0.03)',
                border: '1px solid var(--border)',
                borderRadius: 20,
                overflow: 'hidden',
              }}
            >
              {/* SVG connections */}
              <svg
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                {connections.map(([a, b]) => {
                  const na = nodes.find(n => n.id === a)!
                  const nb = nodes.find(n => n.id === b)!
                  const isHot = active === a || active === b
                  return (
                    <line
                      key={`${a}-${b}`}
                      x1={parseFloat(na.x)}
                      y1={parseFloat(na.y)}
                      x2={parseFloat(nb.x)}
                      y2={parseFloat(nb.y)}
                      stroke={isHot ? '#1E90FF' : 'rgba(30,144,255,0.15)'}
                      strokeWidth={isHot ? 0.6 : 0.3}
                      strokeDasharray={isHot ? undefined : '1 2'}
                    />
                  )
                })}
              </svg>

              {/* Nodes */}
              {nodes.map(node => (
                <motion.button
                  key={node.id}
                  onClick={() => setActive(active === node.id ? null : node.id)}
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.95 }}
                  animate={active === node.id ? { scale: 1.18 } : { scale: 1 }}
                  style={{
                    position: 'absolute',
                    left: node.x,
                    top: node.y,
                    transform: 'translate(-50%, -50%)',
                    background: active === node.id
                      ? node.color
                      : `rgba(${parseInt(node.color.slice(1,3),16)}, ${parseInt(node.color.slice(3,5),16)}, ${parseInt(node.color.slice(5,7),16)}, 0.15)`,
                    border: `2px solid ${node.color}`,
                    borderRadius: '50%',
                    width: 52,
                    height: 52,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: active === node.id ? `0 0 20px ${node.color}55` : 'none',
                    transition: 'background 0.3s, box-shadow 0.3s',
                    fontSize: '1.3rem',
                    zIndex: 2,
                    padding: 0,
                  }}
                  title={node.label}
                >
                  {node.emoji}
                </motion.button>
              ))}

              {/* Node labels */}
              {nodes.map(node => (
                <div
                  key={`label-${node.id}`}
                  style={{
                    position: 'absolute',
                    left: node.x,
                    top: `calc(${node.y} + 30px)`,
                    transform: 'translateX(-50%)',
                    fontSize: '0.58rem',
                    fontWeight: 600,
                    color: active === node.id ? node.color : 'var(--muted)',
                    letterSpacing: '0.5px',
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                    pointerEvents: 'none',
                    transition: 'color 0.3s',
                  }}
                >
                  {node.label}
                </div>
              ))}
            </div>

            {/* Detail panel */}
            <AnimatePresence mode="wait">
              {activeNode ? (
                <motion.div
                  key={activeNode.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    background: 'var(--card)',
                    border: `1px solid ${activeNode.color}44`,
                    borderRadius: 16,
                    padding: '2rem',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                    background: `linear-gradient(90deg, ${activeNode.color}, transparent)`,
                  }} />
                  <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{activeNode.emoji}</div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: activeNode.color, marginBottom: '0.5rem' }}>
                    {activeNode.label}
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '1.25rem', lineHeight: 1.7 }}>
                    {activeNode.desc}
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {activeNode.skills.map(s => (
                      <span
                        key={s}
                        style={{
                          background: `rgba(${parseInt(activeNode.color.slice(1,3),16)}, ${parseInt(activeNode.color.slice(3,5),16)}, ${parseInt(activeNode.color.slice(5,7),16)}, 0.12)`,
                          color: activeNode.color,
                          border: `1px solid ${activeNode.color}33`,
                          padding: '0.2rem 0.65rem',
                          borderRadius: 20,
                          fontSize: '0.75rem',
                          fontWeight: 500,
                        }}
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{
                    background: 'rgba(30,144,255,0.03)',
                    border: '1px dashed rgba(30,144,255,0.2)',
                    borderRadius: 16,
                    padding: '2.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.75rem',
                    textAlign: 'center',
                    color: 'var(--muted)',
                    minHeight: 220,
                  }}
                >
                  <span style={{ fontSize: '2rem', opacity: 0.4 }}>🔍</span>
                  <p style={{ fontSize: '0.85rem' }}>
                    Selecciona un nodo del mapa para ver el detalle de competencias
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </FadeIn>
      </div>

      {/* Responsive override */}
      <style>{`
        @media (max-width: 700px) {
          #arquitectura .grid-2col { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  )
}
