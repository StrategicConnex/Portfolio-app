'use client';
import dynamic from 'next/dynamic';
import { AskAILauncher } from './AskAILauncher';
import { AskAIErrorBoundary } from './AskAIErrorBoundary';
import { PromptInputProvider } from '@/components/ai-elements/prompt-input';
import { useAskAIStore } from '@/stores/ask-ai-store';

/**
 * The panel (message renderer incl. streamdown/katex/shiki) is the heaviest
 * part of the copilot. It is loaded on first open instead of at page load —
 * once mounted it stays mounted so chat history survives close/reopen.
 */
const AskAIPanel = dynamic(() => import('./AskAIPanel').then((m) => m.AskAIPanel), { ssr: false });

function AskAIPanelOnce() {
  const hasEverOpened = useAskAIStore((s) => s.hasEverOpened);
  if (!hasEverOpened) return null;
  return <AskAIPanel />;
}

export function AskAICopilotShell() {
  return (
    <AskAIErrorBoundary>
      <PromptInputProvider>
        <AskAILauncher />
        <AskAIPanelOnce />
      </PromptInputProvider>
    </AskAIErrorBoundary>
  );
}
