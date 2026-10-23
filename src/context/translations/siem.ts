import type { TranslationModule } from './index'

const es = {
  'siem.label': 'Security Operations',
  'siem.title': 'SIEM',
  'siem.highlight': 'Dashboard',
  // El mapa 3D consume datos reales (DShield + CISA KEV); el resto del panel
  // (stream, KPIs, zonas, top atacantes) sigue siendo simulado en el
  // navegador. La descripción y el badge distinguen ambas cosas para no
  // atribuirle a todo el panel una precisión de datos en vivo que no tiene.
  'siem.map_desc':
    'Mapa de amenazas con datos reales de DShield (SANS ISC) y CISA KEV. El resto del panel (stream, KPIs, zonas Purdue) es una demostración simulada en el navegador.',
  'siem.demo_badge': 'MAPA EN VIVO · PANEL SIMULADO',
  'siem.map.unavailable':
    'La visualización 3D no está disponible en este navegador. El mapa completo sigue accesible en su página dedicada.',
  'siem.map.title': 'Mapa de Ciberataques en Tiempo Real',
  'siem.map.open_full': 'Abrir en pantalla completa',
  'siem.hover_hint': '▸ Hover sobre un evento ALERT para ver la acción de mitigación',
  'siem.incident_btn': 'Simular Incidente Industrial',
  'siem.incident_btn_active': 'ANALIZANDO EVENTO...',
  'siem.status.connected': 'SISTEMA CONECTADO',
  'siem.status.monitoring': 'PANEL DE DEMOSTRACIÓN',
  'siem.ui.auto_response': 'Respuesta automática',
  'siem.ui.mttr': 'MTTR',
  'siem.ui.incident_title': 'INCIDENTE SIMULADO – Purdue Nivel 1',
  'siem.ui.incident_desc': 'Detección de anomalía en dispositivos de campo. El SOC aplica mitigación automática.',
  'siem.ui.event_stream': 'Event Stream – Nivel IT/OT',
  'siem.ui.stream_aria': 'Stream de eventos de seguridad en tiempo real',
  'siem.ui.availability': 'Disponibilidad por Zona Purdue',
  'siem.ui.threat_summary': 'Resumen de Amenazas',
  'siem.ui.threat_summary_aria': 'Resumen de amenazas',
  'siem.ui.operational_kpis': 'KPIs de demostración',
  'siem.ui.top_attackers': 'Top Atacantes',
  'siem.ui.top_attacked': 'Top Atacados',
  'siem.ui.attack_vectors': 'Vectores de Ataque',
  'siem.kpi.uptime': 'Uptime Red Industrial',
  'siem.kpi.latency': 'Latencia Promedio OT',
  'siem.kpi.blocked': 'Ataques Bloqueados (24h)',
  'siem.kpi.alerts': 'Alertas Críticas Activas',
  'siem.kpi.mttr_val': '< 15 min',
  'siem.kpi.uptime_val': '99.9%',
  'siem.kpi.blocked_val': '1.284',
  'siem.kpi.alerts_val': '3',
  'siem.zone.field': 'Nivel 1 – Dispositivos de Campo',
  'siem.zone.control': 'Nivel 2 – Control de Procesos',
  'siem.zone.operations': 'Nivel 3 – Operaciones de Planta',
  'siem.zone.idmz': 'DMZ Industrial',
  'siem.zone.enterprise': 'Nivel 4 – Red Corporativa (+ Nivel 5 Cloud)',
} satisfies TranslationModule['es']

const en: TranslationModule['en'] = {
  'siem.label': 'Security Operations',
  'siem.title': 'SIEM',
  'siem.highlight': 'Dashboard',
  // Same split as the ES copy: the 3D map is real, the rest of the panel is
  // simulated. The badge must not claim live intelligence for KPIs that are
  // generated in the browser.
  'siem.map_desc':
    'Threat map fed with live DShield (SANS ISC) and CISA KEV data. The rest of the panel (stream, KPIs, Purdue zones) is a browser-side simulation.',
  'siem.demo_badge': 'LIVE MAP · SIMULATED PANEL',
  'siem.map.unavailable':
    'The 3D visualization is not available in this browser. The full map is still available on its dedicated page.',
  'siem.map.title': 'Real-Time Cyber Attack Map',
  'siem.map.open_full': 'Open full screen',
  'siem.hover_hint': '▸ Hover over an ALERT event to see mitigation action',
  'siem.incident_btn': 'Simulate Industrial Incident',
  'siem.incident_btn_active': 'ANALIZANDO EVENTO...',
  'siem.status.connected': 'SYSTEM CONNECTED',
  'siem.status.monitoring': 'DEMO PANEL',
  'siem.ui.auto_response': 'Automatic response',
  'siem.ui.mttr': 'MTTR',
  'siem.ui.incident_title': 'SIMULATED INCIDENT – Purdue Level 1',
  'siem.ui.incident_desc': 'Anomaly detection in field devices. SOC applies automatic mitigation.',
  'siem.ui.event_stream': 'Event Stream – IT/OT Level',
  'siem.ui.stream_aria': 'Real-time security event stream',
  'siem.ui.availability': 'Purdue Zone Availability',
  'siem.ui.threat_summary': 'Threat Summary',
  'siem.ui.threat_summary_aria': 'Threat summary',
  'siem.ui.operational_kpis': 'Demo KPIs',
  'siem.ui.top_attackers': 'Top Attackers',
  'siem.ui.top_attacked': 'Top Attacked',
  'siem.ui.attack_vectors': 'Attack Vectors',
  'siem.kpi.uptime': 'Industrial Network Uptime',
  'siem.kpi.latency': 'OT Average Latency',
  'siem.kpi.blocked': 'Blocked Attacks (24h)',
  'siem.kpi.alerts': 'Active Critical Alerts',
  'siem.kpi.mttr_val': '< 15 min',
  'siem.kpi.uptime_val': '99.9%',
  'siem.kpi.blocked_val': '1,284',
  'siem.kpi.alerts_val': '3',
  'siem.zone.field': 'Level 1 – Field Devices',
  'siem.zone.control': 'Level 2 – Process Control',
  'siem.zone.operations': 'Level 3 – Plant Operations',
  'siem.zone.idmz': 'Industrial DMZ',
  'siem.zone.enterprise': 'Level 4 – Enterprise Network (+ Level 5 Cloud)',
}

export const siem = { es, en }
