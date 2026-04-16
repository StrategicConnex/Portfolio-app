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
  { color: '#8B5CF6', emoji: '💻', title: 'Desarrollo Web', items: ['React', 'Next.js', 'Tailwind', 'UI Premium'] },
  { color: '#1E90FF', emoji: '🤖', title: 'IA Aplicada', items: ['Chatbots', 'Automatización', 'Documentos inteligentes', 'Marketing IA'] },
  { color: '#10B981', emoji: '📊', title: 'Ingeniería Comercial', items: ['Licitaciones', 'Presentaciones', 'Propuestas'] },
  { color: '#F97316', emoji: '🎨', title: 'Diseño Estratégico', items: ['Branding', 'UX/UI', 'Conversiones'] },
  { color: '#06B6D4', emoji: '🏭', title: 'Industrias', items: ['Oil & Gas', 'Construcción', 'Energía'] },
  { color: '#EF4444', emoji: '📈', title: 'Resultados', items: ['Más ventas', 'Mejor imagen', 'Menos tiempo', 'Escalabilidad'] },
]

export default function Arquitectura() {
  return (
    <section id="arquitectura" style={{ padding: '5rem 2rem', background: 'var(--bg2)' }}>
      <div style={{ maxWidth: 1100, margin: 'auto' }}>
        <SectionHeader label="Visión sistémica" title="Mapa Mental" highlight="Futurista 3D" />

        <FadeIn delay={0.05}>
          <p style={{ color: 'var(--muted)', marginBottom: '0.5rem', fontSize: '0.92rem', maxWidth: 580 }}>
            Mapa interactivo futurista con nodos de partículas y flujos neon. Arrastrá para rotar · Scroll para zoom · Hover para ver detalles.
          </p>
          <p style={{ color: 'var(--blue)', fontSize: '0.72rem', letterSpacing: '1.5px', textTransform: 'uppercase', fontWeight: 600, marginBottom: '2rem' }}>
            Partículas dinámicas + Flujos neon azul + Efectos pulsantes
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
            gap: '1rem',
            marginTop: '3rem',
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
                      fontSize: '2rem',
                      filter: `drop-shadow(0 0 8px ${card.color})`,
                    }}>
                      {card.emoji}
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
