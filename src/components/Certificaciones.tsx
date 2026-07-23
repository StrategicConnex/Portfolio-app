'use client'

import { motion, useInView, AnimatePresence } from 'framer-motion'
import { useRef, useState, useCallback, useEffect } from 'react'
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
  name: string
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
  // Ciberseguridad & Redes
  { filename: "CertificadoDeFinalizacion_Arquitectura de seguridad CompTIA Security SY0701.pdf", name: "Arquitectura de Seguridad CompTIA Security SY0701", category: "cybersecurity" },
  { filename: "CertificadoDeFinalizacion_Automatizacion y programacion de redes Cisco CCNA 2020.pdf", name: "Automatización y Programación de Redes Cisco CCNA", category: "cybersecurity" },
  { filename: "CertificadoDeFinalizacion_Bash Automatizaciones para ciberseguridad.pdf", name: "Bash Automatizaciones para Ciberseguridad", category: "cybersecurity" },
  { filename: "CertificadoDeFinalizacion_IA para el analisis y reversing de malware.pdf", name: "IA para el Análisis y Reversing de Malware", category: "cybersecurity" },
  { filename: "Cisco Cibersecurity Analyst Career Path.pdf", name: "Cisco Cybersecurity Analyst Career Path", category: "cybersecurity" },
  { filename: "Cisco Networking Academy_ Defensa de la red.pdf", name: "Cisco Networking Academy: Defensa de la Red", category: "cybersecurity" },
  { filename: "Cisco_Juan Palacios_1 001.pdf", name: "Cisco Networking Academy (Nivel 1)", category: "cybersecurity" },
  { filename: "Cisco_Juan Palacios_2 001.pdf", name: "Cisco Networking Academy (Nivel 2)", category: "cybersecurity" },
  { filename: "Cisco_Juan Palacios_3 002.pdf", name: "Cisco Networking Academy (Nivel 3)", category: "cybersecurity" },
  { filename: "Fortinet 7.X.pdf", name: "Fortinet 7.X Security Specialist", category: "cybersecurity" },
  { filename: "NetworkDefenseUpdate20260115-31-31nq15.pdf", name: "Network Defense Certificate Update", category: "cybersecurity" },
  { filename: "Network_Defense_certificate_palacios_juan-hotmail-com_698c5580-3283-4714-9254-e12fe9da6f29.pdf", name: "Network Defense Specialist Certificate", category: "cybersecurity" },

  // Data & IA
  { filename: "Bootcamp 2026 IA Generativa, LLm Apps, Aagentes IA, Cursor IA.pdf", name: "Bootcamp IA Generativa, LLM Apps, Agentes IA & Cursor IA", category: "data_ai" },
  { filename: "CertificadoDeFinalizacion_Analisis estrategico de implementacion IA.pdf", name: "Análisis Estratégico de Implementación IA", category: "data_ai" },
  { filename: "CertificadoDeFinalizacion_Aprovechar la IA generativa para la gestion de proyectos.pdf", name: "Aprovechar la IA Generativa para Gestión de Proyectos", category: "data_ai" },
  { filename: "CertificadoDeFinalizacion_Automatizacion de procesos con Power Automate esencial.pdf", name: "Automatización de Procesos con Power Automate Esencial", category: "data_ai" },
  { filename: "CertificadoDeFinalizacion_Azure Machine learning e inteligencia artificial esencial.pdf", name: "Azure Machine Learning e Inteligencia Artificial Esencial", category: "data_ai" },
  { filename: "CertificadoDeFinalizacion_Creacion de documentacion tecnica con herramientas de IA.pdf", name: "Creación de Documentación Técnica con Herramientas IA", category: "data_ai" },
  { filename: "CertificadoDeFinalizacion_Excel y Copilot Analisis de datos asistido por IA.pdf", name: "Excel y Copilot: Análisis de Datos Asistido por IA", category: "data_ai" },
  { filename: "CertificadoDeFinalizacion_Explora una carrera como especialista en Power BI.pdf", name: "Especialista en Power BI Career Path", category: "data_ai" },
  { filename: "CertificadoDeFinalizacion_Graficos y funcionalidades de analitica avanzada en Power BI.pdf", name: "Gráficos y Analítica Avanzada en Power BI", category: "data_ai" },
  { filename: "CertificadoDeFinalizacion_Power BI avanzado (1).pdf", name: "Power BI Avanzado (Nivel 2)", category: "data_ai" },
  { filename: "CertificadoDeFinalizacion_Power BI avanzado.pdf", name: "Power BI Avanzado (Nivel 1)", category: "data_ai" },
  { filename: "CertificadoDeFinalizacion_Python Microservicios.pdf", name: "Python Microservicios", category: "data_ai" },
  { filename: "Python - Power BI - SQl Server Machine Learning.pdf", name: "Python, Power BI & SQL Server Machine Learning", category: "data_ai" },
  { filename: "Udemy - Python_SQLServer_PowerBI_Machine_Learning.jpg", name: "Master Python, SQL Server, Power BI & Machine Learning", category: "data_ai" },

  // Cloud & Dev
  { filename: "CertificadoDeFinalizacion_Aprende Power Automate Desktop.pdf", name: "Aprende Power Automate Desktop", category: "cloud_dev" },
  { filename: "CertificadoDeFinalizacion_Docker esencial.pdf", name: "Docker Esencial", category: "cloud_dev" },
  { filename: "CertificadoDeFinalizacion_React esencial.pdf", name: "React Esencial", category: "cloud_dev" },
  { filename: "Udemy - Master SQL Server.pdf", name: "Master SQL Server", category: "cloud_dev" },
  { filename: "Udemy - SQL Server Programacion Avanzada 2025.pdf", name: "SQL Server Programación Avanzada 2025", category: "cloud_dev" },
  { filename: "Udemy AZ800 Administracion de Infraestructura Hibrida 2026- .jpg", name: "Udemy AZ-800 Administración de Infraestructura Híbrida", category: "cloud_dev" },

  // Habilidades Blandas & Gestión
  { filename: "Titulo PMP.jpeg", name: "Título Project Management Professional (PMP)", category: "soft_skills" },
  { filename: "certificado_comescrita.pdf", name: "Comunicación Escrita", category: "soft_skills" },
  { filename: "certificado_comoral.pdf", name: "Comunicación Oral", category: "soft_skills" },
  { filename: "certificado_epp.pdf", name: "Equipos de Protección Personal (EPP)", category: "soft_skills" },
  { filename: "certificado_equipo.pdf", name: "Trabajo en Equipo", category: "soft_skills" },
  { filename: "certificado_feedback.pdf", name: "Feedback y Retroalimentación", category: "soft_skills" },
  { filename: "certificado_incendios.pdf", name: "Prevención de Incendios", category: "soft_skills" },
  { filename: "certificado_nego.pdf", name: "Negociación", category: "soft_skills" },

  // Otros
  { filename: "UC-096eca38-57c6-4247-bd30-c04ecfc38651.jpg", name: "Certificación Especializada Udemy (1)", category: "other" },
  { filename: "UC-80e60bec-8955-488a-8c59-13a977cac370.jpg", name: "Certificación Especializada Udemy (2)", category: "other" },
  { filename: "UC-846a9eac-34fa-4d81-bb85-da06786bb807.jpg", name: "Certificación Especializada Udemy (3)", category: "other" },
  { filename: "UC-a31cd8c3-da0c-4789-8e06-22e7acd40d17.jpg", name: "Certificación Especializada Udemy (4)", category: "other" },
  { filename: "UC-a31cd8c3-da0c-4789-8e06-22e7acd40d17.pdf", name: "Certificación Especializada Udemy (PDF)", category: "other" },
  { filename: "UC-a8acf70b-7d83-47e4-9a8d-74dc6945094f.pdf", name: "Certificación Especializada Udemy (5)", category: "other" }
]

