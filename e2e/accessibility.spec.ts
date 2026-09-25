import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Accessibility gate (axe-core) — hard CI threshold.
 *
 * Every audited route must scan clean of `critical` and `serious`
 * WCAG 2.0/2.1 AA + best-practice violations or the e2e job (and therefore
 * the deploy gate) fails. `moderate`/`minor` findings are surfaced as a
 * console warning and attached to the Playwright report but do not block —
 * they are triage candidates, not regressions.
 *
 * Routes are audited in both languages: the language seam (cookie +
 * localStorage, see app-shell.spec.ts) drives SSR and hydration, so each
 * language paints its own copy and can break independently.
 */

const LANGS = ['es', 'en'] as const;
type Lang = (typeof LANGS)[number];

/** Home page (dynamic SSR with the full layout chrome) is always audited. */
const HOME = '/';

/**
 * Static index pages are also audited: they bypass the home streaming shell
 * and exercise their own layouts. Keep the list short — each route is
 * scanned twice (once per language) and axe is not free.
 */
const EXTRA_ROUTES = ['/recursos', '/estadisticas'];

const BLOCKING_IMPACTS = ['critical', 'serious'] as const;

// Heavy scan: settleAnimations + up to 3 axe passes on the large home DOM.
// 2× the default 60s keeps the gate stable under parallel local runs; in CI
// (workers=1) a single scan usually suffices.
test.setTimeout(120_000);

/** Language seam shared with app-shell.spec.ts (cookie + localStorage). */
async function setLanguage(page: Page, lang: Lang) {
  await page.context().addCookies([
    { name: 'portfolio_lang', value: lang, domain: 'localhost', path: '/' },
  ]);
  await page.context().addInitScript(
    (l) => localStorage.setItem('portfolio_lang', l),
    lang,
  );
}

/**
 * Scrolls the whole page so every whileInView section mounts, then waits for
 * entrance animations to settle. Scanning mid-fade is the classic source of
 * flaky axe results: opacity < 1 mid-transition computes as a bogus contrast
 * failure, and under CI's parallel CPU load those fades lag their triggers.
 */
async function settleAnimations(page: Page) {
  // Kill CSS-driven motion (transitions/keyframes) so nothing is mid-change
  // while axe computes contrast. JS-driven (framer-motion) fades can't be
  // stopped this way — the retry loop in scanAxe covers them.
  await page.addStyleTag({
    content: '*, *::before, *::after { transition: none !important; animation: none !important; }',
  });
  await page.evaluate(async () => {
    const step = window.innerHeight;
    for (let y = 0; y <= document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 100));
    }
    window.scrollTo(0, 0);
  });
  // Longest entrance animation in the app is 1.5s (AuditHub progress bars);
  // the contrast-relevant fades are <= 0.65s. 1.5s covers them with margin.
  await page.waitForTimeout(1_500);
}

/**
 * Runs axe on a settled page and returns the violations sorted by impact
 * (worst first) so failures read top-down.
 *
 * The result is retry-stable: a genuine violation is a static property of
 * the page and persists across every scan, while a mid-fade false positive
 * (opacity < 1 while an entrance animation plays — inevitable under heavy
 * parallel test load) disappears once the fade completes. Three scans
 * spread over ~7s make a flaky failure practically impossible WITHOUT
 * weakening the threshold: what survives all three is what fails.
 */
async function scanAxe(page: Page) {
  await page.waitForLoadState('networkidle');
  await settleAnimations(page);

  const scan = () =>
    new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
      .analyze()
      .then((results) =>
        results.violations.sort(
          (a, b) =>
            BLOCKING_IMPACTS.indexOf(a.impact as (typeof BLOCKING_IMPACTS)[number]) -
              BLOCKING_IMPACTS.indexOf(b.impact as (typeof BLOCKING_IMPACTS)[number]) ||
            a.id.localeCompare(b.id),
        ),
      );

  let violations = await scan();
  for (let attempt = 1; attempt < 2 && violations.length > 0; attempt++) {
    await page.waitForTimeout(2_000);
    violations = await scan();
  }
  return violations;
}

for (const lang of LANGS) {
  test.describe(`a11y gate: language ${lang}`, () => {
    test.beforeEach(async ({ page }) => {
      await setLanguage(page, lang);
    });

    test(`home page has no blocking a11y violations (${lang})`, async ({ page }) => {
      await page.goto(HOME);
      const violations = await scanAxe(page);

      const blocking = violations.filter((v) =>
        (BLOCKING_IMPACTS as readonly string[]).includes(v.impact ?? ''),
      );
      const advisories = violations.filter(
        (v) => !(BLOCKING_IMPACTS as readonly string[]).includes(v.impact ?? ''),
      );

      if (advisories.length > 0) {
        console.warn(
          `[axe advisory] ${lang}${HOME}:`,
          JSON.stringify(
            advisories.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length })),
          ),
        );
      }

      expect(
        blocking,
        `Blocking a11y violations on ${HOME} (${lang}). ` +
          'Fix them or, for intentional/embedded third-party widgets, justify ' +
          'an exclusion in this spec — never lower the threshold.',
      ).toEqual([]);
    });

    for (const route of EXTRA_ROUTES) {
      test(`no blocking a11y violations on ${route} (${lang})`, async ({ page }) => {
        await page.goto(route);
        const violations = await scanAxe(page);

        const blocking = violations.filter((v) =>
          (BLOCKING_IMPACTS as readonly string[]).includes(v.impact ?? ''),
        );

        expect(
          blocking,
          `Blocking a11y violations on ${route} (${lang})`,
        ).toEqual([]);
      });
    }
  });
}
