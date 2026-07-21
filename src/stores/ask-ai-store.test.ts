import { describe, it, expect, beforeEach } from 'vitest'
import { useAskAIStore } from './ask-ai-store'

describe('useAskAIStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useAskAIStore.setState({ isOpen: false, mode: 'ask' })
  })

  it('should initialize with default values', () => {
    const state = useAskAIStore.getState()
    expect(state.isOpen).toBe(false)
    expect(state.mode).toBe('ask')
  })

  it('should set isOpen to true', () => {
    useAskAIStore.getState().setIsOpen(true)
    expect(useAskAIStore.getState().isOpen).toBe(true)
  })

  it('should set isOpen to false', () => {
    useAskAIStore.getState().setIsOpen(true)
    useAskAIStore.getState().setIsOpen(false)
    expect(useAskAIStore.getState().isOpen).toBe(false)
  })

  it('should set mode to analyze', () => {
    useAskAIStore.getState().setMode('analyze')
    expect(useAskAIStore.getState().mode).toBe('analyze')
  })

  it('should set mode to osint', () => {
    useAskAIStore.getState().setMode('osint')
    expect(useAskAIStore.getState().mode).toBe('osint')
  })

  it('should set mode to services', () => {
    useAskAIStore.getState().setMode('services')
    expect(useAskAIStore.getState().mode).toBe('services')
  })

  it('should set mode to contact', () => {
    useAskAIStore.getState().setMode('contact')
    expect(useAskAIStore.getState().mode).toBe('contact')
  })

  it('should set mode back to ask', () => {
    useAskAIStore.getState().setMode('analyze')
    useAskAIStore.getState().setMode('ask')
    expect(useAskAIStore.getState().mode).toBe('ask')
  })

  it('should handle concurrent state updates', () => {
    useAskAIStore.getState().setIsOpen(true)
    useAskAIStore.getState().setMode('contact')
    const state = useAskAIStore.getState()
    expect(state.isOpen).toBe(true)
    expect(state.mode).toBe('contact')
  })

  it('should not affect mode when setting isOpen', () => {
    useAskAIStore.getState().setIsOpen(true)
    expect(useAskAIStore.getState().mode).toBe('ask')
  })

  it('should not affect isOpen when setting mode', () => {
    useAskAIStore.getState().setMode('osint')
    expect(useAskAIStore.getState().isOpen).toBe(false)
  })
})
