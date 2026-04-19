'use client'

import PurdueModel2D from './PurdueModel2D'
import SectionHeader from './ui/SectionHeader'
import FadeIn from './ui/FadeIn'
import Icon from './ui/Icon'

const domainCards = [
  { color: '#F97316', icon: 'industry', title: 'Capa Inferior OT', items: ['Modbus', 'DNP3', 'SCADA', 'Field Devices'] },
  { color: '#8B5CF6', icon: 'network', title: 'Capa Media Infraestructura', items: ['Virtualización', 'Redes Cisco', 'Firewalls Industriales'] },
  { color: '#EF4444', icon: 'shield', title: 'Capa Superior Seguridad', items: ['SIEM / SOC', 'NIST CSF', 'ISO 27001', 'Estrategia GRC'] },
]

export default function Arquitectura() {
  return (
    <section id="arquitectura" style={{ padding: 'clamp(2rem, 5vw, 5rem) clamp(1rem, 5vw, 2rem)', background: 'var(--bg2)' }}>
      <div style={{ maxWidth: 1100, margin: 'auto' }}>
        <SectionHeader label="Visión sistémica" title="Mapa de Convergencia IT/OT" highlight="Modelo Purdue" />

        <FadeIn delay={0.05}>
          <p style={{ color: 'var(--muted)', marginBottom: '0.5rem', fontSize: 'clamp(0.85rem, 2vw, 0.92rem)', maxWidth: 620 }}>
            Mapa interactivo de convergencia IT/OT inspirado en el Modelo Purdue. Haz clic en un nodo para resaltar dependencias entre SCADA, firewalls industriales, virtualización y controles de seguridad.
          </p>
          <p style={{ color: 'var(--blue)', fontSize: 'clamp(0.65rem, 1.5vw, 0.72rem)', letterSpacing: '1.5px', textTransform: 'uppercase', fontWeight: 600, marginBottom: '2.5rem' }}>
            Capa Inferior OT · Capa Media Infraestructura · Capa Superior Seguridad
          </p>
        </FadeIn>

        {/* 2D Interactive Purdue Model */}
        <FadeIn delay={0.1}>
          <PurdueModel2D />
        </FadeIn>

        {/* Domain cards below */}
        <FadeIn delay={0.2}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(240px, 100%, 280px), 1fr))',
            gap: 'clamp(0.75rem, 2vw, 1rem)',
            marginTop: 'clamp(2rem, 5vw, 3rem)',
          }}>
            {domainCards.map((card) => (
              <div
                key={card.title}
                style={{
                  background: `rgba(${parseInt(card.color.slice(1,3),16)}, ${parseInt(card.color.slice(3,5),16)}, ${parseInt(card.color.slice(5,7),16)}, 0.08)`,
                  border: `1.5px solid ${card.color}40`,
                  borderRadius: 12,
                  padding: '1.5rem',
                  transition: 'all 0.35s ease',
                  backdropFilter: 'blur(10px)',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = card.color + 'cc'
                  e.currentTarget.style.boxShadow = `0 0 30px ${card.color}60, inset 0 0 20px ${card.color}15`
                  e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = card.color + '40'
                  e.currentTarget.style.boxShadow = 'none'
                  e.currentTarget.style.transform = 'translateY(0) scale(1)'
                }}
              >
                {/* Glow background */}
                <div style={{
                  position: 'absolute',
                  top: '-50%',
                  left: '-50%',
                  width: '200%',
                  height: '200%',
                  background: `radial-gradient(circle, ${card.color}20 0%, transparent 70%)`,
                  animation: 'float 6s ease-in-out infinite',
                  pointerEvents: 'none',
                }}>
                  <style>{`
                    @keyframes float {
                      0%, 100% { transform: translate(0, 0); }
                      50% { transform: translate(10px, 10px); }
                    }
                  `}</style>
                </div>

                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                    <div style={{
                      marginBottom: '0.15rem',
                    }}>
                      <Icon name={card.icon} label={card.title} size={36} />
                    </div>
                    <span style={{
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      color: card.color,
                      textTransform: 'uppercase',
                      letterSpacing: '0.8px',
                      textShadow: `0 0 10px ${card.color}60`,
                    }}>
                      {card.title}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {card.items.map(item => (
                      <span key={item} style={{
                        background: `rgba(${parseInt(card.color.slice(1,3),16)}, ${parseInt(card.color.slice(3,5),16)}, ${parseInt(card.color.slice(5,7),16)}, 0.15)`,
                        color: card.color,
                        border: `1px solid ${card.color}50`,
                        padding: '0.4rem 0.8rem',
                        borderRadius: 20,
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        transition: 'all 0.2s ease',
                        backdropFilter: 'blur(4px)',
                        textShadow: `0 0 8px ${card.color}40`,
                        cursor: 'default',
                      }}>
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
