'use client';
import { AskAILauncher } from './AskAILauncher';
import { AskAIPanel } from './AskAIPanel';
import { PromptInputProvider } from '@/components/ai-elements/prompt-input';

export function AskAICopilotShell() {
  return (
    <PromptInputProvider>
      <AskAILauncher />
      <AskAIPanel />
    </PromptInputProvider>
  );
}
