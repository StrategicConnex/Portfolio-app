'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import Image from 'next/image'
import SectionHeader from './ui/SectionHeader'
import Icon from './ui/Icon'
import StaggerReveal from './ui/StaggerReveal'
import { useLanguage } from '@/context/LanguageContext'

const categories = [
  {
    icon: 'shield',
    cat: 'stack.cat.security',
    title: 'stack.title.security',
    color: '#4DA3FF',
    tags: ['stack.tag.siem', 'stack.tag.firewalls', 'stack.tag.iam', 'stack.tag.iec', 'stack.tag.nist', 'stack.tag.iso', 'stack.tag.sox', 'stack.tag.purdue', 'stack.tag.ir'],
    img: '/stack_seguridad.webp',
  },
  {
    icon: 'network',
    cat: 'stack.cat.network',
    title: 'stack.title.network',
    color: '#3B82F6',
    tags: ['stack.tag.networks', 'stack.tag.mpls', 'stack.tag.mikrotik', 'stack.tag.vsat', 'stack.tag.wan', 'stack.tag.vpn', 'stack.tag.fiber', 'stack.tag.dns'],
    img: '/stack_redes.webp',
  },
  {
    icon: 'cloud',
    cat: 'stack.cat.cloud',
    title: 'stack.title.cloud',
    color: '#06B6D4',
    tags: ['stack.tag.azure', 'stack.tag.aws', 'stack.tag.vmware', 'stack.tag.esxi', 'stack.tag.vcenter', 'stack.tag.windows', 'stack.tag.ad', 'stack.tag.linux'],
    img: '/stack_cloud.webp',
  },
  {
    icon: 'automation',
    cat: 'stack.cat.ot',
    title: 'stack.title.ot',
    color: '#E8D5AC',
    tags: ['stack.tag.scada', 'stack.tag.modbus', 'stack.tag.opc', 'stack.tag.dnp3', 'stack.tag.edge', 'stack.tag.veeam', 'stack.tag.industrial_control'],
    img: '/stack_ot.webp',
  },
  {
    icon: 'web',
    cat: 'stack.cat.dev',
    title: 'stack.title.dev',
    color: '#8B5CF6',
    tags: ['stack.tag.nextjs', 'stack.tag.react', 'stack.tag.tailwind', 'stack.tag.js', 'stack.tag.ts', 'stack.tag.cicd', 'stack.tag.vercel', 'stack.tag.seo'],
    img: '/stack_web.webp',
  },
  {
    icon: 'ai',
    cat: 'stack.cat.ai',
    title: 'stack.title.ai',
    color: '#10B981',
    tags: ['stack.tag.python', 'stack.tag.powerbi', 'stack.tag.powershell', 'stack.tag.kpi', 'stack.tag.data_analysis', 'stack.tag.reports'],
    img: '/stack_data.webp',
  },
]

function StackCard({ item, index }: { item: typeof categories[0]; index: number }) {
  const { t } = useLanguage()
  const ref    = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={inView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.6, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -5, borderColor: item.color + '88' }}
      className="relative overflow-hidden cursor-default flex flex-col justify-end p-7 rounded-2xl min-h-[220px]"
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        transition: 'border-color 0.3s, transform 0.3s',
      }}
    >
      {/* Background and Overlay */}
      <div className="absolute inset-0 z-0">
        <Image 
          src={item.img} 
          alt={t(item.title)}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover opacity-15 grayscale-[50%] brightness-[0.6]"
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,1) 30%, transparent 100%)' }} />
      </div>

      <div className="relative z-1">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-1.5 rounded-lg flex" style={{ background: `${item.color}15`, border: `1px solid ${item.color}33` }}>
            <Icon name={item.icon} label={t(item.cat)} size={20} />
          </div>
          <div className="text-[0.65rem] uppercase font-bold tracking-wider" style={{ color: item.color }}>
            {t(item.cat)}
          </div>
        </div>
        
        <div className="text-lg font-bold text-white mb-3">
          {t(item.title)}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {item.tags.map(tagKey => (
            <span key={tagKey} className="text-xs font-medium px-2 py-0.5 rounded-full bg-white/5 text-white/70 border border-white/10">
              {t(tagKey)}
            </span>
          ))}
        </div>
      </div>
      
      {/* Top accent */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={inView ? { scaleX: 1 } : {}}
        transition={{ delay: index * 0.05 + 0.3, duration: 0.5 }}
        className="absolute top-0 left-0 right-0 h-[2px] opacity-70 origin-left"
        style={{ background: `linear-gradient(90deg, ${item.color}, transparent)` }}
      />
    </motion.div>
  )
}

export default function Stack() {
  const { t } = useLanguage()

  return (
    <section id="stack" className="relative z-10 py-20 sm:py-32 px-4 sm:px-6 md:px-8" style={{ background: 'rgba(4,8,15,0.85)' }}>
      <div className="max-w-[1100px] mx-auto">
        <SectionHeader label={t('stack.label')} title={t('stack.title')} highlight={t('stack.highlight')} />

        <StaggerReveal stagger={0.08} direction="scale">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-3 md:gap-5">
            {categories.map((item, i) => (
              <StackCard key={item.cat} item={item} index={i} />
            ))}
          </div>
        </StaggerReveal>
      </div>
    </section>
  )
}
