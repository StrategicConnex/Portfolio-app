'use client';

import { motion } from 'framer-motion';
import { Globe, Calendar, Server, Copy, Check, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';

interface WhoisResult {
  domain: string;
  handle?: string;
  registrar?: string;
  creationDate?: string;
  expirationDate?: string;
  lastUpdated?: string;
  nameServers?: string[];
  status?: string[];
  error?: string;
}

interface Props {
  result: WhoisResult;
}

export function WhoisResultCard({ result }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const text = [
      `Domain: ${result.domain}`,
      `Registrar: ${result.registrar || 'N/A'}`,
      `Created: ${result.creationDate ? new Date(result.creationDate).toLocaleDateString() : 'N/A'}`,
      `Expires: ${result.expirationDate ? new Date(result.expirationDate).toLocaleDateString() : 'N/A'}`,
      `Updated: ${result.lastUpdated ? new Date(result.lastUpdated).toLocaleDateString() : 'N/A'}`,
      `Name Servers: ${result.nameServers?.join(', ') || 'N/A'}`,
      `Status: ${result.status?.join(', ') || 'N/A'}`,
    ].join('\n');
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    try {
      return new Date(dateStr).toLocaleDateString('es-AR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return null;
    }
  };

  const timeline = [
    { label: 'Created', date: result.creationDate, icon: '🟢' },
    { label: 'Updated', date: result.lastUpdated, icon: '🔄' },
    { label: 'Expires', date: result.expirationDate, icon: '⏰' },
  ].filter((t) => t.date) as { label: string; date: string; icon: string }[];

  const isExpired = result.expirationDate && new Date(result.expirationDate) < new Date();

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
          <div className="w-7 h-7 rounded-lg bg-purple-500/15 border border-purple-500/25 flex items-center justify-center">
            <Globe className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div>
            <span className="text-sm font-semibold text-slate-100">{result.domain}</span>
            <span className="text-[10px] text-slate-500 ml-2">Domain Registration</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {result.registrar && (
            <Badge variant="outline" className="h-5 text-[10px] border-slate-600 text-slate-400 bg-slate-800">
              {result.registrar}
            </Badge>
          )}
          {isExpired && (
            <Badge variant="outline" className="h-5 text-[10px] border-red-500/30 text-red-400 bg-red-500/10">
              Expired
            </Badge>
          )}
          {!result.error && (
            <button
              onClick={handleCopy}
              className="h-7 w-7 rounded-md hover:bg-slate-700/50 flex items-center justify-center text-slate-500 hover:text-slate-300 transition-colors"
              aria-label="Copy domain registration info"
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
            <p className="text-xs text-red-400 font-medium">Lookup Error</p>
            <p className="text-xs text-red-300/70 mt-0.5">{result.error}</p>
          </div>
        </div>
      )}

      {!result.error && (
        <div className="p-4 space-y-4">
          {/* Timeline */}
          {timeline.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3 h-3 text-slate-500" />
                <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                  Domain Timeline
                </span>
              </div>
              <div className="relative pl-6 space-y-3 before:absolute before:left-[7px] before:top-[4px] before:bottom-[4px] before:w-px before:bg-slate-700/50">
                {timeline.map((event) => {
                  const formatted = formatDate(event.date);
                  return (
                    <div key={event.label} className="relative">
                      <span className="absolute -left-[22px] top-[2px] text-[10px]">{event.icon}</span>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400">{event.label}</span>
                        {formatted && (
                          <div className="text-right">
                            <span className="text-xs text-slate-300">{formatted}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Name Servers */}
          {result.nameServers && result.nameServers.length > 0 && (
            <div className="pt-2 border-t border-slate-700/30">
              <div className="flex items-center gap-1.5 mb-2">
                <Server className="w-3 h-3 text-slate-500" />
                <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                  Name Servers ({result.nameServers.length})
                </span>
              </div>
              <div className="space-y-1">
                {result.nameServers.map((ns) => (
                  <div key={ns} className="text-xs font-mono text-slate-400 pl-2 border-l-2 border-slate-700/50 py-0.5">
                    {ns}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Domain Status */}
          {result.status && result.status.length > 0 && (
            <div className="pt-2 border-t border-slate-700/30">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Status</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {result.status.map((s) => (
                  <Badge
                    key={s}
                    variant="outline"
                    className="h-5 text-[10px] border-slate-700/50 text-slate-400 bg-slate-800/50"
                  >
                    {s}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Handle */}
          {result.handle && (
            <div className="pt-2 border-t border-slate-700/30">
              <span className="text-[10px] text-slate-500 block">Registry Handle</span>
              <span className="text-xs font-mono text-slate-400">{result.handle}</span>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
