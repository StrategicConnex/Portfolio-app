import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AskAISuggestionBar } from './AskAISuggestionBar'

describe('AskAISuggestionBar', () => {
  it('returns null when there are no prompts', () => {
    const { container } = render(<AskAISuggestionBar prompts={[]} onSelect={vi.fn()} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders one suggestion button per prompt', () => {
    render(<AskAISuggestionBar prompts={['IEC 62443', 'SIEM']} onSelect={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'IEC 62443' })).toBeDefined()
    expect(screen.getByRole('button', { name: 'SIEM' })).toBeDefined()
  })

  it('calls onSelect with the clicked prompt', () => {
    const onSelect = vi.fn()
    render(<AskAISuggestionBar prompts={['IEC 62443']} onSelect={onSelect} />)
    fireEvent.click(screen.getByRole('button', { name: 'IEC 62443' }))
    expect(onSelect).toHaveBeenCalledWith('IEC 62443')
    expect(onSelect).toHaveBeenCalledTimes(1)
  })

  it('applies the followup variant styling', () => {
    render(<AskAISuggestionBar prompts={['Seguir']} onSelect={vi.fn()} variant="followup" />)
    const button = screen.getByRole('button', { name: 'Seguir' })
    // followup: border-slate-700/50 + text-slate-500 (más tenue que el default)
    expect(button.className).toContain('border-slate-700/50')
    expect(button.className).toContain('text-slate-500')
  })

  it('does not apply the followup styling on the default variant', () => {
    render(<AskAISuggestionBar prompts={['Seguir']} onSelect={vi.fn()} />)
    const button = screen.getByRole('button', { name: 'Seguir' })
    expect(button.className).not.toContain('border-slate-700/50')
    expect(button.className).toContain('text-slate-400')
  })
})
