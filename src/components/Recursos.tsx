'use client'

import { motion, useInView, AnimatePresence } from 'framer-motion'
import { useRef, useState, useCallback, useMemo } from 'react'
import SectionHeader from './ui/SectionHeader'
import Icon from './ui/Icon'
import { useLanguage } from '@/context/LanguageContext'
import { useAskAIStore } from '@/stores/ask-ai-store'

export type RecursoCat = 'vol1' | 'vol2' | 'vol3' | 'vol4' | 'vol5' | 'standards' | 'project'

export interface RecursoFile {
  path: string
  labelKey?: string
  fallback: string
  category: RecursoCat
}

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

const recursoFiles: RecursoFile[] = [
  // ── Vol. I · IT ──────────────────────────────────────────────────────
  { path: 'recursos/guias/vol1/guia_directorio_activedirectory.docx', fallback: 'Guía: Directorio Activo (Active Directory)', category: 'vol1' },
  { path: 'recursos/guias/vol1/guia_hardening_servidores.docx', fallback: 'Guía: Hardening de Servidores', category: 'vol1' },
  { path: 'recursos/guias/vol1/guia_implementacion_vpn.docx', fallback: 'Guía: Implementación de VPN', category: 'vol1' },
  { path: 'recursos/guias/vol1/guia_migracion_cloud.docx', fallback: 'Guía: Migración a la Nube', category: 'vol1' },
  { path: 'recursos/guias/vol1/guia_optimizacion_bdd.docx', fallback: 'Guía: Optimización de Bases de Datos', category: 'vol1' },
  { path: 'recursos/templates/vol1/checklist_auditoria_seguridad.xlsx', fallback: 'Checklist: Auditoría de Seguridad', category: 'vol1' },
  { path: 'recursos/templates/vol1/matriz_evaluacion_proveedores.xlsx', fallback: 'Matriz: Evaluación de Proveedores', category: 'vol1' },
  { path: 'recursos/templates/vol1/matriz_licenciamiento_software.xlsx', fallback: 'Matriz: Licenciamiento de Software', category: 'vol1' },
  { path: 'recursos/templates/vol1/plantilla_inventario_activos.docx', fallback: 'Plantilla: Inventario de Activos (DOCX)', category: 'vol1' },
  { path: 'recursos/templates/vol1/plantilla_inventario_activos.xlsx', fallback: 'Plantilla: Inventario de Activos (XLSX)', category: 'vol1' },
  { path: 'recursos/templates/vol1/plantilla_plan_contingencia.docx', fallback: 'Plantilla: Plan de Contingencia', category: 'vol1' },

  // ── Vol. II · OT ─────────────────────────────────────────────────────
  { path: 'recursos/guias/vol2/guia_configuracion_modbus.docx', fallback: 'Guía: Configuración de Modbus', category: 'vol2' },
  { path: 'recursos/guias/vol2/guia_configuracion_rtu.docx', fallback: 'Guía: Configuración de RTU', category: 'vol2' },
  { path: 'recursos/guias/vol2/guia_integracion_scada_plc.docx', fallback: 'Guía: Integración SCADA–PLC', category: 'vol2' },
  { path: 'recursos/guias/vol2/guia_programacion_ladder.docx', fallback: 'Guía: Programación Ladder', category: 'vol2' },
  { path: 'recursos/guias/vol2/guia_redundancia_dcs.docx', fallback: 'Guía: Redundancia en DCS', category: 'vol2' },
  { path: 'recursos/templates/vol2/checklist_configuracion_scada.xlsx', fallback: 'Checklist: Configuración SCADA', category: 'vol2' },
  { path: 'recursos/templates/vol2/matriz_asignacion_ip_ot.xlsx', fallback: 'Matriz: Asignación de IP en OT', category: 'vol2' },
  { path: 'recursos/templates/vol2/matriz_riesgos_ot.xlsx', fallback: 'Matriz: Riesgos OT', category: 'vol2' },
  { path: 'recursos/templates/vol2/plantilla_documento_dcs.docx', fallback: 'Plantilla: Documento DCS', category: 'vol2' },
  { path: 'recursos/templates/vol2/plantilla_programacion_plc.docx', fallback: 'Plantilla: Programación PLC', category: 'vol2' },

  // ── Vol. III · Integración ───────────────────────────────────────────
  { path: 'recursos/guias/vol3/guia_firewall_industrial.docx', fallback: 'Guía: Firewall Industrial', category: 'vol3' },
  { path: 'recursos/guias/vol3/guia_gestion_cambio_ot.docx', fallback: 'Guía: Gestión de Cambios en OT', category: 'vol3' },
  { path: 'recursos/guias/vol3/guia_integracion_historian.docx', fallback: 'Guía: Integración de Historian', category: 'vol3' },
  { path: 'recursos/guias/vol3/guia_medicion_madurez.docx', fallback: 'Guía: Medición de Madurez IT/OT', category: 'vol3' },
  { path: 'recursos/guias/vol3/guia_segmentacion_purdue.docx', fallback: 'Guía: Segmentación según Purdue', category: 'vol3' },
  { path: 'recursos/templates/vol3/checklist_integracion_itot.xlsx', fallback: 'Checklist: Integración IT/OT', category: 'vol3' },
  { path: 'recursos/templates/vol3/matriz_cambio_itot.xlsx', fallback: 'Matriz: Cambios IT/OT', category: 'vol3' },
  { path: 'recursos/templates/vol3/matriz_segmentacion_red.xlsx', fallback: 'Matriz: Segmentación de Red', category: 'vol3' },
  { path: 'recursos/templates/vol3/plantilla_politica_seguridad_ot.docx', fallback: 'Plantilla: Política de Seguridad OT', category: 'vol3' },
  { path: 'recursos/templates/vol3/plantilla_roadmap_transformacion.docx', fallback: 'Plantilla: Roadmap de Transformación', category: 'vol3' },

  // ── Vol. IV · Ciberseguridad ─────────────────────────────────────────
  { path: 'recursos/guias/vol4/guia_forense_industrial.docx', fallback: 'Guía: Forense Industrial', category: 'vol4' },
  { path: 'recursos/guias/vol4/guia_implantacion_iec62443.docx', fallback: 'Guía: Implantación IEC 62443', category: 'vol4' },
  { path: 'recursos/guias/vol4/guia_pentesting_ot.docx', fallback: 'Guía: Pentesting OT', category: 'vol4' },
  { path: 'recursos/guias/vol4/guia_segmentacion_red_ot.docx', fallback: 'Guía: Segmentación de Red OT', category: 'vol4' },
  { path: 'recursos/guias/vol4/guia_soc_industrial.docx', fallback: 'Guía: SOC Industrial', category: 'vol4' },
  { path: 'recursos/templates/vol4/checklist_vulnerabilidades_ot.xlsx', fallback: 'Checklist: Vulnerabilidades OT', category: 'vol4' },
  { path: 'recursos/templates/vol4/matriz_riesgos_ciberseguridad_ot.xlsx', fallback: 'Matriz: Riesgos de Ciberseguridad OT', category: 'vol4' },
  { path: 'recursos/templates/vol4/matriz_zonas_conduits.xlsx', fallback: 'Matriz: Zonas y Conduits', category: 'vol4' },
  { path: 'recursos/templates/vol4/plantilla_iec62443_autoevaluacion.docx', fallback: 'Plantilla: Autoevaluación IEC 62443', category: 'vol4' },
  { path: 'recursos/templates/vol4/plantilla_plan_respuesta_incidentes.docx', fallback: 'Plantilla: Plan de Respuesta a Incidentes', category: 'vol4' },

  // ── Vol. V · Tendencias ──────────────────────────────────────────────
  { path: 'recursos/guias/vol5/guia_5g_industrial.docx', fallback: 'Guía: 5G Industrial', category: 'vol5' },
  { path: 'recursos/guias/vol5/guia_cloud_edge_ot.docx', fallback: 'Guía: Cloud y Edge en OT', category: 'vol5' },
  { path: 'recursos/guias/vol5/guia_digital_twins_rollback.docx', fallback: 'Guía: Digital Twins con Rollback', category: 'vol5' },
  { path: 'recursos/guias/vol5/guia_implementacion_iiot.docx', fallback: 'Guía: Implementación IIoT', category: 'vol5' },
  { path: 'recursos/guias/vol5/guia_ml_predictivo_ot.docx', fallback: 'Guía: ML Predictivo en OT', category: 'vol5' },
  { path: 'recursos/templates/vol5/checklist_digital_twins.xlsx', fallback: 'Checklist: Digital Twins', category: 'vol5' },
  { path: 'recursos/templates/vol5/matriz_adopcion_i40.xlsx', fallback: 'Matriz: Adopción Industria 4.0', category: 'vol5' },
  { path: 'recursos/templates/vol5/matriz_evaluacion_roi_i40.xlsx', fallback: 'Matriz: Evaluación ROI Industria 4.0', category: 'vol5' },
  { path: 'recursos/templates/vol5/plantilla_arquitectura_iiot.docx', fallback: 'Plantilla: Arquitectura IIoT', category: 'vol5' },
  { path: 'recursos/templates/vol5/plantilla_proyecto_ia_ot.docx', fallback: 'Plantilla: Proyecto IA en OT', category: 'vol5' },

  // ── Estándares ───────────────────────────────────────────────────────
  { path: 'recursos/estandares/IEC_61131_3_resumen.docx', fallback: 'Resumen: IEC 61131-3', category: 'standards' },
  { path: 'recursos/estandares/IEC_61850_resumen.docx', fallback: 'Resumen: IEC 61850', category: 'standards' },
  { path: 'recursos/estandares/IEC_62443_resumen.docx', fallback: 'Resumen: IEC 62443', category: 'standards' },
  { path: 'recursos/estandares/ISA_95_resumen.docx', fallback: 'Resumen: ISA-95', category: 'standards' },
  { path: 'recursos/estandares/ISO_27001_resumen.docx', fallback: 'Resumen: ISO 27001', category: 'standards' },
  { path: 'recursos/estandares/NERC_CIP_resumen.docx', fallback: 'Resumen: NERC CIP', category: 'standards' },
  { path: 'recursos/estandares/NIST_CSF_resumen.docx', fallback: 'Resumen: NIST CSF', category: 'standards' },
  { path: 'recursos/estandares/Purdue_Model_resumen.docx', fallback: 'Resumen: Modelo Purdue', category: 'standards' },

  // ── Documentos del proyecto ──────────────────────────────────────────
  { path: 'recursos/README.docx', fallback: 'README — Sobre el proyecto del libro', category: 'project' },
  { path: 'recursos/ROADMAP_ITOT_2025_2035.docx', fallback: 'Roadmap IT/OT 2025–2035', category: 'project' },
]

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

  const nameFor = useCallback((f: RecursoFile) => (f.labelKey ? t(f.labelKey) : f.fallback), [t])

  const describeWithAI = useCallback(
    (f: RecursoFile) => {
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
                    className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-amber-300/90 hover:text-amber-300 transition-colors self-start"
                    aria-label={`${t('recursos.download')} — ${nameFor(f)}`}
                  >
                    {t('recursos.download')}
                    <span aria-hidden="true">↓</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => describeWithAI(f)}
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
