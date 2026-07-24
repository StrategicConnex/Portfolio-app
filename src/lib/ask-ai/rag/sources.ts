export interface KnowledgeSource {
  id: string;
  title: string;
  content: string;
  tags: string[];
  locale: 'es' | 'en' | 'both';
  type: 'profile' | 'experience' | 'stack' | 'certification' | 'case-study' | 'audit' | 'siem' | 'blog' | 'service';
  url?: string;
}

// ─── Perfil / Profesional ───────────────────────────────────────────────────

const PROFILE_SOURCES: KnowledgeSource[] = [
  {
    id: 'profile-summary',
    title: 'Perfil Profesional',
    content: `Juan Felipe Palacios es Arquitecto IT/OT especializado en Ciberseguridad Industrial con sede en Neuquén, Argentina. 
    Más de 15 años de experiencia en Oil & Gas, infraestructura crítica y Vaca Muerta. 
    Experto en IEC 62443, NIST CSF, ISO 27001, SOX, SIEM (Security Onion), Modelo Purdue, SCADA, redes industriales y cloud (Azure/AWS). 
    Certificado PMP, CCNA, MCSE, VMware VCA-DCV.`,
    tags: ['perfil', 'juan', 'palacios', 'neuquén', 'argentina', 'arquitecto', 'it/ot', 'ciberseguridad', 'industrial'],
    locale: 'es',
    type: 'profile',
  },
  {
    id: 'profile-summary-en',
    title: 'Professional Profile',
    content: `Juan Felipe Palacios is an IT/OT Architect specialized in Industrial Cybersecurity based in Neuquén, Argentina. 
    Over 15 years of experience in Oil & Gas, critical infrastructure and Vaca Muerta. 
    Expert in IEC 62443, NIST CSF, ISO 27001, SOX, SIEM (Security Onion), Purdue Model, SCADA, industrial networks and cloud (Azure/AWS). 
    Certified PMP, CCNA, MCSE, VMware VCA-DCV.`,
    tags: ['profile', 'juan', 'palacios', 'neuquen', 'argentina', 'architect', 'it/ot', 'cybersecurity', 'industrial'],
    locale: 'en',
    type: 'profile',
  },
  {
    id: 'contact-info',
    title: 'Información de Contacto',
    content: 'LinkedIn: linkedin.com/in/juanfpalacios. GitHub: github.com/juanfpalacios. Email disponible en sección de contacto. Basado en Neuquén, Argentina. Disponible para proyectos de alta criticidad en Oil & Gas e infraestructura crítica.',
    tags: ['contacto', 'linkedin', 'github', 'neuquén', 'email'],
    locale: 'es',
    type: 'profile',
  },
  {
    id: 'contact-info-en',
    title: 'Contact Information',
    content: 'LinkedIn: linkedin.com/in/juanfpalacios. GitHub: github.com/juanfpalacios. Based in Neuquén, Argentina. Available for high-criticality projects in Oil & Gas and critical infrastructure.',
    tags: ['contact', 'linkedin', 'github', 'neuquen', 'email'],
    locale: 'en',
    type: 'profile',
  },
];

// ─── Experiencia / Experience ──────────────────────────────────────────────

const EXPERIENCE_SOURCES: KnowledgeSource[] = [
  {
    id: 'exp-ypy',
    title: 'YPY Oilfield Services - IT/OT Security Lead',
    content: `Líder en seguridad IT/OT en YPY Oilfield Services. ISO 27001, NIST CSF, Security Onion SIEM, SCADA, PMI, Azure, AWS, VMware, IAM. Implementación y gestión de arquitecturas de seguridad para entornos industriales Oil & Gas.`,
    tags: ['ypy', 'oilfield', 'oil & gas', 'iso 27001', 'nist', 'security onion', 'siem', 'scada', 'azure', 'aws', 'vmware', 'iam'],
    locale: 'both',
    type: 'experience',
  },
  {
    id: 'exp-ops',
    title: 'Oilfield Production Services SRL - IT/OT Manager',
    content: `Gerente IT/OT en Oilfield Production Services SRL. Cisco, VSAT, MPLS, MikroTik, Riverbed, Python, VMware, Security Onion, Fibra Óptica, SQL Server. Gestión integral de infraestructura TI y OT para operaciones Oil & Gas.`,
    tags: ['ops', 'oilfield production', 'cisco', 'vsat', 'mpls', 'mikrotik', 'riverbed', 'python', 'fibra óptica'],
    locale: 'both',
    type: 'experience',
  },
  {
    id: 'exp-ext',
    title: 'Exterran Argentina SRL - IT/OT Supervisor',
    content: `Supervisor IT/OT en Exterran Argentina SRL. MPLS, VSAT, SOX, Virtualización, Riverbed, Veeam, IP Telephony, HUB Latinoamérica. Supervisión de operaciones TI/OT para la región latinoamericana.`,
    tags: ['exterran', 'sox', 'virtualización', 'veeam', 'ip telephony', 'latinoamérica'],
    locale: 'both',
    type: 'experience',
  },
];

