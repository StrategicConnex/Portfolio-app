import type { TranslationModule } from './index'

/**
 * Copy de la ruta `/cyber-attack-map` y del mapa 3D embebido en el panel
 * SIEM.
 *
 * Va en su propio diccionario —y no dentro de `siem.ts`— porque la página
 * es una ruta independiente con metadata propia; el bloque embebido en el
 * panel SIEM sí usa las claves `siem.map.*`.
 *
 * El mapa se dibuja en el canvas de WebGL, así que **todo** su texto visible
 * sale de aquí: el componente no lleva cadenas propias. Los únicos textos en
 * inglés que sobreviven son los que publica el proveedor (el tipo de ataque
 * de DShield, el nombre de un ASN) o la nomenclatura técnica
 * (DDoS, Botnet C2, SQL Injection, APT).
 */
const es = {
  'threatmap.title': 'Mapa Global de Ciberataques en Tiempo Real',
  'threatmap.subtitle': 'Visualización 3D con datos reales de inteligencia de amenazas',
  'threatmap.intro':
    'Cada arco parte de la IP real que DShield (SANS ISC) está reportando ahora mismo y converge en un destino aleatorio de la zona afectada. El extremo derecho del arco no es un dato del proveedor —DShield no publica la víctima— sino la infraestructura que se está protegiendo.',
  'threatmap.sources.title': 'Fuentes de Datos Reales',
  'threatmap.sources.ipwho': 'ipwho.is (respaldo de geolocalización)',
  'threatmap.features.title': 'Características',
  'threatmap.features.globe': 'Globo 3D interactivo',
  'threatmap.features.arcs': 'Arcos desde IPs reales hacia destinos protegidos e ilustrativos',
  'threatmap.features.labels': 'Etiquetas de país ancladas a la superficie del globo',
  'threatmap.features.live': 'Actualización en tiempo real',
  'threatmap.features.types': 'Múltiples tipos de amenazas',
  'threatmap.controls.title': 'Controles',
  'threatmap.controls.drag': 'Arrastrar para rotar',
  'threatmap.controls.scroll': 'Scroll para zoom',
  'threatmap.controls.auto': 'Auto-rotación activa',

  // --- Cromo del mapa (badge, leyenda, pie) ---
  'threatmap.badge.title': 'MAPA DE CIBERATAQUES 3D',
  'threatmap.status.live': 'EN VIVO · INTELIGENCIA DE AMENAZAS REAL',
  'threatmap.status.degraded': 'DEGRADADO · FEED NO DISPONIBLE',
  'threatmap.status.updated': 'Actualizado:',
  'threatmap.legend.types': 'TIPOS DE ATAQUE',
  'threatmap.legend.protected': 'Infraestructura protegida',
  'threatmap.legend.sources': 'FUENTES',
  'threatmap.legend.unavailable': 'no disponible',
  'threatmap.legend.dshield_live': '{count} IPs reales',
  'threatmap.legend.kev_live': '{count} CVEs confirmadas',
  'threatmap.footer.live': '✓ Datos de inteligencia de amenazas reales',
  'threatmap.footer.degraded': '⚠ Feed sin datos: origen de los arcos ilustrativo',
  'threatmap.stats.aria':
    'Estadísticas de la sesión: arcos por tipo de ataque, IPs reales distintas, listas de bloqueo y vulnerabilidades confirmadas',
  'threatmap.stat.arcs': '{type} — arcos trazados en esta sesión',
  'threatmap.stat.ips': 'IPs reales distintas en el feed actual',
  'threatmap.stat.blocklists': 'Listas de bloqueo que reportan SANS (suma)',
  'threatmap.stat.kev': 'Vulnerabilidades de CISA KEV con explotación confirmada',

  // --- Tooltip del arco ---
  'threatmap.tooltip.ip': 'IP real',
  'threatmap.tooltip.asn': 'ASN',
  'threatmap.tooltip.reports': 'Reportes',
  'threatmap.tooltip.country': 'País de origen',
  'threatmap.tooltip.illustrative_suffix': ' (ilustrativo)',
  'threatmap.tooltip.fallback_title': 'Ataque',
  'threatmap.tooltip.notice':
    'Origen ilustrativo: el proveedor no publicó una IP para este arco.',
  'threatmap.webgl.unavailable':
    'Tu navegador no pudo crear un contexto WebGL. Probá con otro navegador o activá la aceleración por hardware para ver el mapa 3D.',
} satisfies TranslationModule['es']

const en: TranslationModule['en'] = {
  'threatmap.title': 'Global Real-Time Cyber Attack Map',
  'threatmap.subtitle': '3D visualization with real threat intelligence data',
  'threatmap.intro':
    'Every arc starts at the real IP DShield (SANS ISC) is reporting right now and ends at a random destination in the affected zone. The right end of the arc is not provider data —DShield does not publish the victim— but the infrastructure being protected.',
  'threatmap.sources.title': 'Real Data Sources',
  'threatmap.sources.ipwho': 'ipwho.is (geolocation fallback)',
  'threatmap.features.title': 'Features',
  'threatmap.features.globe': 'Interactive 3D globe',
  'threatmap.features.arcs': 'Arcs from real IPs to protected and illustrative destinations',
  'threatmap.features.labels': 'Country labels anchored to the globe surface',
  'threatmap.features.live': 'Real-time updates',
  'threatmap.features.types': 'Multiple threat types',
  'threatmap.controls.title': 'Controls',
  'threatmap.controls.drag': 'Drag to rotate',
  'threatmap.controls.scroll': 'Scroll to zoom',
  'threatmap.controls.auto': 'Auto-rotation on',

  'threatmap.badge.title': 'CYBER ATTACK MAP 3D',
  'threatmap.status.live': 'LIVE · REAL THREAT INTELLIGENCE',
  'threatmap.status.degraded': 'DEGRADED · FEED UNAVAILABLE',
  'threatmap.status.updated': 'Updated:',
  'threatmap.legend.types': 'ATTACK TYPES',
  'threatmap.legend.protected': 'Protected infrastructure',
  'threatmap.legend.sources': 'SOURCES',
  'threatmap.legend.unavailable': 'not available',
  'threatmap.legend.dshield_live': '{count} real IPs',
  'threatmap.legend.kev_live': '{count} confirmed CVEs',
  'threatmap.footer.live': '✓ Real threat intelligence data',
  'threatmap.footer.degraded': '⚠ No feed data: arc origins are illustrative',
  'threatmap.stats.aria':
    'Session statistics: arcs per attack type, distinct real IPs, blocklists and confirmed vulnerabilities',
  'threatmap.stat.arcs': '{type} — arcs traced this session',
  'threatmap.stat.ips': 'Distinct real IPs in the current feed',
  'threatmap.stat.blocklists': 'Blocklists reported by SANS (sum)',
  'threatmap.stat.kev': 'CISA KEV vulnerabilities with confirmed exploitation',

  'threatmap.tooltip.ip': 'Real IP',
  'threatmap.tooltip.asn': 'ASN',
  'threatmap.tooltip.reports': 'Reports',
  'threatmap.tooltip.country': 'Origin country',
  'threatmap.tooltip.illustrative_suffix': ' (illustrative)',
  'threatmap.tooltip.fallback_title': 'Attack',
  'threatmap.tooltip.notice':
    'Illustrative origin: the provider did not publish an IP for this arc.',
  'threatmap.webgl.unavailable':
    'Your browser could not create a WebGL context. Try another browser or enable hardware acceleration to view the 3D map.',
}

export const threatmap = { es, en }
