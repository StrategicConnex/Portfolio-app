'use client'

import { motion } from 'framer-motion'
import { memo, useState } from 'react'
import SectionHeader from './ui/SectionHeader'
import FadeIn from './ui/FadeIn'
import { 
  COMPLIANCE_MARCOS, 
  AUDIT_FINDINGS, 
  DOMAIN_HEALTH, 
  AUDIT_SUMMARY 
} from '@/data/audit'

/* ─── Sub-components ─── */

const StatCard = ({ label, value, color }: { label: string, value: string | number, color: string }) => (
  <div className="bg-[#0A1628]/40 border border-white/5 rounded-lg p-3 sm:p-4 flex flex-col items-center justify-center text-center">
    <div className="text-[0.6rem] sm:text-[0.65rem] text-slate-400 uppercase tracking-widest mb-1">{label}</div>
    <div className="text-xl sm:text-2xl font-bold font-mono transition-all duration-300" style={{ color }}>{value}</div>
  </div>
)

const ComplianceBar = ({ name, progress, color, description }: typeof COMPLIANCE_MARCOS[0]) => (
  <div className="mb-6 last:mb-0 group">
    <div className="flex justify-between items-end mb-1.5 px-0.5">
      <div className="flex flex-col">
        <span className="text-[0.8rem] sm:text-[0.85rem] font-bold text-slate-200 group-hover:text-white transition-colors">{name}</span>
        <span className="text-[0.6rem] text-slate-500 uppercase tracking-tighter">{description}</span>
      </div>
      <span className="text-[0.75rem] font-mono font-bold" style={{ color }}>{progress}%</span>
    </div>
    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
      <motion.div
        initial={{ width: 0 }}
        whileInView={{ width: `${progress}%` }}
        transition={{ duration: 1.5, ease: 'easeOut' }}
        viewport={{ once: true }}
        className="h-full rounded-full"
        style={{ backgroundColor: color, boxShadow: `0 0 12px ${color}40` }}
      />
    </div>
  </div>
)

const HealthBar = ({ domain, score }: typeof DOMAIN_HEALTH[0]) => (
  <div className="flex items-center gap-3 mb-3">
    <span className="text-[0.65rem] text-slate-400 w-20 flex-shrink-0 font-mono tracking-tighter uppercase">{domain}</span>
    <div className="flex-1 flex gap-0.5 h-2">
      {Array.from({ length: 10 }).map((_, i) => (
        <div 
          key={i} 
          className={`h-full flex-1 rounded-sm transition-all duration-500 ${
            i < Math.round(score / 10) ? 'bg-[#3B82F6]' : 'bg-white/5'
          }`}
          style={{ 
            opacity: i < Math.round(score / 10) ? 0.3 + (i * 0.07) : 0.2,
            boxShadow: i < Math.round(score / 10) ? '0 0 4px #3B82F640' : 'none'
          }}
        />
      ))}
    </div>
    <span className="text-[0.7rem] font-mono text-slate-500 w-8 text-right underline underline-offset-4 decoration-slate-700">{score}</span>
  </div>
)

const SeverityBadge = ({ severity }: { severity: string }) => {
  const colors = {
    High: 'text-red-500 bg-red-500/10 border-red-500/20',
    Medium: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    Low: 'text-blue-500 bg-blue-500/10 border-blue-500/20'
  }
  return (
    <span className={`text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded border uppercase font-bold tracking-wider ${colors[severity as keyof typeof colors]}`}>
      {severity}
    </span>
  )
}

const StatusBadge = ({ status }: { status: string }) => {
  const isDone = status === 'Remediated'
  return (
    <span className={`text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded-full border flex items-center gap-1 font-mono ${
      isDone ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' : 'text-slate-400 bg-white/5 border-white/10 italic'
    }`}>
      {isDone && <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />}
      {status}
    </span>
  )
}

