import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * WCAG AA contrast audit for the semantic text tokens defined in
 * src/app/globals.css. Parses the live token values so the audit cannot
 * drift from the CSS. Every token/tier must hold >= 4.5:1 on the surfaces
 * where it is actually rendered (light, dark and the .console scope).
 */

type RGBA = { r: number; g: number; b: number; a: number }

const css = readFileSync(join(process.cwd(), 'src/app/globals.css'), 'utf8')

/* ── CSS parsing ─────────────────────────────────────────────────────── */

function extractBlock(selector: string): Record<string, string> {
  const re = new RegExp(`${selector}\\s*\\{([^}]*)\\}`, 'm')
  const m = css.match(re)
  if (!m) throw new Error(`CSS block "${selector}" not found`)
  const tokens: Record<string, string> = {}
  for (const line of m[1].split('\n')) {
    const mm = line.match(/^\s*(--[\w-]+):\s*(.+?);(?:\s*\/\*[^*]*\*\/)?\s*$/)
    if (mm) tokens[mm[1]] = mm[2].trim()
  }
  return tokens
}

function parseColor(value: string): RGBA {
  const hex = value.match(/^#([0-9a-f]{6}|[0-9a-f]{3})$/i)
  if (hex) {
    let h = hex[1]
    if (h.length === 3) h = h.split('').map((c) => c + c).join('')
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
      a: 1,
    }
  }
  const rgb = value.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)$/i)
  if (rgb) {
    return { r: +rgb[1], g: +rgb[2], b: +rgb[3], a: rgb[4] === undefined ? 1 : +rgb[4] }
  }
  throw new Error(`Unparseable color: ${value}`)
}

function composite(fg: string, bg: string): string {
  const f = parseColor(fg)
  const b = parseColor(bg)
  const c = (x: number, y: number, a: number) => Math.round(x * a + y * (1 - a))
  return `rgb(${c(f.r, b.r, f.a)}, ${c(f.g, b.g, f.a)}, ${c(f.b, b.b, f.a)})`
}

