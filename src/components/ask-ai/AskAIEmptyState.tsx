'use client';

import { CloudIcon } from './CloudIcons';
import { useLanguage } from '@/context/LanguageContext';
import { AskAISuggestionBar } from './AskAISuggestionBar';

const SUGGESTED_PROMPT_KEYS = [
  'ai.suggest.resume',
  'ai.suggest.purdue',
  'ai.suggest.services',
  'ai.suggest.iec_nist',
];

interface AskAIEmptyStateProps {
  onSelectPrompt: (prompt: string) => void;
}

export function AskAIEmptyState({ onSelectPrompt }: AskAIEmptyStateProps) {
  const { language, t } = useLanguage();

  return (
    <div className="flex flex-col items-center justify-center flex-1 px-6 pt-12 pb-8 text-center">
      <div className="console-gold-tile w-12 h-12 rounded-xl flex items-center justify-center mb-4">
        <CloudIcon className="w-6 h-6" />
      </div>
      <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-2">
        {language === 'en' ? 'IT/OT Cybersecurity Consultant' : 'Consultor de Ciberseguridad IT/OT'}
      </h3>
      <p className="text-xs text-[var(--text-subtle)] max-w-xs mb-6 leading-relaxed">
        {language === 'en'
          ? 'Ask about professional experience, industrial network architecture, SIEM, OSINT or compliance frameworks.'
          : 'Pregúntame sobre experiencia profesional, arquitectura de redes industriales, SIEM, OSINT o marcos de cumplimiento.'}
      </p>
      <AskAISuggestionBar prompts={SUGGESTED_PROMPT_KEYS.map(k => t(k))} onSelect={onSelectPrompt} variant="default" />
    </div>
  );
}
