import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Guard of the CI quality gates' *thresholds themselves*.
 *
 * The real enforcement lives in CI (`lhci assert` fails the Lighthouse job;
 * `e2e/accessibility.spec.ts` fails the e2e job on critical/serious axe
 * violations). This test makes it impossible to silently weaken those
 * thresholds: any change to the budget shows up as a failed unit test too,
 * so it must be an explicit, reviewed decision.
 */

const config = JSON.parse(readFileSync(join(process.cwd(), 'lighthouserc.json'), 'utf8')) as {
  ci: {
    collect: { url: string[] }
    assert: { assertions: Record<string, [string, { minScore: number }]> }
  }
}

describe('lighthouserc quality budget', () => {
  it('keeps the minimum category scores at the agreed budget', () => {
    const assertions = config.ci.assert.assertions
    const budget: Record<string, number> = {
      'categories:performance': 0.35,
      'categories:accessibility': 0.9,
      'categories:best-practices': 0.8,
      'categories:seo': 0.9,
    }
    for (const [key, minScore] of Object.entries(budget)) {
      expect(assertions[key], `${key} must stay defined`).toBeDefined()
      expect(assertions[key][0], `${key} must be an "error" (build-blocking) assertion`).toBe('error')
      expect(
        assertions[key][1].minScore,
        `${key} minScore was lowered below the agreed budget — raising/lowering it is a team decision, not a quick fix`,
      ).toBeGreaterThanOrEqual(minScore)
    }
  })

  it('audits every public index route, not only the home page', () => {
    const urls = config.ci.collect.url
    expect(urls.some((u) => u.endsWith('/'))).toBe(true)
    expect(urls.some((u) => u.endsWith('/recursos'))).toBe(true)
    expect(urls.some((u) => u.endsWith('/estadisticas'))).toBe(true)
  })
})
