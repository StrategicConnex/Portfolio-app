'use client';

import { motion } from 'framer-motion';
import { Shield, ShieldCheck, ShieldAlert, AlertTriangle, Copy, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';

export interface PortInfo {
  port: number;
  protocol: 'TCP' | 'UDP';
  service: string;
  description: string;
  risk: 'low' | 'medium' | 'high' | 'critical';
  recommendation: string;
}

export interface PortAnalyzerResult {
  service: string;
  ports: PortInfo[];
  error?: string;
}

interface Props { result: PortAnalyzerResult }

const RISK_COLORS: Record<string, { bg: string; text: string; border: string; icon: typeof Shield }> = {
  low: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/25', icon: ShieldCheck },
  medium: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/25', icon: ShieldAlert },
  high: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/25', icon: ShieldAlert },
  critical: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/25', icon: ShieldAlert },
};

export function PortAnalyzerResultCard({ result }: Props) {
  const [copied, setCopied] = useState(false);
  const { t } = useLanguage();

  const handleCopy = async () => {
    const lines = [`${t('tool.service')}: ${result.service}`];
    for (const p of result.ports) {
      lines.push(`${p.port}/${p.protocol} - ${p.service} [${p.risk.toUpperCase()}]`);
    }
    await navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const portLabel = result.ports.length === 1 ? `${result.ports.length} ${t('tool.port.port')}` : `${result.ports.length} ${t('tool.port.ports')}`;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
      className="console rounded-xl border border-[var(--surface-border)] bg-slate-900/70 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--surface-border)]/30 bg-[var(--surface-fill-strong)]/40">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-rose-500/15 border border-rose-500/25 flex items-center justify-center">
            <Shield className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div><span className="text-sm font-semibold text-[var(--text-primary)]">{result.service}</span><span className="text-[10px] text-[var(--text-subtle)] ml-2">{t('tool.port.label')}</span></div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="h-5 text-[10px] border-[var(--surface-border-strong)] text-[var(--text-muted)] bg-[var(--surface-fill-strong)]">{portLabel}</Badge>
          {!result.error && <button onClick={handleCopy} className="h-7 w-7 rounded-md hover:bg-[var(--surface-fill-strong)] flex items-center justify-center text-[var(--text-subtle)] hover:text-[var(--text-secondary)] transition-colors" aria-label={t('tool.copy')}>{copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}</button>}
        </div>
      </div>
      {result.error ? (
        <div className="px-4 py-3 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
          <div><p className="text-xs text-red-400 font-medium">{t('tool.status.error')}</p><p className="text-xs text-red-300/70 mt-0.5">{result.error}</p></div>
        </div>
      ) : (
        <div className="divide-y divide-slate-700/20">
          {result.ports.map((p, i) => {
            const colors = RISK_COLORS[p.risk] || RISK_COLORS.low;
            const Icon = colors.icon;
            return (
              <div key={i} className="px-4 py-3 hover:bg-[var(--surface-fill-strong)]/30 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="h-6 text-xs font-mono font-semibold border-[var(--surface-border-strong)] text-[var(--text-secondary)] bg-[var(--surface-fill-strong)]">{p.port}/{p.protocol}</Badge>
                    <span className="text-xs font-medium text-[var(--text-secondary)]">{p.service}</span>
                  </div>
                  <Badge variant="outline" className={`h-5 text-[10px] gap-1 border ${colors.border} ${colors.text} ${colors.bg}`}>
                    <Icon className="w-2.5 h-2.5" />{p.risk.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-[10px] text-[var(--text-subtle)] mb-1.5">{p.description}</p>
                <div className="flex items-start gap-1.5">
                  <AlertTriangle className="w-3 h-3 text-amber-500 mt-0.5 flex-shrink-0" />
                  <p className="text-[10px] text-amber-300/80">{p.recommendation}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
