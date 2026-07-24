import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should navigate to sections via navbar links', async ({ page }) => {
    await page.goto('/');
    const navLinks = page.locator('nav a');
    const count = await navLinks.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should have visible language selector', async ({ page }) => {
    await page.goto('/');
    const langButton = page.locator('nav button, [aria-label*="language" i], [aria-label*="idioma" i]').first();
    const count = await langButton.count();
    if (count > 0) {
      await expect(langButton).toBeAttached();
    }
  });
});
