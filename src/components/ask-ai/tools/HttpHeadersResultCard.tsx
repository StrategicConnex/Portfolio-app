'use client';

import { motion } from 'framer-motion';
import { Shield, ShieldCheck, ShieldAlert, AlertTriangle, Copy, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';

interface HeaderResult {
  header: string;
  name: string;
  value: string;
  present: boolean;
  description: string;
}

interface HttpHeadersResult {
  url: string;
  status: number;
  headers: HeaderResult[];
  server?: string;
  contentType?: string;
  otherNotable: { header: string; value: string }[];
  error?: string;
}

interface Props {
  result: HttpHeadersResult;
}

export function HttpHeadersResultCard({ result }: Props) {
  const [copied, setCopied] = useState(false);

  const presentCount = result.headers.filter((h) => h.present).length;
  const totalCount = result.headers.length;
  const score = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

  const getScoreColor = () => {
    if (score >= 70) return 'text-emerald-400';
    if (score >= 40) return 'text-amber-400';
    return 'text-red-400';
  };

  const getScoreBg = () => {
    if (score >= 70) return 'bg-emerald-500/10 border-emerald-500/25';
    if (score >= 40) return 'bg-amber-500/10 border-amber-500/25';
    return 'bg-red-500/10 border-red-500/25';
  };

  const handleCopy = async () => {
    const text = [
      `URL: ${result.url}`,
      `Status: ${result.status}`,
      `Security Score: ${score}%`,
      '',
      'Security Headers:',
      ...result.headers.map(
        (h) => `  ${h.present ? '✓' : '✗'} ${h.name}: ${h.value || '(missing)'}`,
      ),
      ...(result.otherNotable.length > 0
        ? ['', 'Other Notable:', ...result.otherNotable.map((h) => `  ${h.header}: ${h.value}`)]
        : []),
    ].join('\n');
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
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/15 border border-cyan-500/25 flex items-center justify-center flex-shrink-0">
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="min-w-0">
            <span className="text-sm font-semibold text-slate-100 truncate block">
              {result.url}
            </span>
            <span className="text-[10px] text-slate-500">HTTP Security Headers</span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {result.server && (
            <Badge variant="outline" className="h-5 text-[10px] border-slate-600 text-slate-400 bg-slate-800">
              {result.server}
            </Badge>
          )}
          {!result.error && (
            <button
              onClick={handleCopy}
              className="h-7 w-7 rounded-md hover:bg-slate-700/50 flex items-center justify-center text-slate-500 hover:text-slate-300 transition-colors"
              aria-label="Copy headers analysis"
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
            <p className="text-xs text-red-400 font-medium">Connection Error</p>
            <p className="text-xs text-red-300/70 mt-0.5">{result.error}</p>
          </div>
        </div>
      )}

      {!result.error && (
        <div className="p-4 space-y-4">
          {/* Security Score */}
          <div className={`rounded-lg border ${getScoreBg()} p-3 flex items-center justify-between`}>
            <div className="flex items-center gap-2">
              <ShieldCheck className={`w-5 h-5 ${getScoreColor()}`} />
              <div>
                <span className={`text-sm font-bold ${getScoreColor()}`}>
                  Security Score: {score}%
                </span>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {presentCount} of {totalCount} security headers present
                </p>
              </div>
            </div>
            <Badge
              variant="outline"
              className={`h-6 text-xs ${
                score >= 70
                  ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
                  : score >= 40
                  ? 'border-amber-500/30 text-amber-400 bg-amber-500/10'
                  : 'border-red-500/30 text-red-400 bg-red-500/10'
              }`}
            >
              HTTP {result.status}
            </Badge>
          </div>

          {/* Headers list */}
          <div className="space-y-1.5">
            <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider block">
              Security Headers
            </span>
            <div className="divide-y divide-slate-700/20 rounded-lg border border-slate-700/30 overflow-hidden">
              {result.headers.map((h) => (
                <div
                  key={h.header}
                  className={`flex items-center justify-between px-3 py-2 ${
                    h.present ? 'hover:bg-slate-800/30' : 'bg-slate-800/20'
                  } transition-colors`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {h.present ? (
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                    ) : (
                      <ShieldAlert className="w-3.5 h-3.5 text-red-500/60 flex-shrink-0" />
                    )}
                    <div className="min-w-0">
                      <span
                        className={`text-xs font-medium ${
                          h.present ? 'text-slate-200' : 'text-slate-500'
                        }`}
                      >
                        {h.name}
                      </span>
                      <span className="text-[10px] text-slate-600 ml-1.5">{h.description}</span>
                    </div>
                  </div>
                  <div className="flex-shrink-0 ml-2">
                    {h.present ? (
                      <span className="text-[10px] font-mono text-slate-400 truncate max-w-[200px] block text-right">
                        {h.value.length > 40 ? h.value.substring(0, 40) + '…' : h.value}
                      </span>
                    ) : (
                      <Badge variant="outline" className="h-4 text-[9px] border-red-500/20 text-red-400/60 bg-red-500/5">
                        Missing
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Other notable headers */}
          {result.otherNotable.length > 0 && (
            <div className="pt-2 border-t border-slate-700/30">
              <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider block mb-2">
                Other Notable Headers
              </span>
              <div className="flex flex-wrap gap-1.5">
                {result.otherNotable.map((h) => (
                  <Badge
                    key={h.header}
                    variant="outline"
                    className="h-5 text-[10px] border-slate-700/50 text-slate-400 bg-slate-800/50"
                    title={`${h.header}: ${h.value}`}
                  >
                    {h.header}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
