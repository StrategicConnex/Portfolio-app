'use client'

import { motion, useInView, AnimatePresence } from 'framer-motion'
import { useRef, useState, useCallback, useEffect } from 'react'
import Image from 'next/image'
import SectionHeader from './ui/SectionHeader'
import Icon from './ui/Icon'
import { useLanguage } from '@/context/LanguageContext'

const certs = [
  { icon: 'certificate', text: 'certs.analyst', tier: 'gold' },
  { icon: 'document', text: 'certs.pm', tier: 'gold' },
  { icon: 'cloud', text: 'VMware Certified Associate – VCA-DCV', tier: 'blue' },
  { icon: 'network', text: 'Cisco CCNA Routing & Switching', tier: 'blue' },
  { icon: 'security', text: 'Cisco CyberSecurity', tier: 'blue' },
  { icon: 'windows', text: 'Microsoft MCSE', tier: 'blue' },
  { icon: 'compliance', text: 'SOX · NIST · ISO 27001 · IEC 62443', tier: 'gold' },
  { icon: 'world', text: 'certs.english', tier: 'muted' },
]

export type CategoryKey = 'all' | 'cybersecurity' | 'data_ai' | 'cloud_dev' | 'soft_skills' | 'other'

export interface CourseFile {
  filename: string
  nameKey: string
  category: CategoryKey
}

const categories: { key: CategoryKey; icon: string }[] = [
  { key: 'all', icon: 'document' },
  { key: 'cybersecurity', icon: 'security' },
  { key: 'data_ai', icon: 'brain' },
  { key: 'cloud_dev', icon: 'code' },
  { key: 'soft_skills', icon: 'user' },
  { key: 'other', icon: 'certificate' },
]

