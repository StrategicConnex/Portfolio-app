'use client';

import { MessageSquare, X, Minimize2, Maximize2, Loader2, Trash2 } from 'lucide-react';
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
}

export function AskAIHeader({
  onClose,
  onToggleExpand,
  onClear,
  expanded,
  isLoading,
  messageCount,
  language,
  mode,
}: AskAIHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/50 flex-shrink-0">
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-8 h-8 rounded-full bg-[#C5A46D]/10 border border-[#C5A46D]/30 shadow-[0_0_12px_rgba(197,164,109,0.25)] flex items-center justify-center flex-shrink-0">
          <MessageSquare className="w-4 h-4 text-[#C5A46D]" />
        </div>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-100">Ask Juan AI</span>
            {isLoading && (
              <Badge variant="outline" className="h-5 text-[10px] border-orange-500/30 text-orange-400 bg-orange-500/10 animate-pulse gap-1">
                <Loader2 className="w-2.5 h-2.5 animate-spin" />
                Streaming
              </Badge>
            )}
          </div>
          <span className="text-[10px] text-slate-500 truncate">
            {isLoading
              ? language === 'en' ? 'Generating response...' : 'Generando respuesta...'
              : messageCount > 0
              ? `${messageCount} ${language === 'en' ? (messageCount === 1 ? 'question' : 'questions') : (messageCount === 1 ? 'consulta' : 'consultas')} · ${language === 'en' ? 'EN' : 'ES'} · ${mode === 'ask' ? (language === 'en' ? 'IT/OT Copilot' : 'Copiloto IT/OT') : `${language === 'en' ? 'Mode' : 'Modo'}: ${mode}`}`
              : language === 'en' ? 'Cybersecurity Copilot · EN' : 'Copiloto de Ciberseguridad · ES'}
          </span>
        </div>
      </div>
      <div className="flex gap-1 flex-shrink-0">
        {messageCount > 0 && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-500 hover:text-red-400"
            onClick={onClear}
            aria-label={language === 'en' ? 'Clear conversation' : 'Limpiar conversación'}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-slate-400 hover:text-white"
          onClick={onToggleExpand}
          aria-label={expanded ? 'Minimizar panel' : 'Expandir panel'}
        >
          {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-slate-400 hover:text-white"
          onClick={onClose}
          aria-label="Cerrar panel"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
