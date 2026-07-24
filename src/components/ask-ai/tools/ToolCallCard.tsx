'use client';

import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Wrench, Loader2, ChevronDown, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { DnsResultCard } from './DnsResultCard';
import type { DnsResult } from '@/lib/ask-ai/tools/dns-analyzer';
import { SslResultCard, type SslResult } from './SslResultCard';
import { WhoisResultCard } from './WhoisResultCard';
import type { WhoisResult } from '@/lib/ask-ai/tools/whois-lookup';
import { HttpHeadersResultCard } from './HttpHeadersResultCard';
import type { HttpHeadersResult } from '@/lib/ask-ai/tools/http-headers';
import { TechStackResultCard } from './TechStackResultCard';
import type { TechStackResult } from '@/lib/ask-ai/tools/tech-stack-detector';
import { PortAnalyzerResultCard, type PortAnalyzerResult } from './PortAnalyzerResultCard';

/** Tool name → result type mapping for type-safe render dispatch */
interface ToolResultMap {
  dnsAnalyzer: DnsResult;
  sslChecker: SslResult;
  whoisLookup: WhoisResult;
  httpHeadersAnalyzer: HttpHeadersResult;
  techStackDetector: TechStackResult;
  portAnalyzer: PortAnalyzerResult;
}

type ToolName = keyof ToolResultMap;

/** One type-safe renderer per tool — no per-case casts needed */
const toolRenderers: {
  [K in ToolName]: (result: ToolResultMap[K]) => React.ReactNode;
} = {
  dnsAnalyzer: (r) => <DnsResultCard result={r} />,
  sslChecker: (r) => <SslResultCard result={r} />,
  whoisLookup: (r) => <WhoisResultCard result={r} />,
  httpHeadersAnalyzer: (r) => <HttpHeadersResultCard result={r} />,
  techStackDetector: (r) => <TechStackResultCard result={r} />,
  portAnalyzer: (r) => <PortAnalyzerResultCard result={r} />,
};

interface ToolInvocation {
  toolName: string;
  state: 'call' | 'result';
  args?: Record<string, unknown>;
  result?: Record<string, unknown>;
}

interface Props {
  toolInvocation: ToolInvocation;
}

/**
 * Generic tool call card that detects tool type and renders the appropriate
 * specialized result card. Shows a loading state while the tool is running.
 */
export function ToolCallCard({ toolInvocation }: Props) {
  const { toolName, state, args, result } = toolInvocation;
  const isRunning = state === 'call';
  const hasResult = state === 'result' && result !== undefined;

  if (hasResult) {
    if (result.error && typeof result.error === 'string') {
      return <ErrorCard toolName={toolName} error={result.error} args={args} />;
    }

    // Look up the renderer; the single cast here replaces 6 per-case `as unknown as` casts
    const tn = toolName as ToolName;
    const renderer = tn in toolRenderers ? toolRenderers[tn] : null;
    if (renderer) {
      // Cast renderer to accept unknown — the runtime correlation is guaranteed by `tn in toolRenderers`
      return (renderer as (result: unknown) => React.ReactNode)(result);
    }

    return <FallbackCard toolName={toolName} result={result} args={args} />;
  }

  if (isRunning) {
    return <LoadingCard toolName={toolName} args={args} />;
  }

  return null;
}

function LoadingCard({ toolName, args }: { toolName: string; args?: Record<string, unknown> }) {
  const [open, setOpen] = useState(false);
  const { t } = useLanguage();
  const displayName = getToolDisplayName(toolName);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="rounded-xl border border-slate-700/50 bg-slate-900/70 overflow-hidden"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-800/30 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-orange-500/15 border border-orange-500/25 flex items-center justify-center">
            <Wrench className="w-3.5 h-3.5 text-orange-400" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-100">{t(displayName)}</span>
            <Badge
              variant="outline"
              className="h-5 text-[10px] border-orange-500/30 text-orange-400 bg-orange-500/10 gap-1 animate-pulse"
            >
              <Loader2 className="w-2.5 h-2.5 animate-spin" />
              {t('tool.status.running')}
            </Badge>
          </div>
        </div>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-slate-500 transition-transform duration-200',
            open && 'rotate-180',
          )}
        />
      </button>
      <AnimatePresence>
        {open && args && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3">
              <pre className="text-xs font-mono text-slate-500 bg-slate-800/50 rounded-lg p-2 overflow-x-auto">
                {JSON.stringify(args, null, 2)}
              </pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ErrorCard({
  toolName,
  error,
  args,
}: {
  toolName: string;
  error: string;
  args?: Record<string, unknown>;
}) {
  const [open, setOpen] = useState(false);
  const { t } = useLanguage();
  const displayName = getToolDisplayName(toolName);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="rounded-xl border border-red-800/40 bg-slate-900/70 overflow-hidden"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-800/30 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-red-500/15 border border-red-500/25 flex items-center justify-center">
            <AlertCircle className="w-3.5 h-3.5 text-red-400" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-100">{t(displayName)}</span>
            <Badge
              variant="outline"
              className="h-5 text-[10px] border-red-500/30 text-red-400 bg-red-500/10"
            >
              {t('tool.status.error')}
            </Badge>
          </div>
        </div>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-slate-500 transition-transform duration-200',
            open && 'rotate-180',
          )}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-red-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-red-300">{error}</p>
              </div>
              {args && (
                <pre className="text-xs font-mono text-slate-500 bg-slate-800/50 rounded-lg p-2 overflow-x-auto">
                  {JSON.stringify(args, null, 2)}
                </pre>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}function getToolDisplayName(toolName: string): string {
  const displayMap: Record<string, string> = {
    dnsAnalyzer: 'tool.dns',
    sslChecker: 'tool.ssl',
    whoisLookup: 'tool.whois',
    httpHeadersAnalyzer: 'tool.headers',
    techStackDetector: 'tool.techstack',
    portAnalyzer: 'tool.port',
  };
  return displayMap[toolName] || toolName;
}

function FallbackCard({
  toolName,
  result,
  args,
}: {
  toolName: string;
  result: Record<string, unknown>;
  args?: Record<string, unknown>;
})
 {
  const [open, setOpen] = useState(true);
  const { t } = useLanguage();
  const displayName = getToolDisplayName(toolName);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="rounded-xl border border-slate-700/50 bg-slate-900/70 overflow-hidden"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 border-b border-slate-700/30 bg-slate-800/40 hover:bg-slate-800/60 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-slate-700/50 border border-slate-600/50 flex items-center justify-center">
            <Wrench className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <span className="text-sm font-semibold text-slate-100">{t(displayName)}</span>
        </div>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-slate-500 transition-transform duration-200',
            open && 'rotate-180',
          )}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-3 space-y-2">
              {args && (
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">{t('tool.parameters')}</span>
                  <pre className="text-xs font-mono text-slate-400 bg-slate-800/50 rounded-lg p-2 mt-1 overflow-x-auto">
                    {JSON.stringify(args, null, 2)}
                  </pre>
                </div>
              )}
              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">{t('tool.result')}</span>
                <pre className="text-xs font-mono text-slate-400 bg-slate-800/50 rounded-lg p-2 mt-1 overflow-x-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
