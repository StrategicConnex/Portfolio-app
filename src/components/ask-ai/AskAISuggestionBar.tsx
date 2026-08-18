'use client';

import { Suggestions, Suggestion } from '@/components/ai-elements/suggestion';

interface AskAISuggestionBarProps {
  prompts: string[];
  onSelect: (prompt: string) => void;
  variant?: 'default' | 'empty' | 'followup';
}

export function AskAISuggestionBar({ prompts, onSelect, variant = 'default' }: AskAISuggestionBarProps) {
  if (prompts.length === 0) return null;

  const className = variant === 'followup'
    ? 'text-xs border-[var(--border-interactive)] text-[var(--text-subtle)] hover:text-orange-400 hover:border-orange-500/30 transition-colors gap-1'
    : 'text-xs border-[var(--border-interactive)] text-[var(--text-muted)] hover:text-orange-400 hover:border-orange-500/40 transition-colors';

  return (
    <Suggestions>
      {prompts.map((prompt) => (
        <Suggestion
          key={prompt}
          suggestion={prompt}
          onClick={() => onSelect(prompt)}
          variant="outline"
          className={className}
        />
      ))}
    </Suggestions>
  );
}
