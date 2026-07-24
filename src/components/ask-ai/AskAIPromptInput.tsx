'use client';

import { ArrowUp, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/context/LanguageContext';

interface AskAIPromptInputProps {
  input: string;
  onInputChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onStop: () => void;
  isLoading: boolean;
  placeholder?: string;
}

export function AskAIPromptInput({
  input,
  onInputChange,
  onSubmit,
  onStop,
  isLoading,
  placeholder,
}: AskAIPromptInputProps) {
  const { language } = useLanguage();

  const defaultPlaceholder = isLoading
    ? language === 'en' ? 'Waiting for response...' : 'Esperando respuesta...'
    : language === 'en'
      ? 'Ask about IT/OT, cybersecurity...'
      : 'Pregunta sobre IT/OT, ciberseguridad...';

  return (
    <div className="p-3 border-t border-slate-800 bg-slate-900/50 flex-shrink-0">
      <form onSubmit={onSubmit} className="relative flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder={placeholder || defaultPlaceholder}
          className="flex-1 bg-slate-900 border border-slate-700 text-slate-200 placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading}
        />
        {isLoading ? (
          <Button
            type="button"
            size="icon"
            className="h-10 w-10 bg-red-500/80 hover:bg-red-500 text-white rounded-xl flex-shrink-0"
            onClick={onStop}
            aria-label={language === 'en' ? 'Stop generation' : 'Detener generación'}
          >
            <Square className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            type="submit"
            size="icon"
            className="h-10 w-10 bg-orange-500 hover:bg-orange-600 text-white rounded-xl flex-shrink-0 disabled:opacity-50"
            disabled={!input.trim()}
            aria-label={language === 'en' ? 'Send message' : 'Enviar mensaje'}
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
        )}
      </form>
    </div>
  );
}
