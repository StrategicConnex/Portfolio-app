'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import SectionHeader from './ui/SectionHeader'
import FadeIn from './ui/FadeIn'
import { useLanguage } from '@/context/LanguageContext'
import { ShieldCheck, ShieldAlert, ArrowRight, Zap, Database, Lock } from 'lucide-react'

const CASE_STUDIES = [
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
      { labelKey: 'projects.case1.metric.1', value: '85%' },
      { labelKey: 'projects.case1.metric.2', value: '100%' }
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
      { labelKey: 'projects.case2.metric.1', value: '99%' },
      { labelKey: 'projects.case2.metric.2', value: '-60%' }
    ]
  }
]

export default function Proyecto() {
  const { t } = useLanguage()
  const [activeCase, setActiveCase] = useState(0)

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
                onClick={() => setActiveCase(i)}
                className={`text-left p-6 rounded-2xl border transition-all duration-300 ${
                  activeCase === i 
                    ? 'bg-blue-600/10 border-blue-500/50 shadow-[0_0_20px_rgba(30,144,255,0.1)]' 
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                <div className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mb-2">
                  {t(cs.companyKey)}
                </div>
                <h4 className="text-white font-bold mb-2">{t(cs.titleKey)}</h4>
                <div className={`h-1 w-8 rounded-full transition-all duration-500 ${
                  activeCase === i ? 'bg-blue-500 w-16' : 'bg-white/10'
                }`} />
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeCase}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.5 }}
                className="glass scanline-container rounded-3xl p-8 sm:p-12 border border-white/5 min-h-[500px] flex flex-col"
              >
                <div className="flex flex-col sm:flex-row justify-between gap-6 mb-12">
                  <div className="max-w-md">
                    <h3 className="text-2xl sm:text-3xl font-black text-white mb-4 leading-tight">
                      {t(CASE_STUDIES[activeCase].titleKey)}
                    </h3>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      {t(CASE_STUDIES[activeCase].descriptionKey)}
                    </p>
                  </div>
                  <div className="flex gap-4">
                    {CASE_STUDIES[activeCase].metrics.map(m => (
                      <div key={m.labelKey} className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center min-w-[100px]">
                        <div className="text-xl font-black text-blue-500 mb-1">{m.value}</div>
                        <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{t(m.labelKey)}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                  {/* Before */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 text-red-500/80">
                      <ShieldAlert size={20} />
                      <span className="text-[11px] font-black uppercase tracking-[2px]">{t('projects.before')}</span>
                    </div>
                    <ul className="space-y-4">
                      {CASE_STUDIES[activeCase].before.map((itemKey, i) => (
                        <li key={i} className="flex gap-3 text-slate-500 text-sm italic">
                          <span className="text-red-900/50">✕</span>
                          {t(itemKey)}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* After */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 text-emerald-500">
                      <ShieldCheck size={20} />
                      <span className="text-[11px] font-black uppercase tracking-[2px]">{t('projects.after')}</span>
                    </div>
                    <ul className="space-y-4">
                      {CASE_STUDIES[activeCase].after.map((itemKey, i) => (
                        <li key={i} className="flex gap-3 text-slate-200 text-sm font-medium">
                          <span className="text-emerald-500 font-bold">✓</span>
                          {t(itemKey)}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-auto pt-8 border-t border-white/5 flex flex-wrap gap-4 items-center justify-between">
                  <div className="flex gap-4">
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
                    className="flex items-center gap-2 text-blue-500 text-xs font-black uppercase tracking-[2px] group"
                  >
                    {t('projects.view_project')}
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </motion.button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  )
}
