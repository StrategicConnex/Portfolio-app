/** Metadata for the downloadable IT/OT book library (public/recursos/**).
 * Single source of truth shared by the Recursos section (UI) and the copilot
 * RAG corpus projection (src/lib/ask-ai/rag/sources.ts).
 */
export type RecursoCat = 'vol1' | 'vol2' | 'vol3' | 'vol4' | 'vol5' | 'standards' | 'project'

export interface RecursoDocMeta {
  /** Path under public/, e.g. 'recursos/guias/vol1/guia_x.docx'. */
  path: string
  /** Optional translation key; falls back to `fallback`. */
  labelKey?: string
  fallback: string
  category: RecursoCat
}

export const RECURSO_FILES: RecursoDocMeta[] = [
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
  { path: 'recursos/estandares/IEC_61131_3_resumen.docx', fallback: 'Resumen: IEC 61131-3', category: 'standards' },
  { path: 'recursos/estandares/IEC_61850_resumen.docx', fallback: 'Resumen: IEC 61850', category: 'standards' },
  { path: 'recursos/estandares/IEC_62443_resumen.docx', fallback: 'Resumen: IEC 62443', category: 'standards' },
  { path: 'recursos/estandares/ISA_95_resumen.docx', fallback: 'Resumen: ISA-95', category: 'standards' },
  { path: 'recursos/estandares/ISO_27001_resumen.docx', fallback: 'Resumen: ISO 27001', category: 'standards' },
  { path: 'recursos/estandares/NERC_CIP_resumen.docx', fallback: 'Resumen: NERC CIP', category: 'standards' },
  { path: 'recursos/estandares/NIST_CSF_resumen.docx', fallback: 'Resumen: NIST CSF', category: 'standards' },
  { path: 'recursos/estandares/Purdue_Model_resumen.docx', fallback: 'Resumen: Modelo Purdue', category: 'standards' },
  { path: 'recursos/README.docx', fallback: 'README — Sobre el proyecto del libro', category: 'project' },
  { path: 'recursos/ROADMAP_ITOT_2025_2035.docx', fallback: 'Roadmap IT/OT 2025–2035', category: 'project' },
]

/**
 * href de descarga: pasa por el endpoint de tracking
 * (`/api/track/download`), que registra el evento (IP, archivo, UA…) y
 * redirige con 307 al archivo estático de `public/`.
 */
export function recursoDownloadHref(path: string): string {
  return `/api/track/download?f=${encodeURIComponent(`/${path}`)}`
}
