import { create } from 'zustand';

interface AskAIState {
  isOpen: boolean;
  mode: 'ask' | 'analyze' | 'osint' | 'services' | 'contact';
  setIsOpen: (isOpen: boolean) => void;
  setMode: (mode: 'ask' | 'analyze' | 'osint' | 'services' | 'contact') => void;
}

export const useAskAIStore = create<AskAIState>((set) => ({
  isOpen: false,
  mode: 'ask',
  setIsOpen: (isOpen) => set({ isOpen }),
  setMode: (mode) => set({ mode }),
}));
