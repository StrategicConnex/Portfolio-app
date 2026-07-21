'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
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

const courseFiles = [
  { filename: "Bootcamp 2026 IA Generativa, LLm Apps, Aagentes IA, Cursor IA.pdf", name: "Bootcamp 2026 IA Generativa, LLm Apps, Agentes IA, Cursor IA" },
  { filename: "CertificadoDeFinalizacion_Analisis estrategico de implementacion IA.pdf", name: "Análisis estratégico de implementación IA" },
  { filename: "CertificadoDeFinalizacion_Aprovechar la IA generativa para la gestion de proyectos.pdf", name: "Aprovechar la IA generativa para la gestión de proyectos" },
  { filename: "CertificadoDeFinalizacion_Azure Machine learning e inteligencia artificial esencial.pdf", name: "Azure Machine learning e inteligencia artificial esencial" },
  { filename: "CertificadoDeFinalizacion_Bash Automatizaciones para ciberseguridad.pdf", name: "Bash Automatizaciones para ciberseguridad" },
  { filename: "CertificadoDeFinalizacion_Creacion de documentacion tecnica con herramientas de IA.pdf", name: "Creación de documentación técnica con herramientas de IA" },
  { filename: "CertificadoDeFinalizacion_Explora una carrera como especialista en Power BI.pdf", name: "Explora una carrera como especialista en Power BI" },
  { filename: "CertificadoDeFinalizacion_Graficos y funcionalidades de analitica avanzada en Power BI.pdf", name: "Gráficos y funcionalidades de analítica avanzada en Power BI" },
  { filename: "CertificadoDeFinalizacion_Power BI avanzado (1).pdf", name: "Power BI avanzado (1)" },
  { filename: "CertificadoDeFinalizacion_Power BI avanzado.pdf", name: "Power BI avanzado" },
  { filename: "certificado_comescrita.pdf", name: "Comunicación Escrita" },
  { filename: "certificado_comoral.pdf", name: "Comunicación Oral" },
  { filename: "certificado_epp.pdf", name: "Equipos de Protección Personal (EPP)" },
  { filename: "certificado_equipo.pdf", name: "Trabajo en Equipo" },
  { filename: "certificado_feedback.pdf", name: "Feedback y Retroalimentación" },
  { filename: "certificado_incendios.pdf", name: "Prevención de Incendios" },
  { filename: "certificado_nego.pdf", name: "Negociación" },
  { filename: "Cisco Cibersecurity Analyst Career Path.pdf", name: "Cisco Cibersecurity Analyst Career Path" },
  { filename: "Cisco Networking Academy_ Defensa de la red.pdf", name: "Cisco Networking Academy: Defensa de la red" },
  { filename: "Cisco_Juan Palacios_1 001.pdf", name: "Cisco Networking Academy (1)" },
  { filename: "Cisco_Juan Palacios_2 001.pdf", name: "Cisco Networking Academy (2)" },
  { filename: "Cisco_Juan Palacios_3 002.pdf", name: "Cisco Networking Academy (3)" },
  { filename: "Fortinet 7.X.pdf", name: "Fortinet 7.X" },
  { filename: "NetworkDefenseUpdate20260115-31-31nq15.pdf", name: "Network Defense Update" },
  { filename: "Network_Defense_certificate_palacios_juan-hotmail-com_698c5580-3283-4714-9254-e12fe9da6f29.pdf", name: "Network Defense Certificate" },
  { filename: "Python - Power BI - SQl Server Machine Learning.pdf", name: "Python - Power BI - SQl Server Machine Learning" },
  { filename: "UC-096eca38-57c6-4247-bd30-c04ecfc38651.jpg", name: "Certificado Udemy" },
  { filename: "UC-80e60bec-8955-488a-8c59-13a977cac370.jpg", name: "Certificado Udemy" },
  { filename: "UC-846a9eac-34fa-4d81-bb85-da06786bb807.jpg", name: "Certificado Udemy" },
  { filename: "UC-a31cd8c3-da0c-4789-8e06-22e7acd40d17.jpg", name: "Certificado Udemy" },
  { filename: "UC-a31cd8c3-da0c-4789-8e06-22e7acd40d17.pdf", name: "Certificado Udemy" },
  { filename: "UC-a8acf70b-7d83-47e4-9a8d-74dc6945094f.pdf", name: "Certificado Udemy" }
]

export default function Certificaciones() {
  const { t } = useLanguage()
  const ref    = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
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
          <motion.h3 
            initial={{ opacity: 0, y: 10 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-lg font-semibold text-white mb-6 flex items-center gap-2"
          >
            <Icon name="document" label="Cursos y Certificados" size={20} />
            Cursos y Certificados
          </motion.h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {courseFiles.map((c, i) => {
              const isPdf = c.filename.toLowerCase().endsWith('.pdf');
              return (
                <motion.a
                  key={i}
                  href={`/cursos/${c.filename}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={inView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ duration: 0.4, delay: (i % 8) * 0.05 + 0.5 }}
                  whileHover={{ y: -4, borderColor: 'rgba(197,164,109,0.5)' }}
                  className="group flex flex-col p-4 rounded-xl cursor-pointer"
                  style={{
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    transition: 'all 0.2s ease-in-out',
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
                </motion.a>
              )
            })}
          </div>
        </div>

      </div>
    </section>
  )
}
