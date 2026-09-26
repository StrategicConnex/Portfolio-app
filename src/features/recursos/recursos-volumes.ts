/**
 * Catalog of the five book volumes for the /recursos/[volumen] detail pages.
 * Descriptions and SEO copy live here (es/en); per-document labels come from
 * src/data/recursos.ts and chapter outlines from src/data/recursos-outline.ts.
 */
import type { RecursoCat } from '@/data/recursos'

export interface VolumeDef {
  slug: RecursoCat
  es: { name: string; tagline: string; description: string }
  en: { name: string; tagline: string; description: string }
}

export const VOLUMES: VolumeDef[] = [
  {
    slug: 'vol1',
    es: {
      name: 'Volumen I · Tecnología de la Información (IT)',
      tagline: 'Fundamentos IT para entornos industriales',
      description:
        'Guías y plantillas de tecnología de la información aplicadas a la industria: Active Directory, hardening de servidores, VPN, migración a la nube, optimización de bases de datos e inventario de activos. La base IT que toda planta industrial necesita antes de hablar de convergencia IT/OT.',
    },
    en: {
      name: 'Volume I · Information Technology (IT)',
      tagline: 'IT foundations for industrial environments',
      description:
        'Guides and templates for information technology applied to industry: Active Directory, server hardening, VPN, cloud migration, database optimization and asset inventory. The IT foundation every industrial plant needs before IT/OT convergence.',
    },
  },
  {
    slug: 'vol2',
    es: {
      name: 'Volumen II · Tecnología de Operaciones (OT)',
      tagline: 'SCADA, PLC, RTU y DCS en el corazón de la planta',
      description:
        'Configuración de Modbus y RTUs, integración SCADA–PLC, programación Ladder, redundancia en DCS y matrices de asignación de IP y riesgos OT. El volumen que entra al piso de planta: control industrial explicado para quienes vienen de IT.',
    },
    en: {
      name: 'Volume II · Operational Technology (OT)',
      tagline: 'SCADA, PLC, RTU and DCS at the plant core',
      description:
        'Modbus and RTU configuration, SCADA–PLC integration, Ladder programming, DCS redundancy and OT IP/ risk matrices. The volume that walks the plant floor: industrial control explained for IT professionals.',
    },
  },
  {
    slug: 'vol3',
    es: {
      name: 'Volumen III · Integración IT/OT',
      tagline: 'Donde las dos puntas de la planta se encuentran',
      description:
        'Firewall industrial, gestión de cambios en OT, integración de Historian, conectividad segura entre niveles Purdue y gobernanza de datos operacionales. El puente práctico entre el mundo de la información y el del control.',
    },
    en: {
      name: 'Volume III · IT/OT Integration',
      tagline: 'Where both ends of the plant meet',
      description:
        'Industrial firewalls, OT change management, Historian integration, secure Purdue-level connectivity and operational data governance. The practical bridge between the information world and the control world.',
    },
  },
  {
    slug: 'vol4',
    es: {
      name: 'Volumen IV · Ciberseguridad Industrial',
      tagline: 'IEC 62443, defensa en profundidad y respuesta a incidentes',
      description:
        'Ciberseguridad OT de punta a punta: segmentación por zonas y conduits, hardening de control industrial, monitoreo de amenazas, plan de respuesta a incidentes y matrices de riesgo. Alineado con IEC 62443, NIST CSF y las prácticas de Oil & Gas en Vaca Muerta.',
    },
    en: {
      name: 'Volume IV · Industrial Cybersecurity',
      tagline: 'IEC 62443, defense in depth and incident response',
      description:
        'End-to-end OT security: zone-and-conduit segmentation, industrial control hardening, threat monitoring, incident response planning and risk matrices. Aligned with IEC 62443, NIST CSF and Oil & Gas practice in Vaca Muerta.',
    },
  },
  {
    slug: 'vol5',
    es: {
      name: 'Volumen V · Tendencias y Futuro',
      tagline: 'IIoT, digital twins, IA en OT e Industria 4.0',
      description:
        'Hacia dónde va la planta: implementación de IIoT, digital twins con rollback, machine learning predictivo en OT, arquitecturas IIoT y matrices de adopción y ROI de Industria 4.0. Lo que viene, evaluado con criterio de ingeniería.',
    },
    en: {
      name: 'Volume V · Trends and Future',
      tagline: 'IIoT, digital twins, AI in OT and Industry 4.0',
      description:
        'Where the plant is heading: IIoT implementation, digital twins with rollback, predictive ML in OT, IIoT architectures and Industry 4.0 adoption/ROI matrices. What comes next, evaluated with engineering rigor.',
    },
  },
]

export function volumeBySlug(slug: string): VolumeDef | undefined {
  return VOLUMES.find((v) => v.slug === slug)
}
