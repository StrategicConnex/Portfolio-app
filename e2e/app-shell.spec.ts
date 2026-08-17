import { test, expect, type Page } from '@playwright/test';

/**
 * App Router convention files: loading.tsx, error.tsx, not-found.tsx.
 *
 * The home page is deliberately dynamic (SSR i18n via cookies/headers,
 * see ADR-001), so the loading shell streams first and the error boundary
 * wraps the whole tree — both are observable end-to-end.
 *
 * The shell pages are language-aware via the language seam: the cookie
 * drives both SSR (`detectLanguageServer`) and hydration
 * (`detectLanguageClient`), so every assertion runs in both languages.
 * localStorage is the *deferred* preference channel — see the flash-free
 * test at the bottom.
 */

const LANGS = ['es', 'en'] as const;
type Lang = (typeof LANGS)[number];

const TEXTS: Record<
  Lang,
  {
    notFoundEyebrow: string;
    notFoundTitle: string;
    back: string;
    errorEyebrow: string;
    errorTitle: string;
    retry: string;
  }
> = {
  es: {
    notFoundEyebrow: 'Señal no encontrada',
    notFoundTitle: 'Esta coordenada no existe',
    back: 'Volver al inicio',
    errorEyebrow: 'Sistema degradado',
    errorTitle: 'Se interrumpió una sección del sitio',
    retry: 'Reintentar',
  },
  en: {
    notFoundEyebrow: 'Signal not found',
    notFoundTitle: 'This coordinate does not exist',
    back: 'Back to start',
    errorEyebrow: 'System degraded',
    errorTitle: 'A section of the site was interrupted',
    retry: 'Retry',
  },
};

/** Pin both sides of the language seam so SSR and hydration agree. */
async function setLanguage(page: Page, lang: Lang) {
  // Domain-based cookie (not url) so the spec is agnostic to the server port.
  await page.context().addCookies([
    { name: 'portfolio_lang', value: lang, domain: 'localhost', path: '/' },
  ]);
  await page.context().addInitScript(
    (l) => localStorage.setItem('portfolio_lang', l),
    lang,
  );
}

test.describe('App shell conventions', () => {
  test('loading shell streams before the dynamic home page', async ({ page }) => {
    const response = await page.goto('/');

    // The loading.tsx skeleton is the first thing streamed. Its hero bar
    // markup (`h-10 rounded-md animate-pulse`) is unique to loading.tsx and
    // must be present in the served HTML body.
    const html = await response!.text();
    expect(html).toContain('h-10 rounded-md animate-pulse');

    // The real page content eventually replaces the shell.
    await expect(page.locator('nav')).toBeVisible();
  });

  for (const lang of LANGS) {
    test.describe(`language: ${lang}`, () => {
      test.beforeEach(async ({ page }) => {
        await setLanguage(page, lang);
      });

      test(`root error boundary renders fallback UI (${lang})`, async ({ page }) => {
        // test-error always throws in dev; in production builds it throws
        // only when built with NEXT_PUBLIC_E2E_ERROR_ROUTE=1 (the CI e2e
        // job) and serves a 404 otherwise.
        await page.goto('/test-error');

        // In dev, Next layers its error overlay above the boundary fallback —
        // dismiss it so the fallback itself is what we assert on.
        const dismiss = page
          .locator('nextjs-portal')
          .getByRole('button', { name: /dismiss/i });
        if (await dismiss.count()) {
          await dismiss.click();
        }

        await expect(page.getByText(TEXTS[lang].errorEyebrow)).toBeVisible();
        await expect(
          page.getByRole('heading', { name: TEXTS[lang].errorTitle }),
        ).toBeVisible();
        await expect(
          page.getByRole('button', { name: TEXTS[lang].retry }),
        ).toBeVisible();
        await expect(
          page.getByRole('link', { name: TEXTS[lang].back }),
        ).toBeVisible();
      });

      test(`custom 404 renders for unknown routes (${lang})`, async ({ page }) => {
        const response = await page.goto('/coordenada-404');
        expect(response?.status()).toBe(404);

        await expect(page.getByText(TEXTS[lang].notFoundEyebrow)).toBeVisible();
        await expect(
          page.getByRole('heading', { name: TEXTS[lang].notFoundTitle }),
        ).toBeVisible();

        // The "back home" link resolves to the landing page.
        await page.getByRole('link', { name: TEXTS[lang].back }).click();
        await expect(page).toHaveURL(/\/$/);
        await expect(page.locator('nav')).toBeVisible();
      });
    });
  }

  test('keeps the SSR first paint when cookie and stored preference diverge', async ({ page }) => {
    // The classic flash scenario: the SSR cookie says "es" while the client's
    // stored preference says "en" (cookie expired/cleared, localStorage
    // survived). The first paint must stay Spanish — no post-hydration flip.
    await page.context().addCookies([
      { name: 'portfolio_lang', value: 'es', domain: 'localhost', path: '/' },
    ]);
    await page.addInitScript(() => localStorage.setItem('portfolio_lang', 'en'));

    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
    await expect(page.getByRole('link', { name: 'Perfil' })).toBeVisible();

    // The stored preference is preserved, not overwritten by SSR…
    expect(await page.evaluate(() => localStorage.getItem('portfolio_lang'))).toBe('en');
    // …but the cookie is re-established from it, so the NEXT request honors it.
    expect(await page.evaluate(() => document.cookie)).toContain('portfolio_lang=en');

    // Reload: SSR now reads the re-established cookie → English, still no flip.
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByRole('link', { name: 'Profile' })).toBeVisible();
  });
});