function luminance(color: string): number {
  const { r, g, b } = parseColor(color)
  const lin = (c: number) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

function contrast(a: string, b: string): number {
  const la = luminance(a)
  const lb = luminance(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

/* ── Token blocks ────────────────────────────────────────────────────── */

const light = extractBlock(':root')
const dark = extractBlock('\\.dark')
const consoleScope = extractBlock('\\.console')

/* Console surfaces are hardcoded dark (slate-950/900) in the components,
   in both themes — use the darkest one as the worst case. */
const CONSOLE_BG = '#020617'

/* ── Surfaces per theme ──────────────────────────────────────────────── */

const lightSurfaces = {
  bg: light['--bg'],
  bg2: light['--bg2'],
  card: light['--card'],
  /* fill directly over a section background (TrustBadges pills) */
  surfaceFillOverBg2: composite(light['--surface-fill'], light['--bg2']),
  /* glass content stack: translucent fill sits on top of the glass card */
  surfaceFillOverGlassOverBg2: composite(
    light['--surface-fill'],
    composite(light['--glass-bg'], light['--bg2']),
  ),
  glassOverBg2: composite(light['--glass-bg'], light['--bg2']),
}

const darkSurfaces = {
  bg: dark['--bg'],
  card: dark['--card'],
  surface: dark['--surface'],
  elevated: dark['--surface-elevated'],
}

/* ── Non-text (1.4.11) helper ────────────────────────────────────────── */

/** Boundary contrast: flatten the translucent token over the surface it
    borders, then compare against that surface (WCAG 1.4.11, >= 3:1). */
function expectBoundary(token: string, fg: string, surfaces: Record<string, string>, min = 3) {
  for (const [surface, bg] of Object.entries(surfaces)) {
    const ratio = contrast(composite(fg, bg), bg)
    expect(
      ratio,
      `${token} (${fg}) boundary on ${surface} (${bg}) must be >= ${min}:1 (got ${ratio.toFixed(2)})`,
    ).toBeGreaterThanOrEqual(min)
  }
}

/* ── Helpers ─────────────────────────────────────────────────────────── */

function expectContrast(tier: string, color: string, surfaces: Record<string, string>, min = 4.5) {
  for (const [surface, bg] of Object.entries(surfaces)) {
    const ratio = contrast(color, bg)
    expect(
      ratio,
      `${tier} (${color}) on ${surface} (${bg}) must be >= ${min}:1 (got ${ratio.toFixed(2)})`,
    ).toBeGreaterThanOrEqual(min)
  }
}

function expectTiers(tiers: string[], block: Record<string, string>, surfaces: Record<string, string>, min = 4.5) {
  for (const tier of tiers) {
    expectContrast(tier, block[tier], surfaces, min)
  }
}

/* ── The audit ───────────────────────────────────────────────────────── */

describe('Light theme text tokens — WCAG AA (>= 4.5:1)', () => {
  it('primary/secondary content text passes on bg, bg2 and cards', () => {
    expectTiers(
      ['--text-primary', '--text-secondary', '--muted-foreground', '--foreground', '--secondary-foreground', '--accent-foreground'],
      light,
      { bg: lightSurfaces.bg, bg2: lightSurfaces.bg2, card: lightSurfaces.card },
    )
  })

  it('muted tier passes including the direct translucent fill (pills)', () => {
    expectTiers(['--text-muted'], light, {
      bg: lightSurfaces.bg,
      bg2: lightSurfaces.bg2,
      card: lightSurfaces.card,
      fill: lightSurfaces.surfaceFillOverBg2,
    })
  })

  it('subtle tier passes on its real surfaces (bg, cards, glass stack)', () => {
    expectTiers(['--text-subtle'], light, {
      bg: lightSurfaces.bg,
      bg2: lightSurfaces.bg2,
      card: lightSurfaces.card,
      glass: lightSurfaces.glassOverBg2,
      glassStack: lightSurfaces.surfaceFillOverGlassOverBg2,
    })
  })

  it('faint tier passes on the surfaces where it renders (cards, glass)', () => {
    expectTiers(['--text-faint'], light, { card: lightSurfaces.card, glass: lightSurfaces.glassOverBg2 })
  })

  it('brand colors pass as text', () => {
    expectTiers(['--blue', '--gold', '--primary'], light, {
      bg: lightSurfaces.bg,
      bg2: lightSurfaces.bg2,
      card: lightSurfaces.card,
    })
  })

  it('status/accent tokens pass on cards and glass', () => {
    expectTiers(
      ['--ok', '--warn', '--danger', '--info', '--violet', '--teal', '--rose', '--indigo'],
      light,
      { card: lightSurfaces.card, glass: lightSurfaces.glassOverBg2 },
    )
  })

  it('company accent tokens pass on cards', () => {
    expectTiers(['--c-orange', '--c-indigo', '--gold'], light, { card: lightSurfaces.card })
  })

  it('muted-foreground holds AA even at 80% opacity (hero hints)', () => {
    expectContrast('--muted-foreground @ 0.8', composite('rgba(65, 79, 102, 0.8)', lightSurfaces.bg), {
      bg: lightSurfaces.bg,
    })
  })
})

describe('Dark theme text tokens — WCAG AA (>= 4.5:1)', () => {
  it('full text ladder passes on bg, card, surface and elevated', () => {
    expectTiers(
      ['--text-primary', '--text-secondary', '--text-muted', '--text-subtle', '--text-faint', '--muted-foreground'],
      dark,
      darkSurfaces,
    )
  })

  it('brand and status tokens pass on cards', () => {
    expectTiers(['--blue', '--gold', '--primary', '--accent-foreground', '--ok', '--warn', '--danger', '--info', '--violet', '--teal', '--rose', '--indigo', '--c-orange', '--c-indigo'], dark, {
      card: darkSurfaces.card,
      bg: darkSurfaces.bg,
    })
  })
})

describe('Console scope (light theme) — dark identity must keep AA', () => {
  it('text ladder and shadcn foreground tokens pass on the dark console surface', () => {
    expectTiers(
      ['--text-primary', '--text-secondary', '--text-muted', '--text-subtle', '--text-faint', '--muted-foreground', '--foreground', '--secondary-foreground', '--accent-foreground'],
      consoleScope,
      { console: CONSOLE_BG },
    )
  })
})

/* ── Non-text contrast (WCAG 1.4.11 — UI component boundaries, >= 3:1) ── */

describe('Light theme interactive boundaries — WCAG 1.4.11 (>= 3:1)', () => {
  it('input boundary passes on bg, bg2 and cards', () => {
    expectBoundary('--input', light['--input'], {
      bg: lightSurfaces.bg,
      bg2: lightSurfaces.bg2,
      card: lightSurfaces.card,
    })
  })

  it('interactive border passes on bg, bg2 and cards', () => {
    expectBoundary('--border-interactive', light['--border-interactive'], {
      bg: lightSurfaces.bg,
      bg2: lightSurfaces.bg2,
      card: lightSurfaces.card,
    })
  })

  it('focus ring passes on bg, bg2 and cards', () => {
    expectBoundary('--ring', light['--ring'], {
      bg: lightSurfaces.bg,
      bg2: lightSurfaces.bg2,
      card: lightSurfaces.card,
    })
  })
})

describe('Dark theme interactive boundaries — WCAG 1.4.11 (>= 3:1)', () => {
  it('input / interactive border / focus ring pass on bg, card and surface', () => {
    /* elevated is a hover surface, not a resting boundary background */
    const surfaces = { bg: darkSurfaces.bg, card: darkSurfaces.card, surface: darkSurfaces.surface }
    expectBoundary('--input', dark['--input'], surfaces)
    expectBoundary('--border-interactive', dark['--border-interactive'], surfaces)
    expectBoundary('--ring', dark['--ring'], surfaces)
  })
})

describe('Console scope interactive boundaries — WCAG 1.4.11 (>= 3:1)', () => {
  it('input / interactive border / focus ring pass on the dark console surface', () => {
    expectBoundary('--input', consoleScope['--input'], { console: CONSOLE_BG })
    expectBoundary('--border-interactive', consoleScope['--border-interactive'], { console: CONSOLE_BG })
    expectBoundary('--ring', consoleScope['--ring'], { console: CONSOLE_BG })
  })
})

describe('Sanity — tokens referenced by the audit actually exist', () => {
  it('every audited token is defined in the CSS', () => {
    const needed = [
      '--text-primary', '--text-secondary', '--text-muted', '--text-subtle', '--text-faint',
      '--muted-foreground', '--foreground', '--secondary-foreground', '--accent-foreground',
      '--blue', '--gold', '--primary', '--ok', '--warn', '--danger', '--info',
      '--violet', '--teal', '--rose', '--indigo', '--c-orange', '--c-indigo',
      '--surface-fill', '--glass-bg', '--card', '--bg2', '--surface', '--surface-elevated',
      '--input', '--ring', '--border-interactive',
    ]
    for (const token of needed) {
      expect(token in light || token in dark, `${token} must be defined in :root or .dark`).toBe(true)
    }
  })
})
