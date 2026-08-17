'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import Image from 'next/image'
import SectionHeader from './ui/SectionHeader'
import FadeIn from './ui/FadeIn'
import Icon from './ui/Icon'
import { useLanguage } from '@/context/LanguageContext'

const metrics = [
  { num: '99.9%', labelKey: 'profile.metric.availability', color: 'var(--blue)', icon: 'shield', img: '/perfil_infraestructura.webp' },
  { num: '−30%',  labelKey: 'profile.metric.incidents', color: '#10B981', icon: 'analytics', img: '/perfil_seguridad.webp' },
  { num: '−10h',  labelKey: 'profile.metric.automation', color: 'var(--gold)', icon: 'automation', img: '/perfil_automatizacion.webp' },
  { num: '+25%',  labelKey: 'profile.metric.virtualization', color: '#8B5CF6', icon: 'rocket', img: '/perfil_nube.webp' },
]

const competencias = [
  {
    grupoKey: 'profile.comp.cyber',
    color: '#1E90FF',
    items: ['Modelo Purdue', 'IEC 62443', 'NIST CSF', 'ISO 27001', 'SOX', 'SIEM – Security Onion', 'IAM', 'profile.item.industrial_firewalls'],
    img: '/comp_cyber.webp'
  },
  {
    grupoKey: 'profile.comp.network',
    color: '#3B82F6',
    items: ['Cisco CCNA', 'MPLS', 'MikroTik', 'VSAT', 'Riverbed WAN', 'VPN', 'profile.item.fiber_optics', 'DNS / DHCP'],
    img: '/comp_redes.webp'
  },
  {
    grupoKey: 'profile.comp.cloud',
    color: '#06B6D4',
    items: ['Microsoft Azure', 'AWS', 'VMware vSphere', 'ESXi', 'vCenter', 'Nexus 1000v', 'Windows Server 2003–2022', 'Active Directory', 'Exchange', 'SQL Server', 'Linux'],
    img: '/comp_cloud.webp'
  },
  {
    grupoKey: 'profile.comp.ot',
    color: '#C5A46D',
    items: ['SCADA', 'Modbus', 'OPC UA', 'DNP3', 'Edge Computing', 'Veeam Backup', 'Backup Exec', 'profile.item.industrial_control'],
    img: '/comp_ot.webp'
  },
  {
    grupoKey: 'profile.comp.dev',
    color: '#8B5CF6',
    items: ['Next.js 14', 'React.js', 'Tailwind CSS', 'JavaScript ES6+', 'TypeScript', 'Python', 'Power BI', 'CI/CD', 'Vercel'],
    img: '/comp_web.webp'
  },
  {
    grupoKey: 'profile.comp.grc',
    color: '#10B981',
    items: ['PMI / Project Management', 'GRC', 'Risk Analysis', 'Incident Response', 'Stakeholder Management', 'SDLC'],
    img: '/comp_grc.webp'
  },
]

