import type { TranslationModule } from './index'

const es = {
  // Tool names
  'tool.dns': 'DNS Analyzer',
  'tool.ssl': 'SSL/TLS Checker',
  'tool.whois': 'WHOIS Lookup',
  'tool.headers': 'HTTP Security Headers',
  'tool.techstack': 'Tech Stack Detector',
  'tool.port': 'Port Analyzer',

  // Tool card labels
  'tool.dns.records': 'DNS Records',
  'tool.ssl.cert': 'SSL/TLS Certificate',
  'tool.whois.reg': 'Domain Registration',
  'tool.headers.label': 'HTTP Security Headers',
  'tool.techstack.label': 'Technology Stack',
  'tool.port.label': 'Port Security',

  // Status labels
  'tool.status.running': 'Ejecutando',
  'tool.status.error': 'Error',
  'tool.status.valid': 'Válido',
  'tool.status.expired': 'Expirado',
  'tool.status.expiring': 'Por Expirar',
  'tool.status.missing': 'Falta',
  'tool.status.connection_error': 'Error de Conexión',
  'tool.status.lookup_error': 'Error de Consulta',

  // SSL specific
  'tool.ssl.issuer': 'Emisor',
  'tool.ssl.subject': 'Sujeto (CN)',
  'tool.ssl.valid_from': 'Válido Desde',
  'tool.ssl.valid_until': 'Válido Hasta',
  'tool.ssl.protocol': 'Protocolo',
  'tool.ssl.san': 'Subject Alternative Names',
  'tool.ssl.days_remaining': 'días',
  'tool.ssl.day_remaining': 'día',
  'tool.ssl.cert_expired': 'Certificado expirado',
  'tool.ssl.expires_in': 'Expira en',
  'tool.ssl.valid_for': 'Válido por',
  'tool.ssl.more': 'más',

  // DNS specific
  'tool.dns.no_records': 'No se encontraron registros DNS para este dominio',
  'tool.dns.value': 'valor',
  'tool.dns.values': 'valores',

  // Whois specific
  'tool.whois.timeline': 'Línea de Tiempo del Dominio',
  'tool.whois.created': 'Creado',
  'tool.whois.updated': 'Actualizado',
  'tool.whois.expires': 'Expira',
  'tool.whois.nameservers': 'Name Servers',
  'tool.whois.status': 'Estado',
  'tool.whois.handle': 'Registry Handle',

  // HTTP Headers specific
  'tool.headers.security_score': 'Puntaje de Seguridad',
  'tool.headers.of': 'de',
  'tool.headers.security_headers_present': 'cabeceras de seguridad presentes',
  'tool.headers.security_headers': 'Cabeceras de Seguridad',
  'tool.headers.other_notable': 'Otras Cabeceras Notables',

  // Port Analyzer specific
  'tool.port.port': 'puerto',
  'tool.port.ports': 'puertos',
  'tool.port.recommendation': 'Recomendación',

  // Tech Stack specific
  'tool.techstack.detected': 'Tecnologías Detectadas',
  'tool.techstack.server': 'Servidor',
  'tool.techstack.framework': 'Framework',
  'tool.techstack.cdn': 'CDN',
  'tool.techstack.analytics': 'Analytics',

  // Common
  'tool.copy': 'Copiar',
  'tool.copied': 'Copiado',
  'tool.parameters': 'Parámetros',
  'tool.result': 'Resultado',
  'tool.service': 'Servicio',
  'tool.unknown': 'Desconocido',
} satisfies TranslationModule['es']

const en: TranslationModule['en'] = {
  'tool.dns': 'DNS Analyzer',
  'tool.ssl': 'SSL/TLS Checker',
  'tool.whois': 'WHOIS Lookup',
  'tool.headers': 'HTTP Security Headers',
  'tool.techstack': 'Tech Stack Detector',
  'tool.port': 'Port Analyzer',

  'tool.dns.records': 'DNS Records',
  'tool.ssl.cert': 'SSL/TLS Certificate',
  'tool.whois.reg': 'Domain Registration',
  'tool.headers.label': 'HTTP Security Headers',
  'tool.techstack.label': 'Technology Stack',
  'tool.port.label': 'Port Security',

  'tool.status.running': 'Running',
  'tool.status.error': 'Error',
  'tool.status.valid': 'Valid',
  'tool.status.expired': 'Expired',
  'tool.status.expiring': 'Expiring Soon',
  'tool.status.missing': 'Missing',
  'tool.status.connection_error': 'Connection Error',
  'tool.status.lookup_error': 'Lookup Error',

  'tool.ssl.issuer': 'Issuer',
  'tool.ssl.subject': 'Subject (CN)',
  'tool.ssl.valid_from': 'Valid From',
  'tool.ssl.valid_until': 'Valid Until',
  'tool.ssl.protocol': 'Protocol',
  'tool.ssl.san': 'Subject Alternative Names',
  'tool.ssl.days_remaining': 'days',
  'tool.ssl.day_remaining': 'day',
  'tool.ssl.cert_expired': 'Certificate expired',
  'tool.ssl.expires_in': 'Expires in',
  'tool.ssl.valid_for': 'Valid for',
  'tool.ssl.more': 'more',

  'tool.dns.no_records': 'No DNS records found for this domain',
  'tool.dns.value': 'value',
  'tool.dns.values': 'values',

  'tool.whois.timeline': 'Domain Timeline',
  'tool.whois.created': 'Created',
  'tool.whois.updated': 'Updated',
  'tool.whois.expires': 'Expires',
  'tool.whois.nameservers': 'Name Servers',
  'tool.whois.status': 'Status',
  'tool.whois.handle': 'Registry Handle',

  'tool.headers.security_score': 'Security Score',
  'tool.headers.of': 'of',
  'tool.headers.security_headers_present': 'security headers present',
  'tool.headers.security_headers': 'Security Headers',
  'tool.headers.other_notable': 'Other Notable Headers',

  'tool.port.port': 'port',
  'tool.port.ports': 'ports',
  'tool.port.recommendation': 'Recommendation',

  'tool.techstack.detected': 'Detected Technologies',
  'tool.techstack.server': 'Server',
  'tool.techstack.framework': 'Framework',
  'tool.techstack.cdn': 'CDN',
  'tool.techstack.analytics': 'Analytics',

  'tool.copy': 'Copy',
  'tool.copied': 'Copied',
  'tool.parameters': 'Parameters',
  'tool.result': 'Result',
  'tool.service': 'Service',
  'tool.unknown': 'Unknown',
}

export const tools = { es, en }
