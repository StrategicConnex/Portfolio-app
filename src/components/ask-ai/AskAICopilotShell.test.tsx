import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AskAICopilotShell } from './AskAICopilotShell'

// Mock the store
vi.mock('@/stores/ask-ai-store', () => ({
  useAskAIStore: vi.fn((selector?: (state: Record<string, unknown>) => unknown) => {
    const state = { isOpen: false, mode: 'ask' as const, setIsOpen: vi.fn(), setMode: vi.fn() }
    return selector ? selector(state) : state
  }),
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

  it('should render the panel component', () => {
    render(<AskAICopilotShell />)
    expect(screen.getByTestId('ask-ai-panel')).toBeDefined()
  })

  it('should wrap children in PromptInputProvider', () => {
    render(<AskAICopilotShell />)
    expect(screen.getByTestId('prompt-input-provider')).toBeDefined()
  })
})