const courseFiles: CourseFile[] = [
  { filename: "CertificadoDeFinalizacion_Arquitectura de seguridad CompTIA Security SY0701.pdf", nameKey: "certs.course.comptia_security", category: "cybersecurity" },
  { filename: "CertificadoDeFinalizacion_Automatizacion y programacion de redes Cisco CCNA 2020.pdf", nameKey: "certs.course.ccna_automation", category: "cybersecurity" },
  { filename: "CertificadoDeFinalizacion_Bash Automatizaciones para ciberseguridad.pdf", nameKey: "certs.course.bash_cyber", category: "cybersecurity" },
  { filename: "CertificadoDeFinalizacion_IA para el analisis y reversing de malware.pdf", nameKey: "certs.course.ai_malware", category: "cybersecurity" },
  { filename: "Cisco Cibersecurity Analyst Career Path.pdf", nameKey: "certs.course.cisco_analyst", category: "cybersecurity" },
  { filename: "Cisco Networking Academy_ Defensa de la red.pdf", nameKey: "certs.course.cisco_netdef", category: "cybersecurity" },
  { filename: "Cisco_Juan Palacios_1 001.pdf", nameKey: "certs.course.cisco_l1", category: "cybersecurity" },
  { filename: "Cisco_Juan Palacios_2 001.pdf", nameKey: "certs.course.cisco_l2", category: "cybersecurity" },
  { filename: "Cisco_Juan Palacios_3 002.pdf", nameKey: "certs.course.cisco_l3", category: "cybersecurity" },
  { filename: "Fortinet 7.X.pdf", nameKey: "certs.course.fortinet", category: "cybersecurity" },
  { filename: "NetworkDefenseUpdate20260115-31-31nq15.pdf", nameKey: "certs.course.netdef_update", category: "cybersecurity" },
  { filename: "Network_Defense_certificate_palacios_juan-hotmail-com_698c5580-3283-4714-9254-e12fe9da6f29.pdf", nameKey: "certs.course.netdef_specialist", category: "cybersecurity" },
  { filename: "Bootcamp 2026 IA Generativa, LLm Apps, Aagentes IA, Cursor IA.pdf", nameKey: "certs.course.genai_bootcamp", category: "data_ai" },
  { filename: "CertificadoDeFinalizacion_Analisis estrategico de implementacion IA.pdf", nameKey: "certs.course.ai_strategy", category: "data_ai" },
  { filename: "CertificadoDeFinalizacion_Aprovechar la IA generativa para la gestion de proyectos.pdf", nameKey: "certs.course.genai_pm", category: "data_ai" },
  { filename: "CertificadoDeFinalizacion_Automatizacion de procesos con Power Automate esencial.pdf", nameKey: "certs.course.power_automate", category: "data_ai" },
  { filename: "CertificadoDeFinalizacion_Azure Machine learning e inteligencia artificial esencial.pdf", nameKey: "certs.course.azure_ml", category: "data_ai" },
  { filename: "CertificadoDeFinalizacion_Creacion de documentacion tecnica con herramientas de IA.pdf", nameKey: "certs.course.ai_docs", category: "data_ai" },
  { filename: "CertificadoDeFinalizacion_Excel y Copilot Analisis de datos asistido por IA.pdf", nameKey: "certs.course.excel_copilot", category: "data_ai" },
  { filename: "CertificadoDeFinalizacion_Explora una carrera como especialista en Power BI.pdf", nameKey: "certs.course.powerbi_career", category: "data_ai" },
  { filename: "CertificadoDeFinalizacion_Graficos y funcionalidades de analitica avanzada en Power BI.pdf", nameKey: "certs.course.powerbi_analytics", category: "data_ai" },
  { filename: "CertificadoDeFinalizacion_Power BI avanzado (1).pdf", nameKey: "certs.course.powerbi_l2", category: "data_ai" },
  { filename: "CertificadoDeFinalizacion_Power BI avanzado.pdf", nameKey: "certs.course.powerbi_l1", category: "data_ai" },
  { filename: "CertificadoDeFinalizacion_Python Microservicios.pdf", nameKey: "certs.course.python_micro", category: "data_ai" },
  { filename: "Python - Power BI - SQl Server Machine Learning.pdf", nameKey: "certs.course.python_ml", category: "data_ai" },
  { filename: "Udemy - Python_SQLServer_PowerBI_Machine_Learning.webp", nameKey: "certs.course.master_python", category: "data_ai" },
  { filename: "CertificadoDeFinalizacion_Aprende Power Automate Desktop.pdf", nameKey: "certs.course.pa_desktop", category: "cloud_dev" },
  { filename: "CertificadoDeFinalizacion_Docker esencial.pdf", nameKey: "certs.course.docker", category: "cloud_dev" },
  { filename: "CertificadoDeFinalizacion_React esencial.pdf", nameKey: "certs.course.react", category: "cloud_dev" },
  { filename: "Udemy - Master SQL Server.pdf", nameKey: "certs.course.sql_master", category: "cloud_dev" },
  { filename: "Udemy - SQL Server Programacion Avanzada 2025.pdf", nameKey: "certs.course.sql_advanced", category: "cloud_dev" },
  { filename: "Udemy AZ800 Administracion de Infraestructura Hibrida 2026- .webp", nameKey: "certs.course.az800", category: "cloud_dev" },
  { filename: "Titulo PMP.webp", nameKey: "certs.course.pmp", category: "soft_skills" },
  { filename: "certificado_comescrita.pdf", nameKey: "certs.course.written_comm", category: "soft_skills" },
  { filename: "certificado_comoral.pdf", nameKey: "certs.course.oral_comm", category: "soft_skills" },
  { filename: "certificado_epp.pdf", nameKey: "certs.course.ppe", category: "soft_skills" },
  { filename: "certificado_equipo.pdf", nameKey: "certs.course.teamwork", category: "soft_skills" },
  { filename: "certificado_feedback.pdf", nameKey: "certs.course.feedback", category: "soft_skills" },
  { filename: "certificado_incendios.pdf", nameKey: "certs.course.fire_prevention", category: "soft_skills" },
  { filename: "certificado_nego.pdf", nameKey: "certs.course.negotiation", category: "soft_skills" },
  { filename: "UC-096eca38-57c6-4247-bd30-c04ecfc38651.webp", nameKey: "certs.course.udemy1", category: "other" },
  { filename: "UC-80e60bec-8955-488a-8c59-13a977cac370.webp", nameKey: "certs.course.udemy2", category: "other" },
  { filename: "UC-846a9eac-34fa-4d81-bb85-da06786bb807.webp", nameKey: "certs.course.udemy3", category: "other" },
  { filename: "UC-a31cd8c3-da0c-4789-8e06-22e7acd40d17.webp", nameKey: "certs.course.udemy4", category: "other" },
  { filename: "UC-a31cd8c3-da0c-4789-8e06-22e7acd40d17.pdf", nameKey: "certs.course.udemy_pdf", category: "other" },
  { filename: "UC-a8acf70b-7d83-47e4-9a8d-74dc6945094f.pdf", nameKey: "certs.course.udemy5", category: "other" }
]

// ─── Modal Viewer ───────────────────────────────────────────────────────────

interface ModalViewerProps {
  file: CourseFile | null
  onClose: () => void
}

