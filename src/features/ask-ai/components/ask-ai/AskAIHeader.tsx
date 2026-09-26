'use client';

import { X, Minimize2, Maximize2, Loader2, Trash2, Shuffle } from 'lucide-react';
import { CloudIcon, StormIcon } from './CloudIcons';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface AskAIHeaderProps {
  onClose: () => void;
  onToggleExpand: () => void;
  onClear: () => void;
  expanded: boolean;
  isLoading: boolean;
  messageCount: number;
  language: 'es' | 'en';
  mode: string;
  /** Short free-model label of the last completed response, or null. */
  modelLabel?: string | null;
  /** True when the first pool model failed and a later one answered. */
  fellBack?: boolean;
}

/**
 * Operator-console header: an identity row (call sign + window controls) over
 * a mono telemetry strip (LINK LED, LANG, MODE, QTY, MODEL). The LED turns
 * amber with a transmission equalizer while the copilot is streaming; cyan
 * means the link is up. All aria-labels and copy stay identical to the
 * previous header so specs and e2e keep passing.
 */
export function AskAIHeader({
  onClose,
  onToggleExpand,
  onClear,
  expanded,
  isLoading,
  messageCount,
  language,
  mode,
  modelLabel,
  fellBack = false,
}: AskAIHeaderProps) {
  return (
    <div className="flex-shrink-0">
      {/* Chassis edge — gold fading out */}
      <div className="console-accent-line" />

      <div className="px-4 pt-3 pb-2.5 border-b border-slate-800 bg-[var(--surface-fill)]">
        {/* ── Identity row ── */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="console-gold-tile w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0">
              {isLoading ? <StormIcon className="w-5.5 h-5.5" /> : <CloudIcon className="w-5.5 h-5.5" />}
            </div>
            <div className="flex items-center gap-2 min-w-0">
              <span className="mono text-sm font-bold tracking-wider text-[var(--text-primary)] whitespace-nowrap">
                TANOS&nbsp;AI
              </span>
              <span className="hidden sm:inline mono text-[9px] uppercase tracking-[0.2em] text-[var(--text-subtle)] border border-[var(--surface-border)] rounded px-1.5 py-0.5 flex-shrink-0">
                Copilot
              </span>
              {isLoading && (
                <Badge variant="outline" className="h-5 text-[10px] border-orange-500/30 text-orange-400 bg-orange-500/10 animate-pulse gap-1 flex-shrink-0">
                  <Loader2 className="w-2.5 h-2.5 animate-spin" />
                  Streaming
                </Badge>
              )}
            </div>
          </div>
          <div className="flex gap-1 flex-shrink-0">
            {messageCount > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-[var(--text-subtle)] hover:text-red-400"
                onClick={onClear}
                aria-label={language === 'en' ? 'Clear conversation' : 'Limpiar conversación'}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-[var(--text-muted)] hover:text-white"
              onClick={onToggleExpand}
              aria-label={
                language === 'en'
                  ? expanded ? 'Minimize panel' : 'Expand panel'
                  : expanded ? 'Minimizar panel' : 'Expandir panel'
              }
            >
              {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-[var(--text-muted)] hover:text-white"
              onClick={onClose}
              aria-label={language === 'en' ? 'Close panel' : 'Cerrar panel'}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* ── Telemetry strip (instrument readouts) ── */}
        <div className="flex items-center gap-x-4 gap-y-1 flex-wrap mt-2 mono text-[10px] text-[var(--text-muted)] min-w-0">
          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <span
              aria-hidden
              className={`console-led ${isLoading ? 'text-amber-400' : 'text-cyan-400'}`}
            />
            <span>LINK</span>
            {isLoading && (
              <span className="console-eq text-amber-400" aria-hidden>
                <span />
                <span />
                <span />
              </span>
            )}
          </span>
          <span className="whitespace-nowrap">LANG {language === 'en' ? 'EN' : 'ES'}</span>
          <span className="whitespace-nowrap">MODE {mode}</span>
          <span className="whitespace-nowrap">QTY {messageCount}</span>
          {modelLabel && (
            <span className="flex items-center gap-1 min-w-0 whitespace-nowrap">
              MODEL
              {fellBack && (
                <Shuffle
                  className="inline w-2.5 h-2.5 text-amber-400 flex-shrink-0"
                  aria-hidden
                />
              )}
              <span
                className={fellBack ? 'text-amber-400 truncate' : 'truncate'}
                title={
                  fellBack
                    ? language === 'en'
                      ? 'The first pool model failed; this model answered'
                      : 'El primer modelo del pool falló; respondió este modelo'
                    : undefined
                }
              >
                {modelLabel}
              </span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
