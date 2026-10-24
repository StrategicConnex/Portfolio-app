import type { TranslationModule } from './index'

const es = {
  'siem.label': 'Security Operations',
  'siem.title': 'SIEM',
  'siem.highlight': 'Dashboard',
  // El panel consume el feed agregado real (Abuse.ch Feodo Tracker +
  // DShield/SANS ISC) vía /api/siem-feed. Los eventos son inteligencia
  // global publicada por los proveedores; el badge y esta descripción lo
  // declaran para que nadie interprete el panel como logs de su propia red.
  'siem.map_desc':
    'Inteligencia global agregada en tiempo real (Abuse.ch Feodo Tracker + DShield/SANS ISC): infraestructura C2 de botnets, puertos más atacados e IPs con más reportes. Los eventos son datos globales de los proveedores, no logs de una red propia.',
  'siem.live_badge': 'FEED GLOBAL · DATOS REALES',
  'siem.map.unavailable':
    'La visualización 3D no está disponible en este navegador. El mapa completo sigue accesible en su página dedicada.',
  'siem.map.title': 'Mapa de Ciberataques en Tiempo Real',
  'siem.map.open_full': 'Abrir en pantalla completa',
  'siem.hover_hint': '▸ Hover: mitigación recomendada (no ejecutada)',
  'siem.ui.event_stream': 'Event Stream – Inteligencia global',
  'siem.ui.stream_aria': 'Stream de eventos de inteligencia de amenazas global',
  'siem.ui.connecting': 'Conectando con los feeds de inteligencia de amenazas…',
  'siem.ui.no_data':
    'Feed no disponible en este momento: los datos reales aparecen solo cuando los proveedores responden.',
  'siem.ui.mitigation': 'Respuesta recomendada (no ejecutada)',
  'siem.ui.estimated': 'Est. de ejecución',
  'siem.ui.live_metrics': 'Métricas del feed',
  'siem.ui.feed_status': 'Estado de los feeds',
  'siem.feed.live': 'ACTIVO',
  'siem.feed.down': 'SIN DATOS',
  'siem.ui.threat_summary': 'Resumen de Amenazas',
  'siem.ui.threat_summary_aria': 'Resumen de amenazas',
  'siem.ui.top_attackers': 'Top de Países (según Feodo)',
  'siem.ui.top_targeted': 'Puertos más atacados (SANS ISC)',
  'siem.ui.botnet_families': 'Familias de botnet (Feodo)',
  'siem.kpi.c2_ips': 'IPs C2 (Feodo)',
  'siem.kpi.top_ports': 'Puertos más atacados',
  'siem.kpi.scan_reports': 'Reportes de escaneo',
  'siem.kpi.updated': 'Última actualización',
} satisfies TranslationModule['es']

const en: TranslationModule['en'] = {
  'siem.label': 'Security Operations',
  'siem.title': 'SIEM',
  'siem.highlight': 'Dashboard',
  // Same split as the ES copy: every line describes live provider-published
  // global intelligence and never a private network's own logs.
  'siem.map_desc':
    'Real-time aggregated global intelligence (Abuse.ch Feodo Tracker + DShield/SANS ISC): botnet C2 infrastructure, most-attacked ports and top reported scan sources. The events are provider-published global data, not a private network\'s own logs.',
  'siem.live_badge': 'GLOBAL FEED · REAL DATA',
  'siem.map.unavailable':
    'The 3D visualization is not available in this browser. The full map is still available on its dedicated page.',
  'siem.map.title': 'Real-Time Cyber Attack Map',
  'siem.map.open_full': 'Open full screen',
  'siem.hover_hint': '▸ Hover: recommended mitigation (not executed)',
  'siem.ui.event_stream': 'Event Stream – Global Intelligence',
  'siem.ui.stream_aria': 'Real-time global threat-intelligence event stream',
  'siem.ui.connecting': 'Connecting to the threat-intelligence feeds…',
  'siem.ui.no_data':
    'Feed unavailable right now: real data appears only when the providers respond.',
  'siem.ui.mitigation': 'Recommended response (not executed)',
  'siem.ui.estimated': 'Est. effort',
  'siem.ui.live_metrics': 'Feed Metrics',
  'siem.ui.feed_status': 'Feed status',
  'siem.feed.live': 'LIVE',
  'siem.feed.down': 'NO DATA',
  'siem.ui.threat_summary': 'Threat Summary',
  'siem.ui.threat_summary_aria': 'Threat summary',
  'siem.ui.top_attackers': 'Top Countries (per Feodo)',
  'siem.ui.top_targeted': 'Most Targeted Ports (SANS ISC)',
  'siem.ui.botnet_families': 'Botnet Families (Feodo)',
  'siem.kpi.c2_ips': 'C2 IPs (Feodo)',
  'siem.kpi.top_ports': 'Most targeted ports',
  'siem.kpi.scan_reports': 'Scan reports',
  'siem.kpi.updated': 'Last update',
}

export const siem = { es, en }