// ─── Stack / Tecnologías ────────────────────────────────────────────────────

const STACK_SOURCES: KnowledgeSource[] = [
  {
    id: 'stack-seguridad',
    title: 'Stack - Seguridad',
    content: 'Security Onion, Firewalls Industriales, SIEM, SOAR, IDS/IPS, Fortinet, Cisco ASA, WAF, DDoS Mitigation (Radware), Endpoint Protection, MFA. Seguridad perimetral y de redes industriales.',
    tags: ['seguridad', 'security onion', 'firewall', 'siem', 'soar', 'ids', 'ips', 'fortinet', 'cisco', 'waf', 'ddos', 'radware'],
    locale: 'both',
    type: 'stack',
  },
  {
    id: 'stack-redes',
    title: 'Stack - Redes y Comunicaciones',
    content: 'Cisco (CCNA), MikroTik, VSAT, MPLS, SD-WAN, Fibra Óptica, Riverbed, Modbus, DNP3, Protocolos Industriales, TCP/IP, VLAN, VPN. Redes OT e infraestructura de comunicaciones crítica.',
    tags: ['redes', 'cisco', 'ccna', 'mikrotik', 'vsat', 'mpls', 'sd-wan', 'fibra', 'riverbed', 'modbus', 'dnp3'],
    locale: 'both',
    type: 'stack',
  },
  {
    id: 'stack-cloud',
    title: 'Stack - Cloud e Infraestructura',
    content: 'Azure, AWS, VMware VCA-DCV, Virtualización, Docker, SQL Server, Power BI, Python, PowerShell, Bash. Infraestructura híbrida y automatización.',
    tags: ['cloud', 'azure', 'aws', 'vmware', 'virtualización', 'docker', 'sql server', 'power bi', 'python', 'powershell'],
    locale: 'both',
    type: 'stack',
  },
];

// ─── Certificaciones ────────────────────────────────────────────────────────

const CERT_SOURCES: KnowledgeSource[] = [
  {
    id: 'certs-main',
    title: 'Certificaciones Principales',
    content: 'PMP (Project Management Professional), CCNA Routing & Switching, Microsoft MCSE, VMware VCA-DCV, Cisco Cybersecurity Analyst. Certificaciones en ciberseguridad, cloud y gestión de proyectos.',
    tags: ['certificaciones', 'pmp', 'ccna', 'mcse', 'vmware', 'cisco', 'microsoft'],
    locale: 'both',
    type: 'certification',
  },
  {
    id: 'certs-cybersecurity',
    title: 'Cursos de Ciberseguridad',
    content: 'Arquitectura de Seguridad CompTIA Security+, Automatización y Programación de Redes Cisco, Bash para Ciberseguridad, IA para Reversing de Malware, Defensa de la Red (Cisco), Fortinet 7.X Security Specialist, Network Defense.',
    tags: ['ciberseguridad', 'comptia', 'security+', 'bash', 'malware', 'fortinet', 'network defense'],
    locale: 'es',
    type: 'certification',
  },
  {
    id: 'certs-data-ai',
    title: 'Cursos de Datos e IA',
    content: 'IA Generativa y LLM Apps, Análisis Estratégico de IA, Power BI Avanzado, Azure Machine Learning, Python Microservicios, SQL Server Machine Learning, Power Automate, Excel Copilot.',
    tags: ['ia', 'datos', 'power bi', 'azure ml', 'python', 'sql server', 'machine learning', 'power automate', 'copilot'],
    locale: 'es',
    type: 'certification',
  },
];

// ─── Casos de Estudio / Projects ────────────────────────────────────────────

