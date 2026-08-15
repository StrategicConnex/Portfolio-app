'use client'

import PurdueModel2D from './PurdueModel2D'
import SectionHeader from './ui/SectionHeader'
import FadeIn from './ui/FadeIn'
import Icon from './ui/Icon'
import { useLanguage } from '@/context/LanguageContext'

const domainCards = [
  { color: '#F97316', icon: 'industry', title: 'arch.domain.ot', items: ['Modbus', 'DNP3', 'SCADA', 'Field Devices'] },
  { color: '#8B5CF6', icon: 'network', title: 'arch.domain.infra', items: ['arch.domain.items.virt', 'arch.domain.items.networks', 'arch.domain.items.firewalls'] },
  { color: '#EF4444', icon: 'shield', title: 'arch.domain.security', items: ['SIEM / SOC', 'NIST CSF', 'ISO 27001', 'arch.domain.items.strategy'] },
]

export default function Arquitectura() {
  const { t } = useLanguage()

  return (
    <section id="arquitectura" className="relative z-10 py-20 sm:py-32 px-4 sm:px-6 md:px-8" style={{ background: 'rgba(4,8,15,0.92)' }}>
      <div className="max-w-[1100px] mx-auto">
        <SectionHeader label={t('arch.label')} title={t('arch.title')} highlight={t('arch.highlight')} />

        <FadeIn delay={0.05}>
          <p className="text-sm md:text-[0.92rem] text-white mb-2 max-w-[620px]">
            {t('arch.interactive_desc')}
          </p>
          <p className="text-[0.65rem] md:text-[0.72rem] text-[var(--blue)] tracking-[1.5px] uppercase font-semibold mb-10">
            {t('arch.domain.ot')} · {t('arch.domain.infra')} · {t('arch.domain.security')}
          </p>
          
          {/* SEO Optimized Hidden Text Content */}
          <div className="sr-only">
            <h3>Modelo Purdue para Ciberseguridad Industrial (IT/OT)</h3>
            <p>
              La Arquitectura Purdue (ISA-95) es el estándar fundamental para la segmentación de redes en infraestructuras críticas. 
              Este portfolio presenta una implementación avanzada enfocada en Oil & Gas, cubriendo desde el Nivel 0 (sensores y actuadores Modbus/HART) 
              hasta el Nivel 4/5 (Red Corporativa), pasando por la DMZ Industrial y la protección de sistemas SCADA mediante normativas IEC 62443.
              Expertise en Firewalls industriales, SIEM (Security Onion) y resiliencia operativa en la Cuenca Neuquina (Vaca Muerta).
            </p>
          </div>
        </FadeIn>

        {/* 2D Interactive Purdue Model */}
        <FadeIn delay={0.1}>
          <PurdueModel2D />
        </FadeIn>

        {/* Domain cards below */}
        <FadeIn delay={0.2}>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-3 md:gap-4 mt-10 md:mt-12">
            {domainCards.map((card) => {
              const r = parseInt(card.color.slice(1, 3), 16)
              const g = parseInt(card.color.slice(3, 5), 16)
              const b = parseInt(card.color.slice(5, 7), 16)
              return (
                <article
                  key={card.title}
                  className="relative overflow-hidden cursor-pointer rounded-xl p-6 backdrop-blur"
                  style={{
                    background: `rgba(${r}, ${g}, ${b}, 0.08)`,
                    border: `1.5px solid ${card.color}40`,
                    transition: 'all 0.35s ease',
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
                  <div
                    className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] pointer-events-none"
                    style={{
                      background: `radial-gradient(circle, ${card.color}20 0%, transparent 70%)`,
                      animation: 'float 6s ease-in-out infinite',
                    }}
                  >
                    <style>{`
                      @keyframes float {
                        0%, 100% { transform: translate(0, 0); }
                        50% { transform: translate(10px, 10px); }
                      }
                    `}</style>
                  </div>

                  <div className="relative z-1">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="mb-0.5">
                        <Icon name={card.icon} label={t(card.title)} size={36} />
                      </div>
                      <span className="font-bold uppercase text-sm tracking-wide" style={{ color: card.color, textShadow: `0 0 10px ${card.color}60` }}>
                        {t(card.title)}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {card.items.map(item => (
                        <span key={item} className="text-sm font-medium px-3 py-1.5 rounded-full backdrop-blur cursor-default" style={{
                          background: `rgba(${r}, ${g}, ${b}, 0.15)`,
                          color: card.color,
                          border: `1px solid ${card.color}50`,
                          transition: 'all 0.2s ease',
                          textShadow: `0 0 8px ${card.color}40`,
                        }}>
                          {t(item)}
                        </span>
                      ))}
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
