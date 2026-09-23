'use client'

import { motion, useInView, AnimatePresence } from 'framer-motion'
import { useRef, useState, useCallback, useMemo } from 'react'
import SectionHeader from './ui/SectionHeader'
import Icon from './ui/Icon'
import { useLanguage } from '@/context/LanguageContext'
import { useAskAIStore } from '@/stores/ask-ai-store'
import { RECURSO_FILES, type RecursoDocMeta, type RecursoCat } from '@/data/recursos'
import { trackLibraryEvent } from '@/lib/observability/posthog'

export type { RecursoCat } from '@/data/recursos'

const categories: { key: RecursoCat | 'all'; icon: string }[] = [
  { key: 'all', icon: 'document' },
  { key: 'vol1', icon: 'cloud' },
  { key: 'vol2', icon: 'industry' },
  { key: 'vol3', icon: 'network' },
  { key: 'vol4', icon: 'security' },
  { key: 'vol5', icon: 'rocket' },
  { key: 'standards', icon: 'compliance' },
  { key: 'project', icon: 'dashboard' },
]

const recursoFiles: RecursoDocMeta[] = RECURSO_FILES

function formatLabel(path: string): string {
  return path.toLowerCase().endsWith('.xlsx') ? 'XLSX' : 'DOCX'
}

export default function Recursos() {
  const { t, language } = useLanguage()
  const setIsOpen = useAskAIStore((s) => s.setIsOpen)
  const setPendingPrompt = useAskAIStore((s) => s.setPendingPrompt)
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  const [activeCategory, setActiveCategory] = useState<RecursoCat | 'all'>('all')

  const filteredFiles = useMemo(
    () => activeCategory === 'all'
      ? recursoFiles
      : recursoFiles.filter(f => f.category === activeCategory),
    [activeCategory],
  )

  const nameFor = useCallback((f: RecursoDocMeta) => (f.labelKey ? t(f.labelKey) : f.fallback), [t])

  const trackEvent = useCallback(
    (eventType: 'download' | 'describe', f: RecursoDocMeta) =>
      trackLibraryEvent(eventType, {
        file: f.path,
        category: f.category,
        format: formatLabel(f.path),
        language,
      }),
    [language],
  )

  const describeWithAI = useCallback(
    (f: RecursoDocMeta) => {
      const format = formatLabel(f.path)
      const prompt =
        language === 'en'
          ? `Describe the document "${nameFor(f)}" (${format}) from the IT/OT library: ` +
            `what it contains and what it is used for in practice. Answer in at most 120 words, no headings or lists.`
          : `Describe el documento "${nameFor(f)}" (${format}) de la biblioteca IT/OT: ` +
            `qué contiene y para qué se utiliza en la práctica. Responde en máximo 120 palabras, sin encabezados ni listas.`
      setPendingPrompt(prompt)
      setIsOpen(true)
    },
    [language, nameFor, setPendingPrompt, setIsOpen],
  )

  return (
    <section
      id="recursos"
      className="py-20 sm:py-32 px-4 sm:px-6 md:px-8"
      style={{ background: 'var(--bg2)' }}
    >
      <div ref={ref} className="max-w-[1100px] mx-auto">
        <SectionHeader
          label={t('recursos.label')}
          title={t('recursos.title')}
          highlight={t('recursos.highlight')}
        />

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="text-sm mb-8"
          style={{ color: 'var(--text-secondary)' }}
        >
          {t('recursos.intro')}{' '}
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full border"
            style={{ color: 'var(--gold)', borderColor: 'rgba(197,164,109,0.35)', background: 'rgba(197,164,109,0.08)' }}
          >
            {recursoFiles.length}
          </span>
        </motion.p>

        {/* Category filter tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl border mb-6 w-fit"
          style={{ background: 'var(--surface-fill)', borderColor: 'var(--surface-border)' }}
          role="tablist"
          aria-label={t('recursos.filter_label')}
        >
          {categories.map((cat) => {
            const isActive = activeCategory === cat.key
            return (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                role="tab"
                aria-selected={isActive}
                aria-controls={`recursos-panel-${cat.key}`}
                className={`relative text-xs px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer select-none ${isActive ? '' : 'hover:opacity-80'}`}
              >
                {isActive && (
                  <motion.div
                    layoutId="recursosActiveBg"
                    className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-amber-600/20 border border-amber-500/40 rounded-lg"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{t(`recursos.cat.${cat.key}`)}</span>
              </button>
            )
          })}
        </motion.div>

        {/* Files grid */}
        <motion.div
          layout
          className="console grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
          role="tabpanel"
          id={`recursos-panel-${activeCategory}`}
          aria-label={`${t('recursos.panel_label')} ${activeCategory === 'all' ? t('recursos.cat.all') : t(`recursos.cat.${activeCategory}`)}`}
        >
          <AnimatePresence mode="popLayout">
            {filteredFiles.map((f) => {
              const isXlsx = formatLabel(f.path) === 'XLSX'
              return (
                <motion.div
                  key={f.path}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  whileHover={{ y: -4, borderColor: 'rgba(197,164,109,0.5)', boxShadow: '0 12px 24px -6px rgba(0,0,0,0.6)' }}
                  className="group flex flex-col p-4 rounded-xl text-left relative overflow-hidden"
                  style={{
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    transition: 'border-color 0.2s ease-in-out, transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                  }}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border transition-colors ${
                      isXlsx
                        ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400 group-hover:bg-emerald-500/20'
                        : 'bg-blue-500/10 border-blue-500/25 text-blue-400 group-hover:bg-blue-500/20'
                    }`}>
                      <Icon name={isXlsx ? 'analytics' : 'document'} label={nameFor(f)} size={20} />
                    </div>
                    <span className={`text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded border ${
                      isXlsx
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                        : 'bg-blue-500/10 text-blue-300 border-blue-500/20'
                    }`}>
                      {formatLabel(f.path)}
                    </span>
                  </div>
                  <h4 className="text-[13px] font-medium leading-relaxed line-clamp-3 group-hover:text-amber-300 transition-colors" style={{ color: 'var(--text-primary)' }}>
                    {nameFor(f)}
                  </h4>
                  <a
                    href={`/${encodeURI(f.path)}`}
                    download
                    onClick={() => trackEvent('download', f)}
                    className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-amber-300/90 hover:text-amber-300 transition-colors self-start"
                    aria-label={`${t('recursos.download')} — ${nameFor(f)}`}
                  >
                    {t('recursos.download')}
                    <span aria-hidden="true">↓</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => { trackEvent('describe', f); describeWithAI(f) }}
                    className="mt-1.5 flex items-center gap-1.5 text-[11px] font-medium text-amber-300/90 hover:text-amber-300 transition-colors cursor-pointer self-start"
                    aria-label={`${t('recursos.describe')} — ${nameFor(f)}`}
                  >
                    <Icon name="ai" label={t('recursos.describe')} size={14} />
                    {t('recursos.describe')}
                    <span aria-hidden="true">→</span>
                  </button>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </motion.div>

        {filteredFiles.length === 0 && (
          <p className="text-sm text-center py-10" style={{ color: 'var(--text-muted)' }}>
            {t('recursos.empty')}
          </p>
        )}
      </div>
    </section>
  )
}