function ModalViewer({ file, onClose }: ModalViewerProps) {
  const { t } = useLanguage()
  const isPdf = file?.filename.toLowerCase().endsWith('.pdf') ?? false
  const src = file ? `/cursos/${encodeURIComponent(file.filename)}` : ''

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      // Block download-related keyboard shortcuts
      if (e.ctrlKey || e.metaKey) {
        if (['s', 'S', 'p', 'P', 'u', 'U'].includes(e.key)) {
          e.preventDefault()
        }
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  useEffect(() => {
    if (file) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [file])

  return (
    <AnimatePresence>
      {file && (
        <motion.div
          key="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          onContextMenu={(e) => e.preventDefault()}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center p-4 select-none"
          style={{
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(6px)',
          }}
          role="dialog"
          aria-modal="true"
          aria-label={file ? t(file.nameKey) : t('certs.viewer_label')}
        >
          {/* Modal panel */}
          <motion.div
            key="modal-panel"
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 20 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => e.preventDefault()}
            className="flex flex-col w-full overflow-hidden rounded-2xl"
            style={{
              maxWidth: 950,
              maxHeight: '92vh',
              background: 'var(--card)',
              border: '1px solid var(--border)',
              boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b flex-shrink-0" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-[11px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded flex-shrink-0"
                  style={{
                    color: 'var(--accent)',
                    background: 'var(--accent)',
                  }}
                >
                  {isPdf ? 'PDF' : t('certs.image_label')}
                </span>
                <span className="text-sm font-medium truncate text-[var(--text-primary)]">
                  {file && t(file.nameKey)}
                </span>
              </div>
              <button
                onClick={onClose}
                aria-label={t('certs.close_viewer')}
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-base cursor-pointer transition-colors bg-[var(--muted)] border border-[var(--surface-border)] text-[var(--text-muted)] hover:bg-[var(--surface-fill-strong)] hover:text-[var(--text-primary)]"
              >
                ✕
              </button>
            </div>

            {/* Content — anti-download protections */}
            <div className="flex-1 overflow-hidden relative min-h-0 select-none bg-[var(--background)]">
              {isPdf ? (
                <iframe
                  src={`${src}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`}
                  title={file ? t(file.nameKey) : ''}
                  onDragStart={(e) => e.preventDefault()}
                  onContextMenu={(e) => e.preventDefault()}
                  className="w-full h-full block min-h-[65vh] border-none"
                />
              ) : (
                <div
                  onContextMenu={(e) => e.preventDefault()}
                  onDragStart={(e) => e.preventDefault()}
                  className="w-full h-full min-h-[65vh] overflow-auto flex items-center justify-center p-6"
                  style={{ userSelect: 'none' }}
                >
                  <div className="relative inline-flex select-none" draggable={false}>
                    <Image
                      src={src}
                      alt={file ? t(file.nameKey) : t('certs.image_label')}
                      width={800}
                      height={600}
                      style={{
                        maxWidth: '100%',
                        maxHeight: '78vh',
                        objectFit: 'contain',
                        pointerEvents: 'none',
                        userSelect: 'none',
                      }}
                      className="rounded-lg"
                      draggable={false}
                      onDragStart={(e) => e.preventDefault()}
                    />
                    {/* Invisible overlay to trap right-click and drag events */}
                    <div
                      className="absolute inset-0 z-10"
                      onContextMenu={(e) => e.preventDefault()}
                      onDragStart={(e) => e.preventDefault()}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer hint */}
            <div className="flex items-center justify-center px-5 py-2.5 border-t border-[var(--border)] flex-shrink-0 text-[11px] text-[var(--text-muted)] bg-[var(--card)]">
              <span>
                {t('certs.reading_mode')}{' '}
                <kbd className="px-1 py-0.5 rounded font-mono text-[11px] bg-[var(--muted)] border border-[var(--surface-border)] text-[var(--text-muted)]">
                  Esc
                </kbd>
                {' '}{t('certs.close_hint')}
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function Certificaciones() {
  const { t } = useLanguage()
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  const [activeCategory, setActiveCategory] = useState<CategoryKey>('all')
  const [activeFile, setActiveFile] = useState<CourseFile | null>(null)

  const openFile = useCallback((file: CourseFile) => setActiveFile(file), [])
  const closeFile = useCallback(() => setActiveFile(null), [])

  const filteredFiles = activeCategory === 'all'
    ? courseFiles
    : courseFiles.filter(f => f.category === activeCategory)

  return (
    <>
      <ModalViewer file={activeFile} onClose={closeFile} />

      <section className="py-16 sm:py-24 px-4 sm:px-6 md:px-8" style={{ background: 'var(--bg2)' }}>
        <div ref={ref} className="max-w-[1100px] mx-auto">
          <SectionHeader label={t('certs.label')} title={t('certs.title')} highlight={t('certs.highlight')} />

          {/* Featured Certifications */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mb-16">
            {certs.map((c, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.92, y: 15 }}
                animate={inView ? { opacity: 1, scale: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.06 + 0.1, ease: [0.25, 0.1, 0.25, 1] }}
                whileHover={{ scale: 1.02, borderColor: c.tier === 'gold' ? 'rgba(197,164,109,0.5)' : 'rgba(30,144,255,0.5)' }}
                className="flex items-center gap-3.5 p-4 rounded-xl transition-colors"
                style={{
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    background: c.tier === 'gold'
                      ? 'rgba(197,164,109,0.15)'
                      : c.tier === 'blue'
                      ? 'rgba(30,144,255,0.12)'
                      : 'rgba(148,163,184,0.1)',
                  }}
                >
                  <Icon name={c.icon} label={t(c.text)} size={20} />
                </div>
                <span className={`text-xs sm:text-sm leading-snug ${c.tier === 'gold' ? 'font-medium' : ''}`} style={{ color: c.tier === 'gold' ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                  {t(c.text)}
                </span>
              </motion.div>
            ))}
          </div>

          {/* Course Files Gallery */}
          <div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <motion.h3
                initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                animate={inView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
                transition={{ duration: 0.6, delay: 0.4, ease: 'easeOut' }}
                className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}
              >
                <Icon name="document" label={t('certs.gallery_title')} size={20} />
                {t('certs.gallery_title')}
                <span className="text-xs font-normal ml-1 px-2 py-0.5 rounded-full border" style={{ color: 'var(--text-muted)', background: 'var(--surface-fill)', borderColor: 'var(--surface-border)' }}>
                  {filteredFiles.length}
                </span>
              </motion.h3>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.45 }}
                className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl border" style={{ background: 'var(--surface-fill)', borderColor: 'var(--surface-border)' }}
                role="tablist"
                aria-label={t('certs.filter_label')}
              >
                {categories.map((cat) => {
                  const isActive = activeCategory === cat.key
                  return (
                    <button
                      key={cat.key}
                      onClick={() => setActiveCategory(cat.key)}
                      role="tab"
                      aria-selected={isActive}
                      aria-controls={`certs-panel-${cat.key}`}
                      className={`relative text-xs px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer select-none flex items-center gap-1.5 ${
                        isActive ? '' : 'hover:opacity-80'
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activeCategoryBg"
                          className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-amber-600/20 border border-amber-500/40 rounded-lg"
                          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        />
                      )}
                      <span className="relative z-10">{t(`certs.cat.${cat.key}`)}</span>
                    </button>
                  )
                })}
              </motion.div>
            </div>

            {/* Grid — console scope keeps the dark instrument cards readable in both themes */}
            <motion.div
              layout
              className="console grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
              role="tabpanel"
              id={`certs-panel-${activeCategory}`}
              aria-label={`${t('certs.panel_label')} ${t(`certs.cat.${activeCategory}`)}`}
            >
              <AnimatePresence mode="popLayout">
                {filteredFiles.map((c) => {
                  const isPdf = c.filename.toLowerCase().endsWith('.pdf')
                  return (
                    <motion.button
                      key={c.filename}
                      layout
                      type="button"
                      onClick={() => openFile(c)}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.3 }}
                      whileHover={{ y: -4, borderColor: 'rgba(197,164,109,0.5)', boxShadow: '0 12px 24px -6px rgba(0,0,0,0.6)' }}
                      className="group flex flex-col p-4 rounded-xl cursor-pointer text-left relative overflow-hidden"
                      aria-label={`${t('certs.view')} ${t(c.nameKey)}`}
                      style={{
                        background: 'var(--card)',
                        border: '1px solid var(--border)',
                        transition: 'border-color 0.2s ease-in-out, transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                      }}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border transition-colors ${
                          isPdf
                            ? 'bg-amber-500/10 border-amber-500/25 text-amber-400 group-hover:bg-amber-500/20'
                            : 'bg-blue-500/10 border-blue-500/25 text-blue-400 group-hover:bg-blue-500/20'
                        }`}>
                          <Icon name={isPdf ? 'document' : 'image'} label={t(c.nameKey)} size={20} />
                        </div>
                        <span className={`text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded border ${
                          isPdf
                            ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                            : 'bg-blue-500/10 text-blue-300 border-blue-500/20'
                        }`}>
                          {isPdf ? 'PDF' : 'IMG'}
                        </span>
                      </div>
                      <h4 className="text-[13px] font-medium leading-relaxed line-clamp-3 group-hover:text-amber-300 transition-colors" style={{ color: 'var(--text-primary)' }}>
                        {t(c.nameKey)}
                      </h4>
                    </motion.button>
                  )
                })}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </section>
    </>
  )
}
