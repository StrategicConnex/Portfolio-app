import type { TranslationModule } from './index'

/**
 * Claves i18n del Living Datacenter (SPEC §13, §14): labels de escena, status
 * de sistema y nodos de la topología Purdue. Cada clave existe en `es` y `en`
 * (test de paridad en `datacenter.test.ts`). Cero texto hardcoded en geometría.
 */
const es: TranslationModule['es'] = {
  // Escena 01 - Boot Sequence (narrativa de arranque)
  'dc.scene.boot.status': 'INICIALIZANDO SISTEMA',
  'dc.scene.boot.network': 'RED EN LÍNEA',
  'dc.scene.boot.ai': 'NÚCLEO IA LISTO',
  // Escena 02 - Core Architecture
  'dc.scene.architecture.title': 'ARQUITECTURA CENTRAL',
  // Escena 03 - Data in Motion
  'dc.scene.data.title': 'DATOS EN MOVIMIENTO',
  // Escena 04 - Resilience & Depth
  'dc.scene.resilience.title': 'RESILIENCIA Y PROFUNDIDAD',
  // Escena 05 - Connection Point
  'dc.scene.connection.title': 'PUNTO DE CONEXIÓN',
  // Fase del recorrido (audit G1 — numeración de escena en HUD)
  'dc.phase.label': 'FASE',
  // Nodo focal por sección (audit G2 — label diegético de la baliza)
  'dc.focus.home': 'IDENTIDAD',
  'dc.focus.perfil': 'PERFIL',
  'dc.focus.arquitectura': 'ARQUITECTURA',
  'dc.focus.stack': 'STACK',
  'dc.focus.confianza': 'CONFIANZA',
  'dc.focus.experiencia': 'EXPERIENCIA',
  'dc.focus.proyecto': 'PROYECTOS',
  'dc.focus.certificaciones': 'CERTIFICACIONES',
  'dc.focus.siem': 'SIEM · SOC',
  'dc.focus.audit-hub': 'AUDIT HUB',
  'dc.focus.scaudit': 'SECURITY AUDIT',
  'dc.focus.blog': 'CONOCIMIENTO',
  'dc.focus.contacto': 'CONEXIÓN',
  // Status de sistema (HUD)
  'dc.status.online': 'EN LÍNEA',
  'dc.status.secure': 'SEGURO',
  'dc.status.storage': 'ALMACENAMIENTO',
  'dc.status.backup': 'RESPALDO',
  // Nodos de la topología Purdue (src/data/mindmap.ts)
  'dc.node.convergencia': 'Convergencia IT/OT',
  'dc.node.scada': 'SCADA',
  'dc.node.modbus': 'Modbus',
  'dc.node.dnp3': 'DNP3',
  'dc.node.firewalls': 'Firewalls Industriales',
  'dc.node.virtualizacion': 'Virtualización',
  'dc.node.cisco': 'Redes Cisco',
  'dc.node.siem': 'SIEM',
  'dc.node.nist': 'NIST',
  'dc.node.iso': 'ISO 27001',
  // Datos encarnados (audit G3 — labels cortos de marcos de cumplimiento)
  'dc.data.iso': 'ISO 27001',
  'dc.data.iec': 'IEC 62443',
  'dc.data.nist': 'NIST CSF',
  'dc.data.gdpr': 'GDPR · LGPD',
  // Datos encarnados (audit G3 — severidades de amenaza del SIEM)
  'dc.data.threat.critical': 'CRÍTICO',
  'dc.data.threat.high': 'ALTO',
  'dc.data.threat.medium': 'MEDIO',
  'dc.data.threat.low': 'BAJO',
}

const en: TranslationModule['en'] = {
  'dc.scene.boot.status': 'SYSTEM INITIALIZING',
  'dc.scene.boot.network': 'NETWORK ONLINE',
  'dc.scene.boot.ai': 'AI CORE READY',
  'dc.scene.architecture.title': 'CORE ARCHITECTURE',
  'dc.scene.data.title': 'DATA IN MOTION',
  'dc.scene.resilience.title': 'RESILIENCE & DEPTH',
  'dc.scene.connection.title': 'CONNECTION POINT',
  // Fase del recorrido (audit G1 — numeración de escena en HUD)
  'dc.phase.label': 'PHASE',
  // Nodo focal por sección (audit G2 — label diegético de la baliza)
  'dc.focus.home': 'IDENTITY',
  'dc.focus.perfil': 'PROFILE',
  'dc.focus.arquitectura': 'ARCHITECTURE',
  'dc.focus.stack': 'STACK',
  'dc.focus.confianza': 'TRUST',
  'dc.focus.experiencia': 'EXPERIENCE',
  'dc.focus.proyecto': 'PROJECTS',
  'dc.focus.certificaciones': 'CERTIFICATIONS',
  'dc.focus.siem': 'SIEM · SOC',
  'dc.focus.audit-hub': 'AUDIT HUB',
  'dc.focus.scaudit': 'SECURITY AUDIT',
  'dc.focus.blog': 'KNOWLEDGE',
  'dc.focus.contacto': 'CONNECTION',
  'dc.status.online': 'ONLINE',
  'dc.status.secure': 'SECURE',
  'dc.status.storage': 'STORAGE',
  'dc.status.backup': 'BACKUP',
  'dc.node.convergencia': 'IT/OT Convergence',
  'dc.node.scada': 'SCADA',
  'dc.node.modbus': 'Modbus',
  'dc.node.dnp3': 'DNP3',
  'dc.node.firewalls': 'Industrial Firewalls',
  'dc.node.virtualizacion': 'Virtualization',
  'dc.node.cisco': 'Cisco Networks',
  'dc.node.siem': 'SIEM',
  'dc.node.nist': 'NIST',
  // Datos encarnados (audit G3 — labels cortos de marcos de cumplimiento)
  'dc.data.iso': 'ISO 27001',
  'dc.data.iec': 'IEC 62443',
  'dc.data.nist': 'NIST CSF',
  'dc.data.gdpr': 'GDPR · LGPD',
  'dc.node.iso': 'ISO 27001',
  // Datos encarnados (audit G3 — severidades de amenaza del SIEM)
  'dc.data.threat.critical': 'CRITICAL',
  'dc.data.threat.high': 'HIGH',
  'dc.data.threat.medium': 'MEDIUM',
  'dc.data.threat.low': 'LOW',
}

/** Mapea label de `src/data/mindmap.ts` → clave i18n (nunca texto hardcoded). */
export const NODE_LABEL_KEYS: Record<string, string> = {
  'Convergencia IT/OT': 'dc.node.convergencia',
  SCADA: 'dc.node.scada',
  Modbus: 'dc.node.modbus',
  DNP3: 'dc.node.dnp3',
  'Firewalls Industriales': 'dc.node.firewalls',
  Virtualización: 'dc.node.virtualizacion',
  'Redes Cisco': 'dc.node.cisco',
  SIEM: 'dc.node.siem',
  NIST: 'dc.node.nist',
  'ISO 27001': 'dc.node.iso',
}

export const datacenter = { es, en }
