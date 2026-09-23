import { create } from 'zustand';

interface AskAIState {
  isOpen: boolean;
  /** Sticky flag: the panel chunk loads on first open and stays mounted. */
  hasEverOpened: boolean;
  mode: 'ask' | 'analyze' | 'osint' | 'services' | 'contact';
  setIsOpen: (isOpen: boolean) => void;
  setMode: (mode: 'ask' | 'analyze' | 'osint' | 'services' | 'contact') => void;
  /** One-shot prompt to auto-send when the copilot opens next; cleared after send. */
  pendingPrompt: string | null;
  setPendingPrompt: (pendingPrompt: string | null) => void;
}

export const useAskAIStore = create<AskAIState>((set) => ({
  isOpen: false,
  hasEverOpened: false,
  mode: 'ask',
  setIsOpen: (isOpen) => set((s) => ({ isOpen, hasEverOpened: s.hasEverOpened || isOpen })),
  setMode: (mode) => set({ mode }),
  pendingPrompt: null,
  setPendingPrompt: (pendingPrompt) => set({ pendingPrompt }),
}));
