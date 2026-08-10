'use client';
import { useAskAIStore } from '@/stores/ask-ai-store';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Square, BookOpen, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useState, useMemo, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Conversation, ConversationContent } from '@/components/ai-elements/conversation';
import { Message, MessageContent, MessageResponse, MessageActions, MessageAction } from '@/components/ai-elements/message';
import { Sources, SourcesTrigger, SourcesContent, Source } from '@/components/ai-elements/sources';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ToolCallCard } from '@/components/ask-ai/tools/ToolCallCard';
import { AskAIHeader } from '@/components/ask-ai/AskAIHeader';
import { AskAIPromptInput } from '@/components/ask-ai/AskAIPromptInput';
import { AskAISuggestionBar } from '@/components/ask-ai/AskAISuggestionBar';
import { AskAIEmptyState } from '@/components/ask-ai/AskAIEmptyState';
import { publishCopilotStatus } from '@/lib/copilotVisual';

const FOLLOW_UP_PROMPTS = [
  'Compara IEC 62443 con NIST CSF',
  '¿Cómo aplica Security Onion en OT?',
];

const SOURCE_ITEMS = [
  { title: 'Perfil Profesional', href: '#perfil', type: 'Sección' },
  { title: 'Experiencia IT/OT', href: '#experiencia', type: 'Sección' },
  { title: 'Stack Tecnológico', href: '#stack', type: 'Sección' },
  { title: 'Certificaciones', href: '#certificaciones', type: 'Sección' },
];

const STORAGE_KEY = 'ask-ai-messages';