// ─── Modal Viewer ───────────────────────────────────────────────────────────

interface ModalViewerProps {
  file: CourseFile | null
  onClose: () => void
}

function ModalViewer({ file, onClose }: ModalViewerProps) {
  const isPdf = file?.filename.toLowerCase().endsWith('.pdf') ?? false
  const src = file ? `/cursos/${encodeURIComponent(file.filename)}` : ''

  // Close on Escape key & block save/print hotkeys
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'p' || e.key === 'S' || e.key === 'P')) {
        e.preventDefault()
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  // Prevent body scroll when modal is open
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
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            userSelect: 'none',
          }}
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
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 16,
              width: '100%',
              maxWidth: 950,
              maxHeight: '92vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.875rem 1.25rem',
              borderBottom: '1px solid var(--border)',
              flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', minWidth: 0 }}>
                <span style={{
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--accent)',
                  background: 'rgba(197,164,109,0.12)',
                  padding: '2px 8px',
                  borderRadius: 4,
                  flexShrink: 0,
                }}>
                  {isPdf ? 'PDF' : 'Imagen'}
                </span>
                <span style={{
                  fontSize: 14,
                  fontWeight: 500,
                  color: '#e2e8f0',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {file?.name}
                </span>
              </div>
              <button
                onClick={onClose}
                aria-label="Cerrar"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: 'rgba(148,163,184,0.1)',
                  border: '1px solid rgba(148,163,184,0.15)',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 16,
                  flexShrink: 0,
                  transition: 'background 0.15s, color 0.15s',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(148,163,184,0.2)'
                  ;(e.currentTarget as HTMLButtonElement).style.color = '#e2e8f0'
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(148,163,184,0.1)'
                  ;(e.currentTarget as HTMLButtonElement).style.color = '#94a3b8'
                }}
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflow: 'hidden', position: 'relative', minHeight: 0, background: '#0f172a' }}>
              {isPdf ? (
                <iframe
                  src={`${src}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`}
                  title={file?.name}
                  onDragStart={(e) => e.preventDefault()}
                  style={{
                    width: '100%',
                    height: '100%',
                    minHeight: '65vh',
                    border: 'none',
                    display: 'block',
                  }}
                  onContextMenu={(e) => e.preventDefault()}
                />
              ) : (
                <div 
                  onContextMenu={(e) => e.preventDefault()}
                  onDragStart={(e) => e.preventDefault()}
                  style={{
                    width: '100%',
                    height: '100%',
                    minHeight: '65vh',
                    overflow: 'auto',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1.5rem',
                    userSelect: 'none',
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt={file?.name}
                    draggable={false}
                    onContextMenu={(e) => e.preventDefault()}
                    onDragStart={(e) => e.preventDefault()}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '78vh',
                      objectFit: 'contain',
                      borderRadius: 8,
                      pointerEvents: 'none',
                      userSelect: 'none',
                    }}
                  />
                </div>
              )}
            </div>

            {/* Footer hint */}
            <div style={{
              padding: '0.625rem 1.25rem',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              background: 'var(--card)',
            }}>
              <span style={{ fontSize: 11, color: '#64748b', letterSpacing: '0.02em' }}>
                Modo lectura protegido · Presiona <kbd style={{ background: 'rgba(148,163,184,0.1)', border: '1px solid rgba(148,163,184,0.15)', borderRadius: 4, padding: '1px 5px', fontFamily: 'monospace', fontSize: 11, color: '#94a3b8' }}>Esc</kbd> o clic fuera para cerrar
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

      <section style={{ padding: 'clamp(2rem, 5vw, 4rem) clamp(1rem, 5vw, 2rem)', background: 'var(--bg2)' }}>
        <div ref={ref} style={{ maxWidth: 1100, margin: 'auto' }}>
          <SectionHeader label={t('certs.label')} title={t('certs.title')} highlight={t('certs.highlight')} />

          {/* Featured Certifications */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mb-16">
            {certs.map((c, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.05 + 0.1 }}
                whileHover={{ scale: 1.02, borderColor: c.tier === 'gold' ? 'rgba(197,164,109,0.5)' : 'rgba(30,144,255,0.5)' }}
                style={{
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  padding: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem',
                  transition: 'border-color 0.2s',
                }}
              >
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: c.tier === 'gold'
                    ? 'rgba(197,164,109,0.15)'
                    : c.tier === 'blue'
                    ? 'rgba(30,144,255,0.12)'
                    : 'rgba(148,163,184,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Icon name={c.icon} label={t(c.text)} size={20} />
                </div>
                <span className={`text-[12px] sm:text-[13px] leading-snug ${c.tier === 'gold' ? 'text-white font-medium' : 'text-slate-400'}`}>
                  {t(c.text)}
                </span>
              </motion.div>
            ))}
          </div>

          {/* Course Files Gallery */}
          <div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <motion.h3 
                initial={{ opacity: 0, y: 10 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="text-lg font-semibold text-white flex items-center gap-2"
              >
                <Icon name="document" label="Cursos y Certificados" size={20} />
                Cursos y Certificados
                <span className="text-xs font-normal text-slate-400 ml-1 bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-700/50">
                  {filteredFiles.length}
                </span>
              </motion.h3>

              {/* Category Filter Tabs */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.45 }}
                className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-900/60 border border-slate-800/80"
              >
                {categories.map((cat) => {
                  const isActive = activeCategory === cat.key
                  return (
                    <button
                      key={cat.key}
                      onClick={() => setActiveCategory(cat.key)}
                      className={`relative text-xs px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer select-none flex items-center gap-1.5 ${
                        isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200'
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

            {/* Grid */}
            <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
                      whileHover={{ y: -4, borderColor: 'rgba(197,164,109,0.5)' }}
                      className="group flex flex-col p-4 rounded-xl cursor-pointer text-left relative overflow-hidden"
                      style={{
                        background: 'var(--card)',
                        border: '1px solid var(--border)',
                        transition: 'border-color 0.2s ease-in-out, transform 0.2s ease-in-out',
                      }}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="w-10 h-10 rounded-full bg-slate-800/50 flex items-center justify-center border border-slate-700/50 group-hover:bg-slate-800 transition-colors">
                          <Icon name={isPdf ? 'document' : 'image'} label={c.name} size={20} />
                        </div>
                        <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 bg-slate-800/50 px-2 py-1 rounded-md">
                          {isPdf ? 'PDF' : 'IMG'}
                        </span>
                      </div>
                      <h4 className="text-[13px] text-slate-300 font-medium leading-relaxed line-clamp-3 group-hover:text-white transition-colors">
                        {c.name}
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
