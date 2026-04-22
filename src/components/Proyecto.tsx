'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import SectionHeader from './ui/SectionHeader'
import FadeIn from './ui/FadeIn'
import { useLanguage } from '@/context/LanguageContext'
import { ShieldCheck, ShieldAlert, ArrowRight, Zap, Database, Lock, X } from 'lucide-react'
import CaseStudyDetail from './CaseStudyDetail'

const CASE_STUDIES = [
  {
    id: 'operational-resilience',
    titleKey: 'projects.case3.title',
    companyKey: 'projects.case3.company',
    descriptionKey: 'projects.case3.desc',
    before: [
      'projects.case3.before.1',
      'projects.case3.before.2',
      'projects.case3.before.3',
      'projects.case3.before.4',
      'projects.case3.before.5'
    ],
    after: [
      'projects.case3.after.1',
      'projects.case3.after.2',
      'projects.case3.after.3',
      'projects.case3.after.4',
      'projects.case3.after.5'
    ],
    metrics: [
      { labelKey: 'projects.case3.metric.1', value: '15 min', trend: 'down' },
      { labelKey: 'projects.case3.metric.2', value: '99.9%', trend: 'up' }
    ]
  },
  {
    id: 'ot-segmentation-oil',
    titleKey: 'projects.case1.title',
    companyKey: 'projects.case1.company',
    descriptionKey: 'projects.case1.desc',
    before: [
      'projects.case1.before.1',
      'projects.case1.before.2',
      'projects.case1.before.3'
    ],
    after: [
      'projects.case1.after.1',
      'projects.case1.after.2',
      'projects.case1.after.3'
    ],
    metrics: [
      { labelKey: 'projects.case1.metric.1', value: '85%', trend: 'up' },
      { labelKey: 'projects.case1.metric.2', value: '100%', trend: 'up' }
    ]
  },
  {
    id: 'siem-implementation',
    titleKey: 'projects.case2.title',
    companyKey: 'projects.case2.company',
    descriptionKey: 'projects.case2.desc',
    before: [
      'projects.case2.before.1',
      'projects.case2.before.2',
      'projects.case2.before.3'
    ],
    after: [
      'projects.case2.after.1',
      'projects.case2.after.2',
      'projects.case2.after.3'
    ],
    metrics: [
      { labelKey: 'projects.case2.metric.1', value: '99%', trend: 'up' },
      { labelKey: 'projects.case2.metric.2', value: '-60%', trend: 'down' }
    ]
  }
]

