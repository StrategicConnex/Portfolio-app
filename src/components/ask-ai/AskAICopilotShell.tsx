'use client';
import { AskAILauncher } from './AskAILauncher';
import { AskAIPanel } from './AskAIPanel';
import { AskAIErrorBoundary } from './AskAIErrorBoundary';
import { PromptInputProvider } from '@/components/ai-elements/prompt-input';

export function AskAICopilotShell() {
  return (
    <AskAIErrorBoundary>
      <PromptInputProvider>
        <AskAILauncher />
        <AskAIPanel />
      </PromptInputProvider>
    </AskAIErrorBoundary>
  );
}
