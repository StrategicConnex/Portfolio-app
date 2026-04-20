'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useMemo } from 'react'
import Image from 'next/image'
import { useLanguage } from '@/context/LanguageContext'

export default function PurdueModel2D() {
  const { t } = useLanguage()
  const [activeNode, setActiveNode] = useState<string | null>(null)

  const levels = useMemo(() => [
    {
      id: 'security',
      title: 'arch.purdue.level.security',
      color: '#EF4444',
      bg: '/purdue_security.png',
      nodes: [
        { 
          id: 'siem', 
          label: 'arch.purdue.nodes.siem.label', 
          description: 'arch.purdue.nodes.siem.desc', 
          components: ['Security Onion', 'Wazuh', 'Dashboards en Tiempo Real'],
          connectsTo: ['firewall', 'virtual'] 
        },
        { 
          id: 'nist', 
          label: 'arch.purdue.nodes.nist.label', 
          description: 'arch.purdue.nodes.nist.desc', 
          components: ['ID.AM', 'PR.AC', 'DE.AE', 'RS.RP'],
          connectsTo: ['siem', 'grc'] 
        },
        { 
          id: 'grc', 
          label: 'arch.purdue.nodes.grc.label', 
          description: 'arch.purdue.nodes.grc.desc', 
          components: ['ISO 27001', 'IEC 62443', 'Compliance Audits'],
          connectsTo: ['nist'] 
        }
      ]
    },
    {
      id: 'infra',
      title: 'arch.purdue.level.infra',
      color: '#8B5CF6',
      bg: '/stack_cloud.png',
      nodes: [
        { 
          id: 'virtual', 
          label: 'arch.purdue.nodes.virtual.label', 
          description: 'arch.purdue.nodes.virtual.desc', 
          components: ['ESXi Hosts', 'vCenter', 'SAN Storage', 'Veeam Backup'],
          connectsTo: ['scada', 'idmz'] 
        },
        { 
          id: 'firewall', 
          label: 'arch.purdue.nodes.firewall.label', 
          description: 'arch.purdue.nodes.firewall.desc', 
          components: ['Cisco ASA/FTD', 'FortiGate', 'PFSense', 'VPN IPsec'],
          connectsTo: ['idmz', 'plc'] 
        },
        { 
          id: 'idmz', 
          label: 'arch.purdue.nodes.idmz.label', 
          description: 'arch.purdue.nodes.idmz.desc', 
          components: ['Proxy Inverso', 'Historian Front-end', 'Patch Management'],
          connectsTo: ['siem', 'firewall'] 
        }
      ]
    },
    {
      id: 'ot',
      title: 'arch.purdue.level.ot',
      color: '#F97316',
      bg: '/stack_ot.png',
      nodes: [
        { 
          id: 'scada', 
          label: 'arch.purdue.nodes.scada.label', 
          description: 'arch.purdue.nodes.scada.desc', 
          components: ['Aveva / Wonderware', 'Ignition', 'WinCC'],
          connectsTo: ['plc'] 
        },
        { 
          id: 'plc', 
          label: 'arch.purdue.nodes.plc.label', 
          description: 'arch.purdue.nodes.plc.desc', 
          components: ['Schneider Electric', 'Rockwell Automation', 'Siemens S7'],
          connectsTo: ['scada'] 
        },
        { 
          id: 'purdue', 
          label: 'arch.purdue.nodes.plant.label', 
          description: 'arch.purdue.nodes.plant.desc', 
          components: ['Sensores HART', 'Modbus TCP/RTU', 'DNP3'],
          connectsTo: ['plc'] 
        }
      ]
    }
  ], [])
  
  const selectedNodeData = useMemo(() => {
    for (const level of levels) {
      const node = level.nodes.find(n => n.id === activeNode)
      if (node) return { ...node, color: level.color }
    }
    return null
  }, [activeNode, levels])

  const dependencies = selectedNodeData?.connectsTo || []

  return (
    <div 
      className="scanline-container"
      style={{
        width: '100%',
        minHeight: 600,
        background: 'rgba(0,0,0,0.4)',
        border: '1px solid var(--border)',
        borderRadius: 24,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        backdropFilter: 'blur(10px)',
      }}
    >
      {levels.map((level, lIndex) => (
        <div key={level.id} style={{ 
          position: 'relative', 
          overflow: 'hidden',
          minHeight: '200px',
          padding: '2rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          borderBottom: lIndex < 2 ? '1px solid rgba(255,255,255,0.05)' : 'none'
        }}>
          {/* Background Image with Overlay */}
          <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
            <Image 
              src={level.bg} 
              alt={t(level.title)} 
              fill 
              style={{ objectFit: 'cover', opacity: 0.15, filter: 'grayscale(0.5) brightness(0.4)' }} 
            />
            <div style={{ 
              position: 'absolute', 
              inset: 0, 
              background: `linear-gradient(to right, rgba(0,0,0,0.95) 30%, rgba(0,0,0,0.4) 100%)` 
            }} />
          </div>

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '1rem', 
              marginBottom: '1.5rem'
            }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: level.color, boxShadow: `0 0 10px ${level.color}` }} />
              <h4 style={{ 
                fontSize: '0.75rem', 
                textTransform: 'uppercase', 
                letterSpacing: '3px', 
                color: level.color,
                fontWeight: 800 
              }}>
                {t(level.title)}
              </h4>
              <div style={{ flex: 1, height: 1, background: `linear-gradient(to right, ${level.color}44, transparent)` }} />
            </div>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
              gap: '1.25rem' 
            }}>
              {level.nodes.map((node) => {
                const isActive = activeNode === node.id
                const isDependency = dependencies.includes(node.id)
                
                return (
                  <div key={node.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <motion.div
                      onClick={() => setActiveNode(activeNode === node.id ? null : node.id)}
                      whileHover={{ y: -3, borderColor: level.color + '88' }}
                      animate={{
                        borderColor: isActive ? level.color : isDependency ? `${level.color}88` : 'rgba(255,255,255,0.1)',
                        background: isActive ? `${level.color}15` : isDependency ? `${level.color}08` : 'rgba(255,255,255,0.03)',
                      }}
                      style={{
                        padding: '1.2rem',
                        borderRadius: 16,
                        border: '1px solid rgba(255,255,255,0.1)',
                        cursor: 'pointer',
                        transition: 'border-color 0.3s, background 0.3s',
                        position: 'relative'
                      }}
                    >
                      <div style={{ 
                        fontSize: '0.95rem', 
                        fontWeight: 700, 
                        color: isActive ? '#fff' : isDependency ? level.color : 'rgba(255,255,255,0.9)',
                      }}>
                        {t(node.label)}
                      </div>
                      
                      {/* Sub-components expansion */}
                      <AnimatePresence>
                        {isActive && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            style={{ overflow: 'hidden' }}
                          >
                            <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', margin: '0.75rem 0', lineHeight: 1.4 }}>
                              {t(node.description)}
                            </p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem' }}>
                              {node.components.map(comp => (
                                <span key={comp} style={{
                                  fontSize: '0.65rem',
                                  background: `${level.color}22`,
                                  color: level.color,
                                  border: `1px solid ${level.color}44`,
                                  padding: '0.2rem 0.6rem',
                                  borderRadius: 6,
                                  fontWeight: 600,
                                  letterSpacing: '0.5px'
                                }}>
                                  {comp}
                                </span>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {isActive && (
                        <motion.div
                          layoutId="pulse"
                          style={{
                            position: 'absolute',
                            top: 12,
                            right: 12,
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            background: level.color,
                            boxShadow: `0 0 10px ${level.color}`
                          }}
                          animate={{ opacity: [1, 0.4, 1] }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                        />
                      )}
                    </motion.div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