function MetricCard({ num, labelKey, color, icon, img, delay }: { num: string; labelKey: string; color: string; icon: string; img: string; delay: number }) {
  const { t } = useLanguage()
  const ref    = useRef(null)
  const inView = useInView(ref, { once: true })
  const label = t(labelKey)

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={inView ? { opacity: 1, scale: 1 } : {}}
      transition={{ delay, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -5, scale: 1.02 }}
      className="relative overflow-hidden flex flex-col justify-end p-6 rounded-2xl h-[240px] cursor-default"
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
      }}
    >
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image 
          src={img} 
          alt={label} 
          fill 
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover opacity-40 grayscale-[40%] brightness-[0.7]"
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.9) 20%, rgba(0,0,0,0.2) 100%)' }} />
      </div>

      <div className="relative z-1">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}22`, border: `1px solid ${color}44` }}>
            <Icon name={icon} label={label} size={18} />
          </div>
          <div className="text-[1.8rem] font-black text-white tracking-tight">{num}</div>
        </div>
        <div className="text-sm text-white/70 leading-tight font-medium">{label}</div>
      </div>
      
      {/* Accent bar */}
      <div className="absolute top-0 left-0 right-0 h-[3px] opacity-60" style={{ background: color }} />
    </motion.div>
  )
}

export default function Perfil() {
  const { t, language } = useLanguage()

  return (
    <section id="perfil" className="py-20 sm:py-32 px-4 sm:px-6 md:px-8" style={{ background: 'var(--bg)' }}>
      <div className="max-w-[1100px] mx-auto">
        <SectionHeader label={t('profile.label')} title={t('profile.title')} highlight={t('profile.highlight')} />

        <FadeIn delay={0.1}>
          <div className="flex flex-col md:flex-row items-start gap-8 md:gap-12 mb-12">
            {/* Profile image — left */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.7, ease: 'easeOut' }}
              className="relative w-[160px] h-[160px] sm:w-[200px] sm:h-[200px] md:w-[240px] md:h-[240px] flex-shrink-0 mx-auto md:mx-0"
            >
              <div className="relative w-full h-full rounded-2xl overflow-hidden border border-blue-500/20 shadow-[0_0_60px_rgba(30,144,255,0.08)] bg-slate-900 group">
                <Image
                  src="/JuanPalacios.webp"
                  alt={t('profile.photo_alt')}
                  fill
                  className="object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 scale-105 group-hover:scale-100"
                  sizes="(max-width: 640px) 160px, (max-width: 768px) 200px, 240px"
                  quality={75}
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent opacity-60" />
                {/* Corner accents */}
                <div className="absolute top-2 right-2 w-5 h-5 border-t border-r border-blue-500/40 rounded-tr-md" />
                <div className="absolute bottom-2 left-2 w-5 h-5 border-b border-l border-blue-500/40 rounded-bl-md" />
                {/* Status indicator */}
                <div className="absolute bottom-2 right-2 flex items-center gap-1.5 px-2 py-0.5 bg-black/60 backdrop-blur-md rounded-full border border-white/10">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_#22c55e]" />
                  <span className="text-[7px] text-white/70 uppercase tracking-tighter">{language === 'en' ? 'System Active' : 'Sistema Activo'}</span>
                </div>
              </div>
            </motion.div>

            {/* Bio text — right */}
            <div className="flex-1 min-w-0">
              <p className="text-sm md:text-[0.97rem] text-white mb-5 leading-relaxed">
                {t('profile.description1')}
              </p>
              <p className="text-sm md:text-[0.97rem] text-white mb-5 leading-relaxed">
                {t('profile.description2')}
              </p>
            </div>
          </div>
        </FadeIn>

        {/* Metrics */}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3 md:gap-5 mb-10 md:mb-14">
          {metrics.map((m, i) => <MetricCard key={m.labelKey} {...m} delay={i * 0.1 + 0.2} />)}
        </div>

        {/* Competencias grouped */}
        <FadeIn delay={0.3}>
          <div className="mt-12 mb-4">
            <p className="text-[0.65rem] md:text-[0.72rem] text-[var(--blue)] tracking-[3px] uppercase mb-3 md:mb-5">
              {t('profile.skills_header')}
            </p>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-3 md:gap-5">
              {competencias.map((c, i) => (
                <motion.div
                  key={c.grupoKey}
                  whileHover={{ y: -4, borderColor: c.color + '88' }}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05, duration: 0.5 }}
                  className="relative overflow-hidden min-h-[160px] flex flex-col justify-start rounded-xl p-3 md:p-5"
                  style={{
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    transition: 'border-color 0.3s, transform 0.3s',
                  }}
                >
                  {/* Background Image */}
                  <div className="absolute inset-0 z-0">
                    <Image 
                      src={c.img} 
                      alt={t(c.grupoKey)} 
                      fill 
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover opacity-12 grayscale-[60%] brightness-[0.5]"
                    />
                    <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, rgba(0,0,0,0.95) 40%, rgba(0,0,0,0.6) 100%)` }} />
                  </div>

                  <div className="relative z-1">
                    <div className="text-sm font-bold tracking-wide uppercase mb-3" style={{ color: c.color }}>
                      {t(c.grupoKey)}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {c.items.map(item => (
                        <span key={item} className="text-xs font-medium px-2 py-1 rounded-full bg-white/5 text-white/90 border border-white/10">
                          {t(item)}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  {/* Left accent bar */}
                  <div className="absolute left-0 top-[15%] bottom-[15%] w-[2px] opacity-50" style={{ background: c.color }} />
                </motion.div>
              ))}
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
