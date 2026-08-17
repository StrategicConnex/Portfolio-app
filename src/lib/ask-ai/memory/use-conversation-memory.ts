'use client';

import { useCallback, useState } from 'react';
import {
  addSummary,
  buildMemoryContext,
  loadMemory,
  summarizeConversation,
  type SummarizableMessage,
} from './conversation-memory';

/**
 * Client-side connector between the Ask AI panel and the conversation-memory
 * seam (candidate C5 follow-up). The panel is the only consumer:
 *
 * - `memoryContext` — the pre-formatted, localized block of past conversation
 *   summaries, sent with every request so the route can inject it into the
 *   system prompt (`buildSystemPrompt` embeds it verbatim).
 * - `rememberConversation(messages)` — call it when an assistant response
 *   finishes streaming: it derives a real summary from the conversation via
 *   `summarizeConversation`, persists it with `addSummary`, and bumps the
 *   internal version so `memoryContext` reflects the new summary on the next
 *   render (and therefore on the next request).
 */
export function useConversationMemory(language: 'es' | 'en') {
  // `version` is the re-render trigger: after persisting a summary, the bump
  // makes the next render re-read localStorage. Reading here (cheap: one small
  // JSON parse) is simpler than a memo with a synthetic dependency.
  const [, setVersion] = useState(0);

  const memoryContext = buildMemoryContext(loadMemory(), language);

  const rememberConversation = useCallback(
    (messages: readonly SummarizableMessage[]) => {
      const summary = summarizeConversation(messages, language);
      if (!summary) return false;
      addSummary(summary);
      setVersion((v) => v + 1);
      return true;
    },
    [language],
  );

  return { memoryContext, rememberConversation };
}
