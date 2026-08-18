'use client'

import { Monitor, Sun, Moon } from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'
import { useLanguage } from '@/context/LanguageContext'
import type { ThemePreference } from '@/lib/theme'

const OPTIONS: ReadonlyArray<{
  value: ThemePreference
  icon: typeof Sun
  labelKey: string
}> = [
  { value: 'system', icon: Monitor, labelKey: 'theme.system' },
  { value: 'light', icon: Sun, labelKey: 'theme.light' },
  { value: 'dark', icon: Moon, labelKey: 'theme.dark' },
]

/**
 * Segmented System / Light / Dark switcher. Semantic tokens only — no
 * hardcoded colors — so it adapts to both themes. The active option is
 * communicated by icon + accent color AND `aria-pressed` (never color alone).
 */
export function ThemeToggle() {
  const { preference, setPreference } = useTheme()
  const { t } = useLanguage()

  return (
    <div
      role="group"
      aria-label={t('theme.label')}
      className="flex items-center gap-0.5 p-1 rounded-lg bg-muted border border-border-interactive"
    >
      {OPTIONS.map(({ value, icon: Icon, labelKey }) => {
        const active = preference === value
        return (
          <button
            key={value}
            type="button"
            onClick={() => setPreference(value)}
            aria-pressed={active}
            aria-label={t(labelKey)}
            title={t(labelKey)}
            className={`p-1.5 rounded-md transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring ${
              active
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            }`}
          >
            <Icon size={14} aria-hidden="true" />
          </button>
        )
      })}
    </div>
  )
}