export default function Proyecto() {
  const { t } = useLanguage()
  const [activeCase, setActiveCase] = useState(0)
  const [sliderPos, setSliderPos] = useState(50)
  const [isDragging, setIsDragging] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [terminalSequenceActive, setTerminalSequenceActive] = useState(false)
  const [terminalLines, setTerminalLines] = useState<string[]>([])

  const handleOpenCaseStudy = async () => {
    setTerminalSequenceActive(true)
    setTerminalLines([])
    
    const lines = [
      '[>] Verificando credenciales de acceso...',
      '[>] Handshake seguro establecido (TLS 1.3)...',
      '[>] Desencriptando payload de proyecto...',
      '[>] Autorización confirmada.',
      '[>] Acceso Concedido.'
    ]

    for (let i = 0; i < lines.length; i++) {
      await new Promise(r => setTimeout(r, 400 + Math.random() * 300))
      setTerminalLines(prev => [...prev, lines[i]])
    }
    
    await new Promise(r => setTimeout(r, 600))
    setTerminalSequenceActive(false)
    setIsModalOpen(true)
  }

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left
    const percent = Math.max(0, Math.min(100, (x / rect.width) * 100))
    setSliderPos(percent)
  }

  return (
    <section id="proyecto" className="py-24 sm:py-32 relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-6">
        <SectionHeader 
          label={t('projects.label')} 
          title={t('projects.title')} 
          highlight={t('projects.highlight')} 
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mt-16">
          {/* Navigation */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            {CASE_STUDIES.map((cs, i) => (
              <button
                key={cs.id}
                onClick={() => {
                  setActiveCase(i)
                  setSliderPos(50)
                }}
                className={`text-left p-6 rounded-2xl border transition-all duration-300 relative overflow-hidden group ${
                  activeCase === i 
                    ? 'bg-blue-600/10 border-blue-500/50 shadow-[0_0_20px_rgba(30,144,255,0.1)]' 
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                <div className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mb-2">
                  {t(cs.companyKey)}
                </div>
                <h4 className="text-white font-bold mb-2 leading-tight">{t(cs.titleKey)}</h4>
                
                <div className={`h-1 w-8 rounded-full transition-all duration-500 ${
                  activeCase === i ? 'bg-blue-500 w-16' : 'bg-white/10 group-hover:w-12 group-hover:bg-white/20'
                }`} />

                {activeCase === i && (
                  <motion.div 
                    layoutId="active-bg"
                    className="absolute inset-0 bg-blue-500/5 -z-10"
                  />
                )}
              </button>
            ))}

            {/* Senior Impact Badge */}
            <div className="mt-8 p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-blue-500/10 border border-emerald-500/20">
              <div className="flex items-center gap-2 mb-3">
                <Zap size={16} className="text-emerald-400" />
                <span className="text-[11px] font-black text-emerald-400 uppercase tracking-wider">Impacto de Seniority</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed italic">
                "Juniors muestran código. <span className="text-white font-bold">Seniors muestran impacto real y ROI operativo.</span>"
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeCase}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="glass scanline-container rounded-3xl p-6 sm:p-10 border border-white/5 min-h-[600px] flex flex-col"
              >
                <div className="flex flex-col sm:flex-row justify-between gap-6 mb-10">
                  <div className="max-w-md">
                    <h3 className="text-2xl sm:text-3xl font-black text-white mb-4 leading-tight">
                      {t(CASE_STUDIES[activeCase].titleKey)}
                    </h3>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      {t(CASE_STUDIES[activeCase].descriptionKey)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    {CASE_STUDIES[activeCase].metrics.map(m => (
                      <div key={m.labelKey} className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center min-w-[110px] flex-1 relative overflow-hidden group">
                        <div className={`absolute top-0 right-0 p-1 ${m.trend === 'up' ? 'text-emerald-500' : 'text-blue-500'}`}>
                          <Zap size={10} className="animate-pulse" />
                        </div>
                        <div className="text-2xl font-black text-white mb-1 group-hover:scale-110 transition-transform duration-500">{m.value}</div>
                        <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest leading-none">{t(m.labelKey)}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Interactive Slider Container */}
                <div 
                  className="relative flex-grow rounded-2xl overflow-hidden bg-white/5 border border-white/10 cursor-col-resize select-none h-[500px] sm:h-[450px] md:h-[400px]"
                  onMouseDown={() => setIsDragging(true)}
                  onMouseUp={() => setIsDragging(false)}
                  onMouseLeave={() => setIsDragging(false)}
                  onMouseMove={handleMouseMove}
                  onTouchStart={() => setIsDragging(true)}
                  onTouchEnd={() => setIsDragging(false)}
                  onTouchMove={handleMouseMove}
                >
                  {/* AFTER State (Full Background) */}
                  <div className="absolute inset-0 bg-[#0a0a0a] p-5 sm:p-8">
                    <div className="flex items-center gap-3 text-emerald-500 mb-6 sm:mb-8">
                      <ShieldCheck size={24} />
                      <span className="text-sm font-black uppercase tracking-[3px]">{t('projects.after')}</span>
                    </div>
                    <ul className="space-y-5">
                      {CASE_STUDIES[activeCase].after.map((itemKey, i) => (
                        <motion.li 
                          key={i}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="flex gap-4 text-slate-200 text-base font-medium items-start"
                        >
                          <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                            <span className="text-emerald-500 text-[10px] font-bold">✓</span>
                          </div>
                          {t(itemKey)}
                        </motion.li>
                      ))}
                    </ul>
                  </div>

                  {/* BEFORE State (Clipped Overlay) */}
                  <div 
                    className="absolute inset-0 bg-[#1a0a0a] p-5 sm:p-8 border-r-2 border-blue-500/50"
                    style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
                  >
                    <div className="flex items-center gap-3 text-red-500 mb-6 sm:mb-8">
                      <ShieldAlert size={24} />
                      <span className="text-sm font-black uppercase tracking-[3px]">{t('projects.before')}</span>
                    </div>
                    <ul className="space-y-5">
                      {CASE_STUDIES[activeCase].before.map((itemKey, i) => (
                        <li key={i} className="flex gap-4 text-slate-500 text-base italic items-start">
                          <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
                            <span className="text-red-900/50 text-[10px]">✕</span>
                          </div>
                          {t(itemKey)}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Slider Handle */}
                  <div 
                    className="absolute top-0 bottom-0 w-1 bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)] z-10 pointer-events-none"
                    style={{ left: `${sliderPos}%` }}
                  >
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-blue-500 border-4 border-slate-900 flex items-center justify-center shadow-xl">
                      <div className="flex gap-1">
                        <div className="w-0.5 h-3 bg-white/50 rounded-full" />
                        <div className="w-0.5 h-3 bg-white/50 rounded-full" />
                      </div>
                    </div>
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-black text-blue-400 uppercase tracking-widest bg-slate-900/80 px-2 py-1 rounded border border-blue-500/30">
                      Slide to Compare
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-white/5 flex flex-wrap gap-4 items-center justify-between">
                  <div className="flex gap-6">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Lock size={14} className="text-blue-500/50" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">{t('projects.nda')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500">
                      <Database size={14} className="text-blue-500/50" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">{t('projects.iot')}</span>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleOpenCaseStudy}
                    className="flex items-center gap-3 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 px-6 py-3 rounded-xl transition-all group"
                  >
                    <span className="text-blue-400 text-xs font-black uppercase tracking-[2px]">{t('projects.view_project')}</span>
                    <ArrowRight size={16} className="text-blue-400 group-hover:translate-x-1 transition-transform" />
                  </motion.button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Full Screen Case Study Detail */}
      <AnimatePresence>
        {isModalOpen && (
          <CaseStudyDetail onClose={() => setIsModalOpen(false)} />
        )}
      </AnimatePresence>

      {/* Terminal Sequence Overlay */}
      <AnimatePresence>
        {terminalSequenceActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center font-mono"
          >
            <div className="w-[min(90vw,600px)] p-6 bg-black/50 border border-blue-500/20 rounded-lg shadow-[0_0_50px_rgba(30,144,255,0.1)] relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50" />
              <div className="flex gap-2 mb-4 border-b border-white/10 pb-2">
                <div className="w-3 h-3 rounded-full bg-red-500/50 border border-red-500" />
                <div className="w-3 h-3 rounded-full bg-amber-500/50 border border-amber-500" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/50 border border-emerald-500" />
                <span className="text-[10px] text-blue-500/70 ml-auto uppercase tracking-widest font-bold">Secure_Terminal // auth_seq</span>
              </div>
              <div className="flex flex-col gap-2 min-h-[150px] text-sm">
                {terminalLines.map((line, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ opacity: 0, x: -10 }} 
                    animate={{ opacity: 1, x: 0 }}
                    className={line.includes('Concedido') ? 'text-emerald-500 font-bold drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'text-blue-400 drop-shadow-[0_0_5px_rgba(59,130,246,0.3)]'}
                  >
                    {line}
                  </motion.div>
                ))}
                <motion.div
                  animate={{ opacity: [1, 0] }}
                  transition={{ repeat: Infinity, duration: 0.8 }}
                  className="w-2.5 h-4 bg-emerald-500 mt-2 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
