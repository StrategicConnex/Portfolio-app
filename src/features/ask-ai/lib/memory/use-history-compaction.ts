'use client';

import { useCallback, useRef, useState } from 'react';
import {
  clearCompaction,
  collectCitedSources,
  foldableMessages,
  loadCompaction,
  mergeCompaction,
  reconcileCompaction,
  saveCompaction,
  shouldCompact,
  toCompactRequestMessage,
  type CompactableMessage,
  type HistoryCompaction,
} from './compaction';

/**
 * Client connector for history compaction. The panel calls `maybeCompact()`
 * after each successful answer; once 15 unfolded messages accumulate, the
 * oldest turns are summarized by the model (server route) and folded into
 * `compaction`, which `useAskAIChat` sends instead of the full history.
 *
 * Failures are silent and non-destructive: the previous compaction stays in
 * place, the full history keeps being sent, and the next exchange retries.
 */
export function useHistoryCompaction(language: 'es' | 'en') {
  // The folded prefix of the visible thread is restored lazily from
  // localStorage (the panel is client-only), so no state is set in an effect.
  const [compaction, setCompaction] = useState<HistoryCompaction | null>(() => loadCompaction());
  const compactionRef = useRef<HistoryCompaction | null>(compaction);
  const inFlightRef = useRef(false);

  const commit = useCallback((next: HistoryCompaction | null) => {
    compactionRef.current = next;
    setCompaction(next);
    if (next) saveCompaction(next);
    else clearCompaction();
  }, []);

  const maybeCompact = useCallback(
    async (messages: readonly CompactableMessage[]): Promise<boolean> => {
      const current = reconcileCompaction(compactionRef.current, messages.length);
      // A stored offset that no longer matches the thread is discarded so it
      // can never trim the live turns.
      if (compactionRef.current && !current) commit(null);

      if (!shouldCompact(messages.length, current?.coveredCount ?? 0)) return false;
      if (inFlightRef.current) return false;

      const { foldable, coveredCount } = foldableMessages(messages, current?.coveredCount ?? 0);
      if (foldable.length === 0) return false;

      inFlightRef.current = true;
      try {
        const response = await fetch('/api/ask-ai/compact', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            language,
            previousSummary: current?.summary,
            messages: foldable.map(toCompactRequestMessage),
          }),
        });
        if (!response.ok) return false;

        const data = (await response.json()) as { summary?: unknown };
        if (typeof data.summary !== 'string' || !data.summary.trim()) return false;

        commit(
          mergeCompaction(current, data.summary, coveredCount, collectCitedSources(foldable)),
        );
        return true;
      } catch {
        return false;
      } finally {
        inFlightRef.current = false;
      }
    },
    [language, commit],
  );

  const reset = useCallback(() => commit(null), [commit]);

  return { compaction, maybeCompact, reset };
}
