import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AskAICopilotShell } from './AskAICopilotShell'

// Controllable store mock (the shell reads `isOpen` to lazy-mount the panel)
const storeState = {
  isOpen: false,
  hasEverOpened: false,
  mode: 'ask' as const,
  pendingPrompt: null as string | null,
  setIsOpen: vi.fn(),
  setMode: vi.fn(),
  setPendingPrompt: vi.fn(),
}
vi.mock('@/stores/ask-ai-store', () => ({
  useAskAIStore: vi.fn((selector?: (state: typeof storeState) => unknown) =>
    selector ? selector(storeState) : storeState,
  ),
}))

// Mock child components
vi.mock('./AskAILauncher', () => ({
  AskAILauncher: () => <div data-testid="ask-ai-launcher">Launcher</div>,
}))

vi.mock('./AskAIPanel', () => ({
  AskAIPanel: () => <div data-testid="ask-ai-panel">Panel</div>,
}))

// Mock PromptInputProvider
vi.mock('@/components/ai-elements/prompt-input', () => ({
  PromptInputProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="prompt-input-provider">{children}</div>
  ),
}))

describe('AskAICopilotShell', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render the launcher component', () => {
    render(<AskAICopilotShell />)
    expect(screen.getByTestId('ask-ai-launcher')).toBeDefined()
  })

  it('should NOT mount the panel while the copilot is closed', () => {
    render(<AskAICopilotShell />)
    expect(screen.queryByTestId('ask-ai-panel')).toBeNull()
  })

  it('should lazy-mount the panel on first open and keep it mounted', async () => {
    const { rerender } = render(<AskAICopilotShell />)
    expect(screen.queryByTestId('ask-ai-panel')).toBeNull()

    // Simulates setIsOpen(true): the sticky hasEverOpened flag flips.
    storeState.hasEverOpened = true
    rerender(<AskAICopilotShell />)
    expect(await screen.findByTestId('ask-ai-panel')).toBeDefined()

    storeState.isOpen = false
    rerender(<AskAICopilotShell />)
    // Stays mounted after close so history is preserved.
    expect(screen.getByTestId('ask-ai-panel')).toBeDefined()
  })

  it('should wrap children in PromptInputProvider', () => {
    render(<AskAICopilotShell />)
    expect(screen.getByTestId('prompt-input-provider')).toBeDefined()
  })
})
