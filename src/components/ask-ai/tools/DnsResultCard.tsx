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
      className="rounded-xl border border-slate-700/50 bg-slate-900/70 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/30 bg-slate-800/40">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-500/15 border border-blue-500/25 flex items-center justify-center">
            <Globe className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div>
            <span className="text-sm font-semibold text-slate-100">{result.domain}</span>
            <span className="text-[10px] text-slate-500 ml-2">DNS Records</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {result.records.map((r) => (
              <Badge
                key={r.type}
                variant="outline"
                className={`h-5 text-[10px] font-mono font-semibold px-1.5 border ${
                  RECORD_COLORS[r.type]?.border || 'border-slate-600'
                } ${RECORD_COLORS[r.type]?.text || 'text-slate-400'} ${
                  RECORD_COLORS[r.type]?.bg || 'bg-slate-800'
                }`}
              >
                {r.type}
              </Badge>
            ))}
          </div>
          {hasRecords && (
            <button
              onClick={handleCopy}
              className="h-7 w-7 rounded-md hover:bg-slate-700/50 flex items-center justify-center text-slate-500 hover:text-slate-300 transition-colors"
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
              <div key={record.type} className="px-4 py-2.5 hover:bg-slate-800/30 transition-colors">
                <div className="flex items-center gap-2 mb-1.5">
                  <Badge
                    variant="outline"
                    className={`h-5 text-[10px] font-mono font-semibold px-1.5 border ${
                      colors?.border || 'border-slate-600'
                    } ${colors?.text || 'text-slate-400'} ${
                      colors?.bg || 'bg-slate-800'
                    }`}
                  >
                    {record.type}
                  </Badge>
                  <span className="text-[10px] text-slate-600">
                    {record.values.length} value{record.values.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="space-y-0.5">
                  {record.values.map((val, i) => (
                    <div
                      key={i}
                      className="text-xs font-mono text-slate-400 pl-2.5 border-l-2 border-slate-700/50 py-0.5 truncate hover:text-slate-300 transition-colors"
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
          <Server className="w-5 h-5 text-slate-600 mx-auto mb-2" />
          <p className="text-xs text-slate-500">No DNS records found for this domain</p>
        </div>
      )}
    </motion.div>
  );
}
