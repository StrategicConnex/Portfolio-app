import { test, expect, type Page } from '@playwright/test';

// Exact aria-label — the fuzzy `[aria-label*="AI" i]` also matches the course
// buttons in the Certifications section ("View AI for Malware Analysis…"),
// which come earlier in the DOM, so `.first()` clicked a course modal instead
// of the launcher (that was the historical cold-start flake).
const launcherSel = '[aria-label="Ask AI"]';
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

  // Let the client bundle finish loading before interacting (hydration gate)
  await page.waitForLoadState('networkidle');
  await expect(launcher).toBeVisible();

  for (let attempt = 0; attempt < 3; attempt++) {
    await launcher.click();
    try {
      await expect(panel).toBeVisible({ timeout: 5_000 });
      return;
    } catch {
      // Click may have landed pre-hydration — retry
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
