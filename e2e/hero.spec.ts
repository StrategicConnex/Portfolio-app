import { test, expect } from '@playwright/test';

test.describe('Hero Section', () => {
  test('should display the main heading', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should display the subtitle', async ({ page }) => {
    await page.goto('/');
    // Hero typically contains name and title
    const heroText = page.locator('section').first();
    await expect(heroText).toBeVisible();
  });

  test('should have a visible Navbar', async ({ page }) => {
    await page.goto('/');
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();
  });
});