const AuditHub = () => {
  const [activeTab, setActiveTab] = useState<'compliance' | 'findings'>('compliance')

  return (
    <section id="audit-hub" className="py-24 sm:py-32 relative overflow-hidden">
      {/* Background FX */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#3B82F640] to-transparent" />
      <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#3B82F620] to-transparent" />

      <div className="container px-4 mx-auto max-w-7xl">
        <FadeIn>
          <SectionHeader 
            label="CUMPLIMIENTO ESTRATÉGICO Y GESTIÓN DE RIESGOS" 
            title="Governance & Audit Hub" 
            center={false}
          />
        </FadeIn>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 mt-12 sm:mt-16">
          
          {/* ─── Column 1: Summary Stats (Vertical on big screen, horizontal on small) ─── */}
          <div className="xl:col-span-3 grid grid-cols-2 xl:grid-cols-1 gap-4 order-2 xl:order-1">
            <StatCard label="Controles Validados" value={`${AUDIT_SUMMARY.passed}/${AUDIT_SUMMARY.totalControls}`} color="#3B82F6" />
            <StatCard label="Brecha de Riesgo" value={`${Math.round(((AUDIT_SUMMARY.totalControls - AUDIT_SUMMARY.passed) / AUDIT_SUMMARY.totalControls) * 100)}%`} color="#EF4444" />
            <StatCard label="Próximo Ciclo" value={AUDIT_SUMMARY.nextAuditDate} color="#8B5CF6" />
            <StatCard label="Compliance Global" value={`${Math.round(COMPLIANCE_MARCOS.reduce((a, b) => a + b.progress, 0) / COMPLIANCE_MARCOS.length)}%`} color="#10B981" />
          </div>

          {/* ─── Column 2: Main Console ─── */}
          <div className="xl:col-span-9 order-1 xl:order-2">
            <div className="bg-[#070D18] border border-white/10 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl">
              
              {/* Console Header / Tabs */}
              <div className="flex border-b border-white/10 bg-white/5">
                <button 
                  onClick={() => setActiveTab('compliance')}
                  className={`flex-1 sm:flex-none px-6 py-4 text-[0.7rem] sm:text-[0.75rem] font-bold tracking-[2px] uppercase transition-all relative ${
                    activeTab === 'compliance' ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  ESTADO DE CUMPLIMIENTO
                  {activeTab === 'compliance' && (
                    <motion.div layoutId="tab-active" className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500" />
                  )}
                </button>
                <button 
                  onClick={() => setActiveTab('findings')}
                  className={`flex-1 sm:flex-none px-6 py-4 text-[0.7rem] sm:text-[0.75rem] font-bold tracking-[2px] uppercase transition-all relative ${
                    activeTab === 'findings' ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  HALLAZGOS DE AUDITORÍA
                  {activeTab === 'findings' && (
                    <motion.div layoutId="tab-active" className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500" />
                  )}
                </button>
              </div>

              <div className="p-4 sm:p-8 min-h-[440px]">
                {activeTab === 'compliance' ? (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
                    {/* Marcos Detail */}
                    <div className="lg:col-span-7">
                      <div className="text-[0.65rem] text-blue-500 font-mono mb-6 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                        MONITOREO DE MARCOS REGULATORIOS
                      </div>
                      {COMPLIANCE_MARCOS.map((marco, i) => (
                        <ComplianceBar key={i} {...marco} />
                      ))}
                    </div>

                    {/* Domain Health */}
                    <div className="lg:col-span-5 bg-white/[0.02] border border-white/5 rounded-xl p-5 sm:p-6">
                      <div className="text-[0.65rem] text-slate-400 font-bold uppercase tracking-[2px] mb-8 border-b border-white/10 pb-3 flex justify-between">
                        SALUD POR DOMINIO
                        <span className="text-blue-500 opacity-60">SCORE</span>
                      </div>
                      <div className="space-y-6">
                        {DOMAIN_HEALTH.map((domain, i) => (
                          <HealthBar key={i} {...domain} />
                        ))}
                      </div>
                      <div className="mt-8 p-3 rounded bg-blue-500/5 border border-blue-500/10 text-[0.68rem] text-blue-200/60 leading-relaxed font-mono">
                        * Métrica basada en la efectividad operativa de los controles implementados en Nivel 0-3.
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px] text-left border-separate border-spacing-y-3">
                      <thead>
                        <tr className="text-[0.65rem] text-slate-500 uppercase tracking-widest font-bold">
                          <th className="px-4 pb-2">ID Reporte</th>
                          <th className="px-4 pb-2">Severidad</th>
                          <th className="px-4 pb-2">Estado</th>
                          <th className="px-4 pb-2">Control OT / Activo</th>
                          <th className="px-4 pb-2">Remediación Implementada</th>
                        </tr>
                      </thead>
                      <tbody>
                        {AUDIT_FINDINGS.map((finding) => (
                          <tr key={finding.id} className="group h-16">
                            <td className="px-4 bg-white/5 rounded-l-lg border-y border-l border-white/10 group-hover:bg-white/[0.08] transition-colors">
                              <div className="text-[0.75rem] font-mono text-slate-400">{finding.id}</div>
                            </td>
                            <td className="px-4 bg-white/5 border-y border-white/10 group-hover:bg-white/[0.08] transition-colors">
                              <SeverityBadge severity={finding.severity} />
                            </td>
                            <td className="px-4 bg-white/5 border-y border-white/10 group-hover:bg-white/[0.08] transition-colors">
                              <StatusBadge status={finding.status} />
                            </td>
                            <td className="px-4 bg-white/5 border-y border-white/10 group-hover:bg-white/[0.08] transition-colors">
                              <div className="text-[0.75rem] font-bold text-slate-200">{finding.control}</div>
                              <div className="text-[0.65rem] text-slate-500 line-clamp-1 italic">{finding.description}</div>
                            </td>
                            <td className="px-4 bg-white/5 border-y border-r border-white/10 rounded-r-lg group-hover:bg-white/[0.08] transition-colors">
                              <div className="text-[0.7rem] leading-relaxed text-blue-200/70 max-w-xs">{finding.remediation}</div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Console Footer */}
              <div className="px-8 py-4 bg-white/5 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-[0.65rem] text-slate-500 font-mono">
                  ÚLTIMA REVISIÓN: <span className="text-slate-300">FEBRERO 2024</span> | ANALISTA: <span className="text-slate-300 uppercase">System Architect</span>
                </div>
                <div className="flex gap-4">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-[0.65rem] text-slate-400 font-bold uppercase tracking-tighter">Cumplimiento Operativo</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]" />
                    <span className="text-[0.65rem] text-slate-400 font-bold uppercase tracking-tighter">Estrategia Integrada</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default memo(AuditHub)
