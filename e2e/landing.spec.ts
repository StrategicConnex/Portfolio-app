import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('should load without console errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    
    // No console errors should be present
    expect(consoleErrors.length).toBe(0);
  });

  test('should have correct page title', async ({ page }) => {
    await page.goto('/');
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });

  test('should have meta description', async ({ page }) => {
    await page.goto('/');
    const metaDesc = page.locator('meta[name="description"]');
    await expect(metaDesc).toBeAttached();
    const content = await metaDesc.getAttribute('content');
    expect(content?.length).toBeGreaterThan(0);
  });

  test('should have a footer', async ({ page }) => {
    await page.goto('/');
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
  });
});
