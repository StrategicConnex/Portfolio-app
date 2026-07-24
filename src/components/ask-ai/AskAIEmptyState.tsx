'use client';

import { MessageSquare } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { AskAISuggestionBar } from './AskAISuggestionBar';

const SUGGESTED_PROMPTS = [
  'Resume mi perfil profesional',
  'Explica el modelo Purdue en OT',
  'Servicios de ciberseguridad industrial',
  'IEC 62443 vs NIST CSF',
];

interface AskAIEmptyStateProps {
  onSelectPrompt: (prompt: string) => void;
}

export function AskAIEmptyState({ onSelectPrompt }: AskAIEmptyStateProps) {
  const { language } = useLanguage();

  return (
    <div className="flex flex-col items-center justify-center flex-1 px-6 pt-12 pb-8 text-center">
      <div className="w-12 h-12 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mb-4">
        <MessageSquare className="w-6 h-6 text-orange-500" />
      </div>
      <h3 className="text-sm font-semibold text-slate-200 mb-2">
        {language === 'en' ? 'IT/OT Cybersecurity Consultant' : 'Consultor de Ciberseguridad IT/OT'}
      </h3>
      <p className="text-xs text-slate-500 max-w-xs mb-6 leading-relaxed">
        {language === 'en'
          ? 'Ask about professional experience, industrial network architecture, SIEM, OSINT or compliance frameworks.'
          : 'Pregúntame sobre experiencia profesional, arquitectura de redes industriales, SIEM, OSINT o marcos de cumplimiento.'}
      </p>
      <AskAISuggestionBar prompts={SUGGESTED_PROMPTS} onSelect={onSelectPrompt} variant="default" />
    </div>
  );
}
