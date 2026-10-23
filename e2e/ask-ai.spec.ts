import { test, expect, type Page } from '@playwright/test';

// Exact aria-label — the fuzzy `[aria-label*="AI" i]` also matches the course
// buttons in the Certifications section ("View AI for Malware Analysis…"),
// which come earlier in the DOM, so `.first()` clicked a course modal instead
// of the launcher (that was the historical cold-start flake).
const launcherSel = '[aria-label="Tanos AI"]';
const panelInputSel = 'input[placeholder*="Ask" i], input[placeholder*="Pregunta" i]';
const closeBtnSel = '[aria-label="Cerrar panel"], [aria-label="Close panel"]';

/**
 * Click the launcher and wait for the panel. The launcher is visible in SSR
 * HTML before React hydrates, so a click can be lost under load — wait for
 * the client bundle, then retry until the panel actually opens.
 */
async function openPanel(page: Page) {
  const launcher = page.locator(launcherSel);
  const panel = page.locator(panelInputSel);

  // Hydration gate: `load` (not `networkidle` — the home polls the threat
  // feed, so the network never idles). The retry loop below covers clicks
  // that land before the client bundle attaches.
  await page.waitForLoadState('load');
  await page.waitForTimeout(500);
  await expect(launcher).toBeVisible();

  for (let attempt = 0; attempt < 6; attempt++) {
    // The launcher unmounts as soon as the panel opens, so an otherwise
    // successful click can time out waiting for actionability. Swallow that
    // and let the visibility check below decide whether the panel opened.
    try {
      await launcher.click({ timeout: 5_000 });
    } catch {
      // Click may have landed pre-hydration or the launcher detached on open.
    }
    try {
      await expect(panel).toBeVisible({ timeout: 3_000 });
      return;
    } catch {
      await page.waitForTimeout(700);
    }
  }
  await expect(panel).toBeVisible();
}

test.describe('Ask AI Panel', () => {
  test('should have Ask AI launcher button', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator(launcherSel)).toBeVisible();
  });

  test('should open the AI panel when clicking launcher', async ({ page }) => {
    await page.goto('/');
    await openPanel(page);
  });

  test('should close the AI panel', async ({ page }) => {
    await page.goto('/');
    await openPanel(page);

    // Find and click close button
    const closeBtn = page.locator(closeBtnSel).first();
    await expect(closeBtn).toBeVisible();
    await closeBtn.click();

    // Launcher should be visible again
    await expect(page.locator(launcherSel)).toBeVisible();
  });
});
