'use client';

import { Loader2, Square, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/context/LanguageContext';
import { Conversation, ConversationContent } from '@/components/ai-elements/conversation';
import { Message, MessageContent, MessageResponse, MessageActions, MessageAction } from '@/components/ai-elements/message';
import { ToolCallCard } from '@/components/ask-ai/tools/ToolCallCard';
import { AskAIEmptyState } from '@/components/ask-ai/AskAIEmptyState';
import { AskAISuggestionBar } from '@/components/ask-ai/AskAISuggestionBar';
import { getTextContent } from './hooks/useAskAIChat';

const FOLLOW_UP_PROMPT_KEYS = [
  'ai.followup.iec_nist',
  'ai.followup.security_onion',
];

interface AskAIMessageListProps {
  messages: Array<{
    id: string;
    role: 'user' | 'assistant' | 'system';
    parts: Array<{ type: string; text?: string; toolInvocation?: Record<string, unknown> }>;
  }>;
  isLoading: boolean;
  retrying: boolean;
  error: Error | undefined;
  language: 'es' | 'en';
  onSelectPrompt: (prompt: string) => void;
  onStop: () => void;
}

export function AskAIMessageList({
  messages,
  isLoading,
  retrying,
  error,
  language,
  onSelectPrompt,
  onStop,
}: AskAIMessageListProps) {
  const { t } = useLanguage();
  const lastMessage = messages[messages.length - 1];

  return (
    <Conversation>
      <ConversationContent>
        {/* Error banner */}
        {error && !retrying && (
          <div className="mx-4 mt-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs">
            {language === 'en' ? 'Error:' : 'Error:'}{' '}
            {error.message === 'Internal server error'
              ? language === 'en'
                ? 'The AI service is temporarily unavailable. Please try again.'
                : 'El servicio de IA no está disponible temporalmente. Intenta de nuevo.'
              : error.message}
          </div>
        )}

        {/* Empty state */}
        {messages.length === 0 ? (
          <AskAIEmptyState onSelectPrompt={onSelectPrompt} />
        ) : (
          /* Message list */
          messages.map((m) => {
            const hasToolParts = m.parts.some(
              (p) =>
                p.type === 'tool-invocation' ||
                (p as { type?: string }).type === 'tool-invocation',
            );
            const textContent = getTextContent(m);

            // Message with tool invocations — render parts individually
            if (hasToolParts) {
              return (
                <Message key={m.id} from={m.role}>
                  <MessageContent>
                    {m.parts.map((part, idx) => {
                      if (part.type === 'text') {
                        return (
                          <MessageResponse key={`text-${idx}`}>
                            {part.text}
                          </MessageResponse>
                        );
                      }
                      if (part.type === 'tool-invocation' && part.toolInvocation) {
                        const ti = part.toolInvocation;
                        return (
                          <div key={`tool-${idx}`} className="my-2">
                            <ToolCallCard
                              toolInvocation={{
                                toolName: ti.toolName as string,
                                state: ti.state as 'call' | 'result',
                                args: ti.args as Record<string, unknown> | undefined,
                                result: ti.result as Record<string, unknown> | undefined,
                              }}
                            />
                          </div>
                        );
                      }
                      return null;
                    })}
                  </MessageContent>
                  {m.role === 'assistant' && !isLoading && textContent.length > 0 && (
                    <MessageActions>
                      <MessageAction
                        tooltip={language === 'en' ? 'Copy response' : 'Copiar respuesta'}
                        onClick={() => navigator.clipboard?.writeText(textContent)}
                        aria-label={language === 'en' ? 'Copy response' : 'Copiar respuesta'}
                      >
                        <FileText className="h-3.5 w-3.5" />
                      </MessageAction>
                    </MessageActions>
                  )}
                </Message>
              );
            }

            // Regular message without tool parts
            return (
              <Message key={m.id} from={m.role}>
                <MessageContent>
                  {m.role === 'user' ? (
                    <span className="text-sm text-orange-50">{textContent}</span>
                  ) : (
                    <MessageResponse>{textContent}</MessageResponse>
                  )}
                </MessageContent>
                {m.role === 'assistant' && !isLoading && textContent.length > 0 && (
                  <MessageActions>
                    <MessageAction
                      tooltip={language === 'en' ? 'Copy response' : 'Copiar respuesta'}
                      onClick={() => navigator.clipboard?.writeText(textContent)}
                      aria-label={language === 'en' ? 'Copy response' : 'Copiar respuesta'}
                    >
                      <FileText className="h-3.5 w-3.5" />
                    </MessageAction>
                  </MessageActions>
                )}
              </Message>
            );
          })
        )}

        {/* Loading indicator */}
        {isLoading && lastMessage?.role === 'user' && (
          <div className="flex items-start mb-4">
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[var(--surface-fill)] border border-slate-800">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-orange-500" />
              <span className="text-xs text-[var(--text-muted)]">
                {retrying
                  ? t('ai.retrying')
                  : messages.length === 1
                  ? language === 'en'
                    ? 'Analyzing query...'
                    : 'Analizando consulta...'
                  : language === 'en'
                  ? 'Generating response...'
                  : 'Generando respuesta...'}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 ml-1 text-[var(--text-subtle)] hover:text-red-400 hover:bg-red-500/10 rounded-md"
                onClick={onStop}
                aria-label={language === 'en' ? 'Stop generation' : 'Detener generación'}
              >
                <Square className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}

        {/* Follow-up suggestions after last assistant message */}
        {messages.length > 0 && !isLoading && lastMessage?.role !== 'user' && (
          <div className="px-4 pb-2">
            <AskAISuggestionBar
              prompts={FOLLOW_UP_PROMPT_KEYS.map((k) => t(k))}
              onSelect={onSelectPrompt}
              variant="followup"
            />
          </div>
        )}
      </ConversationContent>
    </Conversation>
  );
}
