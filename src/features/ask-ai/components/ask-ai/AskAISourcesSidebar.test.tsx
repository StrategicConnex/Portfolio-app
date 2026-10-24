import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AskAISourcesSidebar } from './AskAISourcesSidebar'

vi.mock('@/context/LanguageContext', () => ({
  useLanguage: () => ({ language: 'en', t: (k: string) => k }),
}))

it('renders Sources header when real sources provided', () => {
  render(<AskAISourcesSidebar messageCount={2} mode="ask" isLoading={false} sources={[{ title: 'IEC 62443 compliance', id: 'compliance-iec62443' }]} />)
  // The Sources header is always visible regardless of sources prop
  expect(screen.getByText('Sources')).toBeDefined()
  // The collapsible trigger should be present
  expect(screen.getByRole('button', { name: /used 1 sources/i })).toBeDefined()
})

it('renders Sources header when falling back to static list', () => {
  render(<AskAISourcesSidebar messageCount={0} mode="ask" isLoading={false} />)
  // The Sources header should still be present
  expect(screen.getByText('Sources')).toBeDefined()
  // The collapsible trigger should be present (count varies based on store state)
  const trigger = screen.getByRole('button', { name: /used \d+ sources/i })
  expect(trigger).toBeDefined()
})