'use client';

import { motion } from 'framer-motion';
import { Globe, Server, AlertTriangle, Copy, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { DnsResult } from '@/lib/ask-ai/tools/dns-analyzer';
import { useState } from 'react';

interface Props {
  result: DnsResult;
}

const RECORD_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  A: { bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/25' },
  AAAA: { bg: 'bg-indigo-500/15', text: 'text-indigo-400', border: 'border-indigo-500/25' },
  MX: { bg: 'bg-purple-500/15', text: 'text-purple-400', border: 'border-purple-500/25' },
  TXT: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/25' },
  NS: { bg: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/25' },
  CNAME: { bg: 'bg-cyan-500/15', text: 'text-cyan-400', border: 'border-cyan-500/25' },
};

export function DnsResultCard({ result }: Props) {
  const [copied, setCopied] = useState(false);
  const hasRecords = result.records.length > 0;

  const handleCopy = async () => {
    const text = result.records
      .map((r) => `[${r.type}]\n${r.values.join('\n')}`)
      .join('\n\n');
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="console rounded-xl border border-[var(--surface-border)] bg-slate-900/70 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--surface-border)]/30 bg-[var(--surface-fill-strong)]/40">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-500/15 border border-blue-500/25 flex items-center justify-center">
            <Globe className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div>
            <span className="text-sm font-semibold text-[var(--text-primary)]">{result.domain}</span>
            <span className="text-[10px] text-[var(--text-subtle)] ml-2">DNS Records</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {result.records.map((r) => (
              <Badge
                key={r.type}
                variant="outline"
                className={`h-5 text-[10px] font-mono font-semibold px-1.5 border ${
                  RECORD_COLORS[r.type]?.border || 'border-[var(--surface-border-strong)]'
                } ${RECORD_COLORS[r.type]?.text || 'text-[var(--text-muted)]'} ${
                  RECORD_COLORS[r.type]?.bg || 'bg-[var(--surface-fill-strong)]'
                }`}
              >
                {r.type}
              </Badge>
            ))}
          </div>
          {hasRecords && (
            <button
              onClick={handleCopy}
              className="h-7 w-7 rounded-md hover:bg-[var(--surface-fill-strong)] flex items-center justify-center text-[var(--text-subtle)] hover:text-[var(--text-secondary)] transition-colors"
              aria-label="Copy DNS records"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Error state */}
      {result.error && (
        <div className="px-4 py-3 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs text-red-400 font-medium">Error</p>
            <p className="text-xs text-red-300/70 mt-0.5">{result.error}</p>
          </div>
        </div>
      )}

      {/* Records */}
      {hasRecords ? (
        <div className="divide-y divide-slate-700/20">
          {result.records.map((record) => {
            const colors = RECORD_COLORS[record.type];
            return (
              <div key={record.type} className="px-4 py-2.5 hover:bg-[var(--surface-fill-strong)]/30 transition-colors">
                <div className="flex items-center gap-2 mb-1.5">
                  <Badge
                    variant="outline"
                    className={`h-5 text-[10px] font-mono font-semibold px-1.5 border ${
                      colors?.border || 'border-[var(--surface-border-strong)]'
                    } ${colors?.text || 'text-[var(--text-muted)]'} ${
                      colors?.bg || 'bg-[var(--surface-fill-strong)]'
                    }`}
                  >
                    {record.type}
                  </Badge>
                  <span className="text-[10px] text-[var(--text-faint)]">
                    {record.values.length} value{record.values.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="space-y-0.5">
                  {record.values.map((val, i) => (
                    <div
                      key={i}
                      className="text-xs font-mono text-[var(--text-muted)] pl-2.5 border-l-2 border-[var(--surface-border)] py-0.5 truncate hover:text-[var(--text-secondary)] transition-colors"
                      title={val}
                    >
                      {val}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : !result.error && (
        <div className="px-4 py-6 text-center">
          <Server className="w-5 h-5 text-[var(--text-faint)] mx-auto mb-2" />
          <p className="text-xs text-[var(--text-subtle)]">No DNS records found for this domain</p>
        </div>
      )}
    </motion.div>
  );
}