export function AskAIPanel() {
  const { isOpen, setIsOpen, mode } = useAskAIStore();
  const { language } = useLanguage();
  const [expanded, setExpanded] = useState(false);

  // Create transport with language-aware API URL (reuses the same instance via useMemo)
  const chatTransport = useMemo(
    () =>
      new DefaultChatTransport({
        api: `/api/ask-ai?lang=${language}&mode=${mode}`,
      }),
    [language, mode],
  );

  const { messages, sendMessage, status, error, stop, setMessages } = useChat({
    transport: chatTransport,
    onError: (err) => {
      console.error('[AskAI] Chat error:', err);
    },
  });

  // ─── Conversation persistence ───

  const isLoading = status === 'streaming' || status === 'submitted';

  // ─── Event bus visual (Fase 7): observa el estado SIN modificarlo ───
  // Publica un estado derivado al bus visual (el 3D reacciona, nunca controla).
  useEffect(() => {
    publishCopilotStatus(
      error ? 'error' : status === 'streaming' ? 'streaming' : status === 'submitted' ? 'thinking' : messages.length > 0 ? 'complete' : 'idle',
    )
  }, [status, error, messages.length])

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
    // Intentionally run only on mount - setMessages is stable
  }, [setMessages]);

  // Save messages to localStorage (skip during active streaming)
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

  const [input, setInput] = useState('');

  const handleInputChange = (value: string) => {
    setInput(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || status === 'streaming' || status === 'submitted') return;
    sendMessage({ text: input });
    setInput('');
  };

  const handleSuggestion = (suggestion: string) => {
    sendMessage({ text: suggestion });
  };

  const messageCount = messages.filter(m => m.role === 'user').length;
  const lastMessage = messages[messages.length - 1];

  // Extract text from message parts
  const getTextContent = (m: typeof messages[0]) =>
    m.parts
      .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
      .map(p => p.text)
      .join('');

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col relative bg-slate-950/95 backdrop-blur-xl border border-slate-800/80 shadow-[0_0_30px_rgba(30,144,255,0.08)] overflow-hidden ${
            expanded
              ? 'w-[calc(100vw-2rem)] sm:w-[calc(100vw-3rem)] h-[calc(100vh-2rem)] sm:h-[calc(100vh-3rem)] max-w-5xl'
              : 'w-[calc(100vw-2rem)] sm:w-[420px] h-[calc(100vh-6rem)] sm:h-[640px] max-h-[80vh] sm:max-h-[85vh]'
          }`}
          style={{ borderRadius: '14px' }}
        >
          {/* AI Node Console: línea de acento superior (decorativa) */}
          <div aria-hidden="true" className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#C5A46D]/60 to-transparent" />
          {/* ─── Header (modular) ─── */}
          <AskAIHeader
            onClose={() => setIsOpen(false)}
            onToggleExpand={() => setExpanded(!expanded)}
            onClear={() => setMessages([])}
            expanded={expanded}
            isLoading={isLoading}
            messageCount={messageCount}
            language={language}
            mode={mode}
          />

          {/* ─── Body: Side-by-side in expanded mode ─── */}
          <div className="flex flex-1 min-h-0">
            {/* Main conversation area */}
            <div className="flex flex-col flex-1 min-w-0">
              <Conversation>
                <ConversationContent>
                  {error && (
                    <div className="mx-4 mt-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs">
                      {language === 'en' ? 'Error:' : 'Error:'} {error.message === 'Internal server error'
                        ? language === 'en' ? 'The AI service is temporarily unavailable. Please try again.'
                        : 'El servicio de IA no está disponible temporalmente. Intenta de nuevo.'
                        : error.message}
                    </div>
                  )}

                  {messages.length === 0 ? (
                    <AskAIEmptyState onSelectPrompt={handleSuggestion} />
                  ) : (
                    messages.map((m) => {
                      const hasToolParts = m.parts.some(
                        (p) =>
                          p.type === 'tool-invocation' ||
                          (p as { type?: string }).type === 'tool-invocation',
                      );
                      const textContent = getTextContent(m);

                      // If message has tool invocations, render parts individually
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
                                if (
                                  part.type === 'tool-invocation' &&
                                  (part as Record<string, unknown>).toolInvocation
                                ) {
                                  const ti = (
                                    part as Record<string, unknown>
                                  ).toolInvocation as Record<string, unknown>;
                                  return (
                                    <div key={`tool-${idx}`} className="my-2">
                                      <ToolCallCard
                                        toolInvocation={{
                                          toolName: ti.toolName as string,
                                          state: ti.state as 'call' | 'result',
                                          args: ti.args as Record<string, unknown> | undefined,
                                          result:
                                            ti.result as Record<string, unknown> | undefined,
                                        }}
                                      />
                                    </div>
                                  );
                                }
                                return null;
                              })}
                            </MessageContent>
                            {m.role === 'assistant' &&
                              !isLoading &&
                              textContent.length > 0 && (
                                <MessageActions>
                                  <MessageAction
                                    tooltip="Copiar respuesta"
                                    onClick={() =>
                                      navigator.clipboard?.writeText(textContent)
                                    }
                                    aria-label="Copiar respuesta"
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
                              <span className="text-sm text-orange-50">
                                {textContent}
                              </span>
                            ) : (
                              <MessageResponse>{textContent}</MessageResponse>
                            )}
                          </MessageContent>
                          {m.role === 'assistant' &&
                            !isLoading &&
                            textContent.length > 0 && (
                              <MessageActions>
                                <MessageAction
                                  tooltip="Copiar respuesta"
                                  onClick={() =>
                                    navigator.clipboard?.writeText(textContent)
                                  }
                                  aria-label="Copiar respuesta"
                                >
                                  <FileText className="h-3.5 w-3.5" />
                                </MessageAction>
                              </MessageActions>
                            )}
                        </Message>
                      );
                    })
                  )}

                  {isLoading && lastMessage?.role === 'user' && (
                    <div className="flex items-start mb-4">
                      <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-900/50 border border-slate-800">
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-orange-500" />              <span className="text-xs text-slate-400">
                  {messages.length === 1
                    ? language === 'en' ? 'Analyzing query...' : 'Analizando consulta...'
                    : language === 'en' ? 'Generating response...' : 'Generando respuesta...'}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 ml-1 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-md"
                          onClick={() => stop()}
                          aria-label="Detener generación"
                        >
                          <Square className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Follow-up suggestions after last assistant message */}
                  {messages.length > 0 && !isLoading && lastMessage?.role !== 'user' && (
                    <div className="px-4 pb-2">
                      <AskAISuggestionBar prompts={FOLLOW_UP_PROMPTS} onSelect={handleSuggestion} variant="followup" />
                    </div>
                  )}
                </ConversationContent>
              </Conversation>

              {/* ─── Input Area (modular) ─── */}
              <AskAIPromptInput
                input={input}
                onInputChange={handleInputChange}
                onSubmit={handleSubmit}
                onStop={stop}
                isLoading={isLoading}
              />
            </div>

            {/* ─── Sources sidebar (expanded only) ─── */}
            {expanded && (
              <div className="hidden sm:flex flex-col w-60 border-l border-slate-800 bg-slate-900/30 flex-shrink-0">
                <div className="px-4 py-3 border-b border-slate-800">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <BookOpen className="w-3.5 h-3.5" />
                    Fuentes
                  </h4>
                </div>
                <ScrollArea className="flex-1">
                  <div className="p-3 space-y-3">
                    <Sources>
                      <SourcesTrigger count={SOURCE_ITEMS.length} />
                      <SourcesContent>
                        {SOURCE_ITEMS.map((item) => (
                          <Source
                            key={item.title}
                            href={item.href}
                            title={item.title}
                            className="text-xs text-slate-400 hover:text-orange-400 transition-colors"
                          />
                        ))}
                      </SourcesContent>
                    </Sources>

                    <div className="pt-3 border-t border-slate-800/50">
                      <h5 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                        Stats
                      </h5>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-slate-500">Consultas</span>
                          <Badge variant="secondary" className="text-[10px] h-5">
                            {messageCount}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-slate-500">Modo</span>
                          <Badge variant="outline" className="text-[10px] h-5 border-slate-700 text-slate-400">
                            {mode}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-slate-500">Estado</span>
                          <Badge
                            variant="outline"
                            className={`text-[10px] h-5 ${
                              isLoading
                                ? 'border-orange-500/30 text-orange-400'
                                : 'border-emerald-500/30 text-emerald-400'
                            }`}
                          >
                            {isLoading ? 'Streaming' : 'Listo'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