const CASE_SOURCES: KnowledgeSource[] = [
  {
    id: 'case-resiliencia',
    title: 'Caso de Estudio: Resiliencia Operacional',
    content: `Caso de éxito en manufactura de procesos continuos. Reducción de MTTR de 4.2 horas a 15 minutos. 
    Implementación de SIEM unificado, dashboards Grafana, SOAR, DMZ industrial con Jump Server MFA y Edge Firewall. 
    Arquitectura Purdue Level 2-5. Detección de manipulación de setpoints en SCADA en tiempo récord. Ahorro anual de $420,000 USD. 
    Stack: Suricata + ML, SOC Unificado, Shuffle SOAR, Firewall OT.`,
    tags: ['caso', 'resiliencia', 'mttr', 'siem', 'grafana', 'soar', 'dmz', 'purdue', 'scada', 'suricata', 'shuffle', 'ahorro'],
    locale: 'es',
    type: 'case-study',
  },
  {
    id: 'case-ot-segmentation',
    title: 'Caso de Estudio: Segmentación OT en Oil & Gas',
    content: `Segmentación de red OT en operaciones Oil & Gas. Implementación de firewalls industriales, DMZ, y control de acceso basado en Purdue Model. 
    Reducción de superficie de ataque y mejora en detección de amenazas. 85% mejora en cobertura OT.`,
    tags: ['caso', 'segmentación', 'ot', 'oil & gas', 'purdue', 'dmz', 'firewall'],
    locale: 'es',
    type: 'case-study',
  },
  {
    id: 'case-siem',
    title: 'Caso de Estudio: Implementación SIEM',
    content: `Implementación completa de SIEM corporativo con Security Onion. Correlación de eventos IT y OT. 
    Reducción de 60% en tiempo de respuesta a incidentes. 99% de cobertura de detectción. Integración con SOAR para automatización de respuesta.`,
    tags: ['caso', 'siem', 'security onion', 'soar', 'correlación', 'detección'],
    locale: 'es',
    type: 'case-study',
  },
];

// ─── SIEM Dashboard ─────────────────────────────────────────────────────────

const SIEM_SOURCES: KnowledgeSource[] = [
  {
    id: 'siem-dashboard',
    title: 'Simulación SIEM - Dashboard',
    content: `Dashboard interactivo de simulación SIEM. Monitoreo de amenazas en tiempo real con niveles ALERT, WARN, INFO. 
    Vectores de ataque: TCP Flood (66%), UDP Flood (28%), DNS Flood (4%), IP Flood, Low and Slow. 
    Top atacantes: Estados Unidos (82%), China (8%), Singapur (5%), Alemania (3%), India (2%). 
    Zonas Purdue protegidas con 98-99.9% efectividad. KPIs: MTTR < 15 min, Uptime 99.9%, Alertas reducidas -30%. 
    Mitigación DDoS con Radware DefensePro.`,
    tags: ['siem', 'dashboard', 'threat', 'alerts', 'ddos', 'radware', 'tcp flood', 'purdue', 'mttr'],
    locale: 'both',
    type: 'siem',
  },
];

// ─── Servicios ──────────────────────────────────────────────────────────────

const SERVICE_SOURCES: KnowledgeSource[] = [
  {
    id: 'service-audit',
    title: 'Servicio: Auditoría de Seguridad OT/IT',
    content: 'Auditoría completa de seguridad OT/IT. Evaluación de cumplimiento contra IEC 62443, NIST CSF, ISO 27001. Identificación de brechas y plan de remediación. Análisis de segmentación de red y control de accesos.',
    tags: ['servicio', 'auditoría', 'ot', 'it', 'iec 62443', 'nist', 'iso 27001', 'cumplimiento'],
    locale: 'es',
    type: 'service',
  },
  {
    id: 'service-siem',
    title: 'Servicio: Implementación SIEM',
    content: 'Diseño e implementación de SIEM con Security Onion. Correlación IT/OT, dashboards personalizados, reglas de detección, integración SOAR, playbooks de respuesta a incidentes.',
    tags: ['servicio', 'siem', 'security onion', 'soar', 'detección', 'incidentes'],
    locale: 'es',
    type: 'service',
  },
  {
    id: 'service-purdue',
    title: 'Servicio: Arquitectura Purdue IT/OT',
    content: 'Diseño e implementación de arquitectura de redes industriales basada en el Modelo Purdue. Segmentación de niveles 0-4, DMZ industrial, control de accesos, monitoreo de tráfico OT.',
    tags: ['servicio', 'purdue', 'arquitectura', 'segmentación', 'dmz', 'industrial'],
    locale: 'es',
    type: 'service',
  },
  {
    id: 'service-compliance',
    title: 'Servicio: Consultoría Cumplimiento',
    content: 'Consultoría en marcos de cumplimiento: IEC 62443 (Seguridad Industrial), NIST CSF (Ciberseguridad), ISO 27001 (SGSI), SOX (Control Financiero). Preparación para auditorías y certificaciones.',
    tags: ['servicio', 'cumplimiento', 'consultoría', 'iec 62443', 'nist', 'iso 27001', 'sox'],
    locale: 'es',
    type: 'service',
  },
];

