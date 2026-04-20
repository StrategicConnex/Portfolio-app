'use client'

import React from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import { useLanguage } from '@/context/LanguageContext'
import dynamic from 'next/dynamic'

const ParticleCanvas = dynamic(() => import('./ParticleCanvas'), { ssr: false })
const RadarSweep     = dynamic(() => import('./RadarSweep'),     { ssr: false })

const TEXT_VARIANTS: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.15,
      duration: 0.7,
      ease: 'easeOut',
    },
  }),
}

export default function Hero() {
  const { t } = useLanguage()

  return (
    <section
      id="home"
      className="min-h-screen flex items-center justify-center text-center relative overflow-hidden bg-[var(--bg)] px-4 py-20"
    >
      <ParticleCanvas />

      <div className="hero-radar invisible lg:visible">
        <RadarSweep />
      </div>

      <div
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-[radial-gradient(circle,rgba(30,144,255,0.07)_0%,transparent_70%)] pointer-events-none z-0"
      />

      <div className="hero-content relative z-10 max-w-6xl w-full flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-24 px-4">
        
        <motion.div
          className="hero-avatar relative z-10"
          custom={0} variants={TEXT_VARIANTS} initial="hidden" animate="visible"
        >
          <div className="relative w-[150px] h-[150px] sm:w-[200px] sm:h-[200px] md:w-[240px] md:h-[240px] lg:w-[360px] lg:h-[360px] rounded-3xl overflow-hidden border border-blue-500/20 shadow-[0_0_80px_rgba(30,144,255,0.1)] bg-slate-900 group">
            <Image
              src="/JuanPalacios.jpg"
              alt="Foto de perfil de Juan Palacios"
              fill
              className="object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 scale-105 group-hover:scale-100"
              sizes="(max-width: 640px) 150px, (max-width: 768px) 200px, (max-width: 1024px) 240px, 360px"
              quality={100}
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent opacity-60" />
            <div className="absolute top-3 right-3 w-6 h-6 border-t border-r border-blue-500/40 rounded-tr-md sm:top-4 sm:right-4 sm:w-8 sm:h-8 sm:border-t-2 sm:border-r-2" />
            <div className="absolute bottom-3 left-3 w-6 h-6 border-b border-l border-blue-500/40 rounded-bl-md sm:bottom-4 sm:left-4 sm:w-8 sm:h-8 sm:border-b-2 sm:border-l-2" />
            
            <div className="absolute bottom-3 right-3 flex items-center gap-1.5 px-2.5 py-0.5 bg-black/60 backdrop-blur-md rounded-full border border-white/10 sm:bottom-4 sm:right-4 sm:gap-2 sm:px-3 sm:py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_#22c55e]" />
              <span className="text-[8px] text-white/70 uppercase tracking-tighter sm:text-[9px]">{t('hero.system_active')}</span>
            </div>
          </div>
        </motion.div>

        <div className="hero-copy text-center lg:text-left flex-1 space-y-4 sm:space-y-6">
          
          <motion.div
            custom={1} variants={TEXT_VARIANTS} initial="hidden" animate="visible"
          >
            <span className="inline-flex items-center gap-2 border border-blue-500/30 bg-blue-500/5 text-blue-400 text-[9px] sm:text-[10px] tracking-[2px] sm:tracking-[4px] py-1 px-3 sm:py-1.5 sm:px-4 rounded-full uppercase font-bold">
              {t('hero.protocol')}
            </span>
          </motion.div>

          <motion.h1
            custom={1} variants={TEXT_VARIANTS} initial="hidden" animate="visible"
            className="text-[clamp(1.3rem,7vw,2.5rem)] lg:text-[clamp(2.2rem,5vw,3.8rem)] font-extrabold leading-[1.1] tracking-tighter text-white"
          >
            {t('hero.title.first')}{' '}
            <span className="text-blue-500">
              {t('hero.title.last')}
            </span>
            <span className="block text-[0.32em] sm:text-[0.38em] mt-3 sm:mt-4 text-[var(--gold)] font-medium tracking-[0.1em] sm:tracking-[0.14em] uppercase opacity-90 leading-relaxed max-w-[280px] sm:max-w-xl mx-auto lg:mx-0">
              {t('hero.subtitle').split(' | ').map((s, i) => (
                <React.Fragment key={i}>
                  {s} {i < t('hero.subtitle').split(' | ').length - 1 && <span className="mx-2 opacity-50">|</span>}
                  {i === 0 && <br className="hidden sm:block" />}
                </React.Fragment>
              ))}
            </span>
          </motion.h1>

          <motion.div
            custom={3} variants={TEXT_VARIANTS} initial="hidden" animate="visible"
            className="flex flex-col gap-2 sm:gap-3"
          >
            <p className="text-[14px] sm:text-[clamp(0.9rem,1.8vw,1.05rem)] text-slate-200 font-bold tracking-widest uppercase italic">
              {t('hero.role')}
            </p>
            <div className="flex justify-center lg:justify-start">
              <p className="text-[9px] sm:text-[11px] text-slate-500 font-medium max-w-2xl opacity-80 border-l-2 border-blue-600/40 pl-3 sm:pl-4 py-0.5 sm:py-1 text-left">
                {t('hero.role_details')} | <span className="text-blue-500/70">#CulturaSegura</span>
              </p>
            </div>
          </motion.div>

          <motion.p
            custom={4} variants={TEXT_VARIANTS} initial="hidden" animate="visible"
            className="text-slate-400 text-[11px] sm:text-[13px] max-w-md mx-auto lg:mx-0 mb-6 sm:mb-8 leading-relaxed font-light opacity-80"
          >
            {t('hero.tagline')}
          </motion.p>

          <motion.div
            custom={5} variants={TEXT_VARIANTS} initial="hidden" animate="visible"
            className="flex flex-wrap gap-3 sm:gap-4 justify-center lg:justify-start pt-2 sm:pt-4"
          >
            <motion.a
              href="#experiencia"
              whileHover={{ x: 5, backgroundColor: '#3b82f6' }}
              whileTap={{ scale: 0.98 }}
              className="px-6 py-3 sm:px-8 sm:py-3.5 rounded-xl bg-blue-600 text-white font-bold text-[9px] sm:text-[10px] uppercase tracking-[2px] transition-all shadow-lg shadow-blue-900/20"
            >
              {t('hero.cta.history')}
            </motion.a>

            <motion.a
              href="#arquitectura"
              whileHover={{ x: 5, borderColor: 'rgba(255,255,255,0.3)' }}
              whileTap={{ scale: 0.98 }}
              className="px-6 py-3 sm:px-8 sm:py-3.5 rounded-xl bg-transparent text-white/80 font-bold text-[9px] sm:text-[10px] uppercase tracking-[2px] border border-white/10 hover:bg-white/5 transition-all"
            >
              {t('hero.cta.architecture')}
            </motion.a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.8, duration: 1 }}
            className="pt-10 flex flex-col items-center gap-1.5 lg:items-start"
          >
            <span className="text-[0.7rem] text-slate-500 uppercase tracking-[2px]">{t('hero.scroll')}</span>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
              className="w-[1.5px] h-7 bg-gradient-to-b from-blue-500 to-transparent rounded"
            />
          </motion.div>
        </div>
      </div>
    </section>
  )
}