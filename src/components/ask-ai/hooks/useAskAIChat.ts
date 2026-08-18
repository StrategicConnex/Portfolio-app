'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { z } from 'zod';
import { useConversationMemory } from '@/lib/ask-ai/memory/use-conversation-memory';
import { loadFailedModels, persistFailedModels } from '@/lib/ask-ai/pool-health';
import { trackAiEvent } from '@/lib/observability/posthog';

const STORAGE_KEY = 'ask-ai-messages';

/** Extract text content from a chat message's parts. */
export function getTextContent(m: { parts: Array<{ type: string; text?: string }> }): string {
  return m.parts
    .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
    .map(p => p.text)
    .join('');
}

export interface UseAskAIChatOptions {
  language: 'es' | 'en';
  mode: string;
}

export function useAskAIChat({ language, mode }: UseAskAIChatOptions) {
  const [expanded, setExpanded] = useState(false);
  const [input, setInput] = useState('');

  // Pool health state
  const [modelId, setModelId] = useState<string | null>(null);
  const [lastLatencyMs, setLastLatencyMs] = useState<number | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [fellBack, setFellBack] = useState(false);

  const requestStartRef = useRef<number | null>(null);
  const lastModelRef = useRef<string | null>(null);
  const failedModelsRef = useRef<string[]>([]);
  const autoRetriesLeftRef = useRef(2);

  // Conversation memory (seam)
  const { memoryContext, rememberConversation } = useConversationMemory(language);

  // Transport — language-aware API URL
  const chatTransport = useMemo(
    () =>
      new DefaultChatTransport({
        api: `/api/ask-ai?lang=${language}&mode=${mode}`,
      }),
    [language, mode],
  );

  const { messages, sendMessage, status, error, stop, setMessages, clearError } = useChat({
    transport: chatTransport,
    messageMetadataSchema: z.object({ modelId: z.string() }).optional(),
    onError: (err) => {
      console.error('[AskAI] Chat error:', err);
    },
    onFinish: ({ message, messages: finalMessages, isAbort, isError }) => {
      const meta = message.metadata as
        | { modelId?: string; fellBack?: boolean }
        | undefined;
      if (meta?.modelId) lastModelRef.current = meta.modelId;

      if (isAbort) return;

      // Auto-retry on mid-stream error with the next free model
      if (isError) {
        if (autoRetriesLeftRef.current > 0) {
          autoRetriesLeftRef.current -= 1;
          if (lastModelRef.current) {
            failedModelsRef.current = [
              ...new Set([...failedModelsRef.current, lastModelRef.current]),
            ];
            persistFailedModels(failedModelsRef.current);
          }
          const lastUser = [...finalMessages].reverse().find((m) => m.role === 'user');
          const lastUserText = lastUser ? getTextContent(lastUser) : '';
          if (lastUser && lastUserText) {
            setRetrying(true);
            clearError();
            // eslint-disable-next-line react-hooks/purity -- onFinish runs async, not during render
            requestStartRef.current = performance.now();
            sendMessage(
              { text: lastUserText, messageId: lastUser.id },
              { body: { memoryContext, skipModels: failedModelsRef.current } },
            );
            return;
          }
        }
        setRetrying(false);
        return;
      }

      // Success — reset retry budget, show winning model, remember conversation
      setRetrying(false);
      autoRetriesLeftRef.current = 2;
      if (meta?.modelId) setModelId(meta.modelId);
      if (meta?.fellBack !== undefined) setFellBack(meta.fellBack);
      rememberConversation(finalMessages);
    },
  });

  const isLoading = status === 'streaming' || status === 'submitted';

  // Capture perceived latency (send → first chunk)
  useEffect(() => {
    if (status === 'streaming' && requestStartRef.current !== null) {
      setLastLatencyMs(performance.now() - requestStartRef.current);
      requestStartRef.current = null;
    }
  }, [status]);

  // Restore messages from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        }
      }
    } catch {
      // Ignore corrupt localStorage data
    }
  }, [setMessages]);

  // Restore persisted pool health-check
  useEffect(() => {
    failedModelsRef.current = loadFailedModels();
  }, []);

  // Telemetry: panel opened
  useEffect(() => {
    trackAiEvent('opened', {
      language,
      mode,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
    });       
   
  }, []);

  // Persist messages to localStorage (skip during streaming)
  useEffect(() => {
    if (isLoading) return;
    try {
      if (messages.length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
      }
    } catch {
      // Ignore localStorage write errors
    }
  }, [messages, isLoading]);

  // ─── Handlers ───

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim() || status === 'streaming' || status === 'submitted') return;
      trackAiEvent('message_sent', { language, mode, chars: input.length, source: 'input' });
      requestStartRef.current = performance.now();
      sendMessage(
        { text: input },
        { body: { memoryContext, skipModels: failedModelsRef.current } },
      );
      setInput('');
    },
    [input, status, language, mode, memoryContext, sendMessage],
  );

  const handleSuggestion = useCallback(
    (suggestion: string) => {
      trackAiEvent('message_sent', { language, mode, chars: suggestion.length, source: 'suggestion' });
      requestStartRef.current = performance.now();
      sendMessage(
        { text: suggestion },
        { body: { memoryContext, skipModels: failedModelsRef.current } },
      );
    },
    [language, mode, memoryContext, sendMessage],
  );

  const handleClear = useCallback(() => setMessages([]), [setMessages]);

  const handleToggleExpand = useCallback(() => setExpanded((e) => !e), []);

  // ─── Computed ───

  const messageCount = messages.filter((m) => m.role === 'user').length;
  const lastMessage = messages[messages.length - 1];

  const shortModel = modelId?.split('/').pop()?.replace(/:free$/, '') ?? null;
  const modelLabel =
    modelId && !isLoading
      ? [
          shortModel,
          lastLatencyMs !== null
            ? lastLatencyMs < 1000
              ? `${lastLatencyMs}ms`
              : `${(lastLatencyMs / 1000).toFixed(1)}s`
            : null,
          language === 'en' ? 'free' : 'gratis',
        ]
          .filter(Boolean)
          .join(' · ')
      : null;

  return {
    // State
    messages,
    input,
    setInput,
    expanded,
    isLoading,
    retrying,
    fellBack,
    error,
    status,

    // Computed
    messageCount,
    lastMessage,
    modelLabel,

    // Handlers
    handleSubmit,
    handleSuggestion,
    handleClear,
    handleToggleExpand,
    handleInputChange: setInput,
    stop,

    // Utilities
    getTextContent,
  };
}