// ─── Compliance Frameworks ──────────────────────────────────────────────────

const COMPLIANCE_SOURCES: KnowledgeSource[] = [
  {
    id: 'compliance-iso27001',
    title: 'ISO 27001:2022',
    content: 'Sistema de Gestión de Seguridad de la Información (SGSI). Progreso en implementación: 94%. Controles: 142 totales, 131 pasados, 4 fallados, 7 en advertencia. Auditoría última: 2024-Q1. Auditoría próxima: 2024-Q3.',
    tags: ['iso 27001', 'sgsi', 'cumplimiento', 'auditoría'],
    locale: 'es',
    type: 'audit',
  },
  {
    id: 'compliance-iec62443',
    title: 'IEC 62443-4-2',
    content: 'Estándar de Ciberseguridad para Sistemas de Automatización Industrial. Progreso: 88%. Aplicación en Oil & Gas, Vaca Muerta. Cubre requisitos técnicos para componentes del sistema de automatización.',
    tags: ['iec 62443', 'industrial', 'automation', 'oil & gas', 'vaca muerta'],
    locale: 'both',
    type: 'audit',
  },
  {
    id: 'compliance-nist',
    title: 'NIST CSF v2.0',
    content: 'Cybersecurity Framework del National Institute of Standards and Technology. Progreso: 91%. Framework de ciberseguridad con funciones: Identificar, Proteger, Detectar, Responder, Recuperar. Gobernanza y gestión de riesgos.',
    tags: ['nist', 'csf', 'framework', 'gobernanza', 'riesgo'],
    locale: 'both',
    type: 'audit',
  },
];

// ─── Blog ───────────────────────────────────────────────────────────────────

const BLOG_SOURCES: KnowledgeSource[] = [
  {
    id: 'blog-iec-62443',
    title: 'IEC 62443 en Vaca Muerta',
    content: 'Artículo sobre aplicación del estándar IEC 62443 en operaciones Oil & Gas de Vaca Muerta, Neuquén. Desafíos de seguridad en infraestructura crítica y estrategias de implementación.',
    tags: ['blog', 'iec 62443', 'vaca muerta', 'oil & gas', 'neuquén'],
    locale: 'es',
    type: 'blog',
  },
  {
    id: 'blog-siem-convergencia',
    title: 'SIEM y Convergencia IT/OT',
    content: 'Artículo sobre la convergencia de SIEM para entornos IT y OT. Estrategias de correlación de eventos, detección de amenazas y respuesta a incidentes en infraestructura crítica.',
    tags: ['blog', 'siem', 'convergencia', 'it/ot', 'detección', 'incidentes'],
    locale: 'es',
    type: 'blog',
  },
  {
    id: 'blog-nist-csf',
    title: 'NIST CSF en Infraestructura Crítica',
    content: 'Artículo sobre implementación de NIST Cybersecurity Framework en infraestructura crítica argentina. Adaptación del framework para Oil & Gas y cumplimiento regulatorio.',
    tags: ['blog', 'nist', 'csf', 'infraestructura crítica', 'argentina', 'oil & gas'],
    locale: 'es',
    type: 'blog',
  },
];

// ─── Export consolidated ────────────────────────────────────────────────────

export const ALL_SOURCES: KnowledgeSource[] = [
  ...PROFILE_SOURCES,
  ...EXPERIENCE_SOURCES,
  ...STACK_SOURCES,
  ...CERT_SOURCES,
  ...CASE_SOURCES,
  ...SIEM_SOURCES,
  ...SERVICE_SOURCES,
  ...COMPLIANCE_SOURCES,
  ...BLOG_SOURCES,
];

export const SOURCE_COUNT = ALL_SOURCES.length;
