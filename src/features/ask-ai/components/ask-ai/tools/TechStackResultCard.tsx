'use client';

import { motion } from 'framer-motion';
import { Monitor, Server, Globe, BarChart3, AlertTriangle, Copy, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';

interface TechStackResult {
  url: string;
  server?: string;
  framework?: string;
  cdn?: string;
  analytics?: string[];
  headers: { name: string; value: string; hint: string }[];
  error?: string;
}

interface Props { result: TechStackResult }

export function TechStackResultCard({ result }: Props) {
  const [copied, setCopied] = useState(false);
  const { t } = useLanguage();

  const handleCopy = async () => {
    const lines = [`URL: ${result.url}`, `${t('tool.techstack.server')}: ${result.server || t('tool.unknown')}`];
    if (result.framework) lines.push(`${t('tool.techstack.framework')}: ${result.framework}`);
    if (result.cdn) lines.push(`${t('tool.techstack.cdn')}: ${result.cdn}`);
    if (result.analytics) lines.push(`${t('tool.techstack.analytics')}: ${result.analytics.join(', ')}`);
    await navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
      className="console rounded-xl border border-[var(--surface-border)] bg-slate-900/70 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--surface-border)]/30 bg-[var(--surface-fill-strong)]/40">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-violet-500/15 border border-violet-500/25 flex items-center justify-center">
            <Monitor className="w-3.5 h-3.5 text-violet-400" />
          </div>
          <div className="min-w-0">
            <span className="text-sm font-semibold text-[var(--text-primary)] truncate block">{result.url}</span>
            <span className="text-[10px] text-[var(--text-subtle)]">{t('tool.techstack.label')}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {result.server && <Badge variant="outline" className="h-5 text-[10px] border-[var(--surface-border-strong)] text-[var(--text-muted)] bg-[var(--surface-fill-strong)]">{result.server}</Badge>}
          {!result.error && <button onClick={handleCopy} className="h-7 w-7 rounded-md hover:bg-[var(--surface-fill-strong)] flex items-center justify-center text-[var(--text-subtle)] hover:text-[var(--text-secondary)] transition-colors" aria-label={t('tool.copy')}>{copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}</button>}
        </div>
      </div>
      {result.error ? (
        <div className="px-4 py-3 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
          <div><p className="text-xs text-red-400 font-medium">{t('tool.status.error')}</p><p className="text-xs text-red-300/70 mt-0.5">{result.error}</p></div>
        </div>
      ) : (
        <div className="p-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            {result.framework && <Badge className="h-6 text-xs bg-blue-500/15 text-blue-400 border-blue-500/25"><Server className="w-3 h-3 mr-1" />{result.framework}</Badge>}
            {result.cdn && <Badge className="h-6 text-xs bg-cyan-500/15 text-cyan-400 border-cyan-500/25"><Globe className="w-3 h-3 mr-1" />{result.cdn}</Badge>}
            {result.analytics?.map(a => <Badge key={a} className="h-6 text-xs bg-amber-500/15 text-amber-400 border-amber-500/25"><BarChart3 className="w-3 h-3 mr-1" />{a}</Badge>)}
          </div>
          {result.headers.length > 0 && (
            <div className="pt-2 border-t border-[var(--surface-border)]/30">
              <span className="text-[10px] text-[var(--text-subtle)] font-medium uppercase tracking-wider block mb-2">{t('tool.techstack.detected')} ({result.headers.length})</span>
              <div className="space-y-1">
                {result.headers.map((h, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className="text-[var(--text-secondary)] font-medium min-w-[120px]">{h.name}</span>
                    <span className="text-[var(--text-subtle)] text-[10px]">{h.hint}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
