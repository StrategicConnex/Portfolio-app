'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
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
  return (
    <section
      id="hero"
      className="min-h-screen flex items-center justify-center text-center relative overflow-hidden bg-[var(--bg)] px-4 py-16"
    >
      {/* Three.js background */}
      <ParticleCanvas />

      {/* Purdue radar — visible md+ */}
      <div className="hero-radar invisible lg:visible">
        <RadarSweep />
      </div>

      {/* Subtle radial glow behind text */}
      <div
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-[radial-gradient(circle,rgba(30,144,255,0.07)_0%,transparent_70%)] pointer-events-none z-0"
      />

      {/* Content Container */}
      <div className="hero-content relative z-10 max-w-[1100px] w-full">
        
        {/* Avatar Section */}
        <motion.div
          className="hero-avatar flex justify-center mb-8"
          custom={0} variants={TEXT_VARIANTS} initial="hidden" animate="visible"
        >
          <div className="relative w-[132px] h-[132px] rounded-full overflow-hidden border-3 border-blue-500/20 shadow-2xl shadow-black/15">
            <Image
              src="/JuanPalacios.jpg"
              alt="Foto de perfil de Juan Palacios"
              fill
              className="object-cover"
              sizes="132px"
              quality={85}
              priority
              placeholder="blur"
              blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg=="
            />
          </div>
        </motion.div>

        {/* Textual Content */}
        <div className="hero-copy lg:text-left">
          
          {/* Badge */}
          <motion.div
            custom={1} variants={TEXT_VARIANTS} initial="hidden" animate="visible"
            className="mb-6"
          >
            <span className="inline-block border border-[var(--gold)] text-[var(--gold)] text-[0.72rem] tracking-[3px] py-1 px-4 rounded-full uppercase font-medium">
              IT/OT · Ciberseguridad · Infraestructura
            </span>
          </motion.div>

          {/* Main Title / H1 */}
          <motion.h1
            custom={2} variants={TEXT_VARIANTS} initial="hidden" animate="visible"
            className="text-[clamp(1.8rem,5vw,3.2rem)] font-extrabold leading-tight mb-2 tracking-tighter text-[var(--text)]"
          >
            Juan Felipe{' '}
            <span className="bg-gradient-to-r from-blue-500 to-[var(--gold)] bg-clip-text text-transparent">
              Palacios
            </span>
            <span className="block text-[0.6em] mt-2 text-[var(--gold)] font-medium tracking-wide uppercase opacity-90">
              Ciberseguridad para Oil & Gas en Vaca Muerta · Consultoría IT/OT Neuquén
            </span>
          </motion.h1>

          {/* Role Description */}
          <motion.p
            custom={3} variants={TEXT_VARIANTS} initial="hidden" animate="visible"
            className="text-[clamp(0.9rem,1.8vw,1.15rem)] text-[var(--blue)] font-medium mb-4 tracking-wide"
          >
            IT/OT Cybersecurity Architect
            <span className="block text-xs md:text-sm text-slate-400 mt-2 font-normal max-w-2xl opacity-80">
              Project Manager IT | Cybersecurity Leader | SysAdmin | Divulgador de #CulturaSegura
            </span>
          </motion.p>

          {/* Tagline */}
          <motion.p
            custom={4} variants={TEXT_VARIALNTS} initial="hidden" animate="visible"
            className="text-slate-400 text-sm md:text-base max-w-xl mx-auto lg:mx-0 mb-10 leading-relaxed font-light"
          >
            Transformando infraestructura crítica en sistemas resilientes e inteligentes para el sector industrial y Oil & Gas.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            custom={5} variants={TEXT_VARIANTS} initial="hidden" animate="visible"
            className="flex flex-wrap gap-4 justify-center lg:justify-start"
          >
            <motion.a
              href="#experiencia"
              whileHover={{ scale: 1.04, boxShadow: '0 0 24px rgba(30,144,255,0.4)' }}
              whileTap={{ scale: 0.97 }}
              className="px-8 py-3 rounded-lg bg-[var(--blue)] text-white font-semibold text-sm border-2 border-[var(--blue)] transition-all"
            >
              Ver experiencia
            </motion.a>

            <motion.a
              href="#arquitectura"
              whileHover={{ scale: 1.04, boxShadow: '0 0 24px rgba(197,164,109,0.3)' }}
              whileTap={{ scale: 0.97 }}
              className="px-8 py-3 rounded-lg bg-transparent text-[var(--gold)] font-semibold text-sm border-2 border-[var(--gold)] transition-all"
            >
              Explorar arquitectura
            </motion.a>
          </motion.div>

          {/* Scroll Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.8, duration: 1 }}
            className="mt-14 flex flex-col items-center gap-1.5 lg:items-start"
          >
            <span className="text-[0.7rem] text-slate-500 uppercase tracking-[2px]">Scroll</span>
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

// Fix for typo in variants prop
const TEXT_VARIALNTS = TEXT_VARIANTS;