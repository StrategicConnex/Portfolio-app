'use client'

import { motion, AnimatePresence } from 'framer-motion'
import React, { memo, useState, useMemo } from 'react'
import SectionHeader from './ui/SectionHeader'
import FadeIn from './ui/FadeIn'
import { useLanguage } from '@/context/LanguageContext'
import { 
  COMPLIANCE_MARCOS, 
  AUDIT_FINDINGS, 
  DOMAIN_HEALTH, 
  AUDIT_SUMMARY 
} from '@/data/audit'

/* ─── Sub-components ─── */

const StatCard = ({ label, value, color }: { label: string, value: string | number, color: string }) => (
  <div className="glass rounded-xl p-4 sm:p-5 flex flex-col items-center justify-center text-center transition-all duration-300 hover:border-white/20 hover:bg-white/[0.06] group">
    <div className="text-[0.6rem] sm:text-[0.65rem] text-slate-500 uppercase tracking-[0.2em] mb-1.5 group-hover:text-slate-400 transition-colors font-bold">{label}</div>
    <div className="text-2xl sm:text-3xl font-bold font-mono transition-all duration-300" style={{ color, textShadow: `0 0 20px ${color}40` }}>{value}</div>
  </div>
)

const ComplianceBar = ({ name, progress, color, descriptionKey }: { name: string, progress: number, color: string, descriptionKey: string }) => {
  const { t } = useLanguage()
  return (
    <div className="mb-6 last:mb-0 group">
      <div className="flex justify-between items-end mb-1.5 px-0.5">
        <div className="flex flex-col">
          <span className="text-[0.8rem] sm:text-[0.85rem] font-bold text-slate-200 group-hover:text-white transition-colors">{name}</span>
          <span className="text-[0.6rem] text-slate-500 uppercase tracking-tighter">{t(descriptionKey)}</span>
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
}

const HealthBar = ({ domainKey, score }: { domainKey: string, score: number }) => {
  const { t } = useLanguage()
  return (
    <div className="flex items-center gap-3 mb-3">
      <span className="text-[0.65rem] text-slate-400 w-20 flex-shrink-0 font-mono tracking-tighter uppercase">{t(domainKey)}</span>
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
}

const SeverityBadge = ({ severity }: { severity: string }) => {
  const { t } = useLanguage()
  const colors = {
    High: 'text-red-500 bg-red-500/10 border-red-500/20',
    Medium: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    Low: 'text-blue-500 bg-blue-500/10 border-blue-500/20'
  }
  
  const label = severity === 'High' ? t('audit.severity.high') : 
                severity === 'Medium' ? t('audit.severity.medium') : 
                t('audit.severity.low')

  return (
    <span className={`text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded border uppercase font-bold tracking-wider ${colors[severity as keyof typeof colors]}`}>
      {label}
    </span>
  )
}

const StatusBadge = ({ status }: { status: string }) => {
  const { t } = useLanguage()
  const isDone = status === 'Remediated'
  const label = status === 'Remediated' ? t('audit.status.remediated') : 
                status === 'In Progress' ? t('audit.status.in_progress') : 
                t('audit.status.planned')

  return (
    <span className={`text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded-full border flex items-center gap-1 font-mono ${
      isDone ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' : 'text-slate-400 bg-white/5 border-white/10 italic'
    }`}>
      {isDone && <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />}
      {label}
    </span>
  )
}

const AuditHub = () => {
  const { t } = useLanguage()
  const [activeTab, setActiveTab] = useState<'compliance' | 'findings'>('compliance')
  const [severityFilter, setSeverityFilter] = useState<string>('All')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filteredFindings = useMemo(() => {
    return AUDIT_FINDINGS.filter(f => severityFilter === 'All' || f.severity === severityFilter)
  }, [severityFilter])

  return (
    <section id="audit-hub" className="py-24 sm:py-32 relative overflow-hidden">
      {/* Background FX */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#3B82F640] to-transparent" />
      <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#3B82F620] to-transparent" />

      <div className="container px-4 mx-auto max-w-7xl">
        <FadeIn>
          <SectionHeader 
            label={t('audit.label')} 
            title={t('audit.title')} 
            highlight={t('audit.highlight')} 
            center={false}
          />
        </FadeIn>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 mt-12 sm:mt-16">
          
          {/* ─── Column 1: Summary Stats (Vertical on big screen, horizontal on small) ─── */}
          <div className="xl:col-span-3 grid grid-cols-2 xl:grid-cols-1 gap-4 order-2 xl:order-1">
            <StatCard label={t('audit.stats.controls')} value={`${AUDIT_SUMMARY.passed}/${AUDIT_SUMMARY.totalControls}`} color="#3B82F6" />
            <StatCard label={t('audit.stats.risk_gap')} value={`${Math.round(((AUDIT_SUMMARY.totalControls - AUDIT_SUMMARY.passed) / AUDIT_SUMMARY.totalControls) * 100)}%`} color="#EF4444" />
            <StatCard label={t('audit.stats.next_cycle')} value={AUDIT_SUMMARY.nextAuditDate} color="#8B5CF6" />
            <StatCard label={t('audit.stats.global_compliance')} value={`${Math.round(COMPLIANCE_MARCOS.reduce((a, b) => a + b.progress, 0) / COMPLIANCE_MARCOS.length)}%`} color="#10B981" />
          </div>

          {/* ─── Column 2: Main Console ─── */}
          <div className="xl:col-span-9 order-1 xl:order-2">
            <div className="glass scanline-container rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-2xl">
              
              {/* Console Header / Tabs */}
              <div className="flex border-b border-white/10 bg-white/5">
                <button 
                  onClick={() => setActiveTab('compliance')}
                  className={`flex-1 sm:flex-none px-6 py-4 text-[0.7rem] sm:text-[0.75rem] font-bold tracking-[2px] uppercase transition-all relative ${
                    activeTab === 'compliance' ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {t('audit.tab.compliance')}
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
                  {t('audit.tab.findings')}
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
                        {t('audit.ui.monitoring')}
                      </div>
                      {COMPLIANCE_MARCOS.map((marco, i) => (
                        <ComplianceBar key={i} {...marco} />
                      ))}
                    </div>

                    {/* Domain Health */}
                    <div className="lg:col-span-5 bg-white/[0.02] border border-white/5 rounded-xl p-5 sm:p-6">
                      <div className="text-[0.65rem] text-slate-400 font-bold uppercase tracking-[2px] mb-8 border-b border-white/10 pb-3 flex justify-between">
                        {t('audit.ui.health_by_domain')}
                        <span className="text-blue-500 opacity-60">{t('audit.ui.score')}</span>
                      </div>
                      <div className="space-y-6">
                        {DOMAIN_HEALTH.map((domain, i) => (
                          <HealthBar key={i} {...domain} />
                        ))}
                      </div>
                      <div className="mt-8 p-3 rounded bg-blue-500/5 border border-blue-500/10 text-[0.68rem] text-blue-200/60 leading-relaxed font-mono">
                        {t('audit.ui.metric_note')}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Filter Controls */}
                    <div className="flex flex-wrap gap-3 items-center pb-4 border-b border-white/5">
                      <span className="text-[0.65rem] text-slate-500 uppercase tracking-widest font-bold mr-2">{t('audit.ui.filter_severity')}</span>
                      {['All', 'High', 'Medium', 'Low'].map((s) => (
                        <button
                          key={s}
                          onClick={() => setSeverityFilter(s)}
                          className={`px-3 py-1 rounded-full text-[0.65rem] font-bold uppercase tracking-tighter transition-all border ${
                            severityFilter === s 
                              ? 'bg-blue-600 border-blue-500 text-white shadow-[0_0_10px_rgba(37,99,235,0.4)]' 
                              : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                          }`}
                        >
                          {s === 'All' ? t('audit.severity.all') : s === 'High' ? t('audit.severity.high') : s === 'Medium' ? t('audit.severity.medium') : t('audit.severity.low')}
                        </button>
                      ))}
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[750px] text-left border-separate border-spacing-y-2">
                        <thead>
                          <tr className="text-[0.65rem] text-slate-500 uppercase tracking-widest font-bold">
                            <th className="px-4 pb-2">{t('audit.ui.report')}</th>
                            <th className="px-4 pb-2">{t('audit.ui.severity')}</th>
                            <th className="px-4 pb-2">{t('audit.ui.status')}</th>
                            <th className="px-4 pb-2">{t('audit.ui.control_asset')}</th>
                            <th className="px-4 pb-2 text-right">{t('audit.ui.action')}</th>
                          </tr>
                        </thead>
                        <motion.tbody layout>
                          <AnimatePresence mode="popLayout">
                            {filteredFindings.map((finding) => (
                              <React.Fragment key={finding.id}>
                                <motion.tr 
                                  layout
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.95 }}
                                  onClick={() => setExpandedId(expandedId === finding.id ? null : finding.id)}
                                  className={`group cursor-pointer transition-colors ${expandedId === finding.id ? 'bg-blue-500/5' : 'hover:bg-white/5'}`}
                                >
                                  <td className="px-4 py-4 bg-white/5 rounded-l-lg border-y border-l border-white/10">
                                    <div className="text-[0.7rem] font-mono text-slate-400">{finding.id}</div>
                                  </td>
                                  <td className="px-4 py-4 bg-white/5 border-y border-white/10">
                                    <SeverityBadge severity={finding.severity} />
                                  </td>
                                  <td className="px-4 py-4 bg-white/5 border-y border-white/10">
                                    <StatusBadge status={finding.status} />
                                  </td>
                                  <td className="px-4 py-4 bg-white/5 border-y border-white/10">
                                    <div className="text-[0.75rem] font-bold text-slate-200">{finding.control}</div>
                                    <div className="text-[0.65rem] text-slate-500 line-clamp-1 italic">{t(finding.descriptionKey)}</div>
                                  </td>
                                  <td className="px-4 py-4 bg-white/5 rounded-r-lg border-y border-r border-white/10 text-right">
                                    <button className="text-[0.65rem] text-blue-400 font-bold uppercase tracking-tighter hover:text-blue-300 transition-colors">
                                      {expandedId === finding.id ? t('audit.ui.close') : t('audit.ui.details')}
                                    </button>
                                  </td>
                                </motion.tr>

                                {/* Expanded Detail Panel */}
                                <AnimatePresence>
                                  {expandedId === finding.id && (
                                    <motion.tr
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: 'auto' }}
                                      exit={{ opacity: 0, height: 0 }}
                                      className="bg-blue-500/5 overflow-hidden"
                                    >
                                      <td colSpan={5} className="px-8 py-6 rounded-lg border-x border-b border-blue-500/20 bg-blue-500/[0.03] backdrop-blur-md">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                          <div className="space-y-4">
                                            <div>
                                              <h4 className="text-[0.65rem] text-blue-400 uppercase tracking-widest font-bold mb-2">{t('audit.ui.impact')}</h4>
                                              <p className="text-[0.8rem] text-slate-300 leading-relaxed font-medium">
                                                {t(finding.impactKey)}
                                              </p>
                                            </div>
                                            <div>
                                              <h4 className="text-[0.65rem] text-emerald-400 uppercase tracking-widest font-bold mb-2">{t('audit.ui.remediation_plan')}</h4>
                                              <p className="text-[0.8rem] text-slate-300 leading-relaxed">
                                                {t(finding.remediationKey)}
                                              </p>
                                            </div>
                                          </div>
                                          <div className="space-y-4">
                                            <div className="bg-black/40 rounded-lg p-4 border border-white/5">
                                              <h4 className="text-[0.6rem] text-slate-500 uppercase tracking-widest font-bold mb-3 flex justify-between">
                                                {t('audit.ui.technical_evidence')}
                                                <span className="text-blue-500 font-mono tracking-normal">{finding.timestamp}</span>
                                              </h4>
                                              <code className="text-[0.7rem] text-blue-200/80 font-mono leading-tight block break-all">
                                                {finding.evidence || '> No additional log metadata captured for this entry.'}
                                              </code>
                                            </div>
                                            <div className="flex gap-4 pt-2">
                                              <div className="flex flex-col">
                                                <span className="text-[0.6rem] text-slate-500 uppercase">{t('audit.ui.owner')}</span>
                                                <span className="text-[0.7rem] text-slate-300 font-bold">IT/OT Security Architect</span>
                                              </div>
                                              <div className="flex flex-col">
                                                <span className="text-[0.6rem] text-slate-500 uppercase">{t('audit.ui.reference')}</span>
                                                <span className="text-[0.7rem] text-slate-300 font-bold">NIST-PR.AC-1</span>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </td>
                                    </motion.tr>
                                  )}
                                </AnimatePresence>
                              </React.Fragment>
                            ))}
                          </AnimatePresence>
                        </motion.tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Console Footer */}
              <div className="px-8 py-4 bg-white/5 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-[0.65rem] text-slate-500 font-mono">
                  {t('audit.ui.last_review')}: <span className="text-slate-300">FEBRERO 2024</span> | {t('audit.ui.analyst')}: <span className="text-slate-300 uppercase">System Architect</span>
                </div>
                <div className="flex gap-4">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-[0.65rem] text-slate-400 font-bold uppercase tracking-tighter">{t('audit.ui.operational_compliance')}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]" />
                    <span className="text-[0.65rem] text-slate-400 font-bold uppercase tracking-tighter">{t('audit.ui.integrated_strategy')}</span>
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
