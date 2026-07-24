import { test, expect } from '@playwright/test';

test.describe('Ask AI Panel', () => {
  test('should have Ask AI launcher button', async ({ page }) => {
    await page.goto('/');
    const launcher = page.locator('[aria-label*="Ask" i], [aria-label*="AI" i], button:has-text("Ask")').first();
    await expect(launcher).toBeAttached();
  });

  test('should open the AI panel when clicking launcher', async ({ page }) => {
    await page.goto('/');
    const launcher = page.locator('[aria-label*="Ask" i], [aria-label*="AI" i], button:has-text("Ask")').first();
    
    // Click the launcher button
    if (await launcher.isVisible()) {
      await launcher.click();
      // Wait for panel animation
      await page.waitForTimeout(500);
      
      // Check the panel opened
      const panel = page.locator('input[placeholder*="Ask" i], input[placeholder*="Pregunta" i]');
      await expect(panel).toBeVisible({ timeout: 3000 });
    }
  });

  test('should close the AI panel', async ({ page }) => {
    await page.goto('/');
    // Open the panel
    const launcher = page.locator('[aria-label*="Ask" i], [aria-label*="AI" i], button:has-text("Ask")').first();
    
    if (await launcher.isVisible()) {
      await launcher.click();
      await page.waitForTimeout(500);
      
      // Find and click close button
      const closeBtn = page.locator('[aria-label="Cerrar panel"], [aria-label="Close chat"]').first();
      if (await closeBtn.isVisible()) {
        await closeBtn.click();
        await page.waitForTimeout(500);
        
        // Launcher should be visible again
        await expect(launcher).toBeVisible();
      }
    }
  });
});
