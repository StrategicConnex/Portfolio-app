import { test, expect } from '@playwright/test';

test.describe('Theme switcher', () => {
  const group = (page: import('@playwright/test').Page) =>
    page.getByRole('group', { name: /tema|theme/i });

  test('paints a resolved theme class before interaction (no-flash gate)', async ({ page }) => {
    await page.goto('/');
    // The inline head script must have applied one of the two classes
    // synchronously — the page never renders without a theme.
    const cls = await page.evaluate(() => document.documentElement.className);
    expect(cls).toMatch(/\b(light|dark)\b/);
  });

  test('switches to dark, persists the cookie and survives reload', async ({ page }) => {
    await page.goto('/');
    await group(page).getByRole('button', { name: /oscuro|dark/i }).click();
    await expect(page.locator('html')).toHaveClass(/\bdark\b/);
    const colorScheme = await page.evaluate(
      () => document.documentElement.style.colorScheme,
    );
    expect(colorScheme).toBe('dark');

    const theme = (await page.context().cookies()).find(
      (c) => c.name === 'portfolio_theme',
    );
    expect(theme?.value).toBe('dark');

    // Persistence: a reload keeps the choice (no flash back to default).
    await page.reload();
    await expect(page.locator('html')).toHaveClass(/\bdark\b/);
  });

  test('switches to light with a light body surface', async ({ page }) => {
    await page.goto('/');
    await group(page).getByRole('button', { name: /claro|light/i }).click();
    await expect(page.locator('html')).toHaveClass(/\blight\b/);

    const bg = await page.evaluate(
      () => getComputedStyle(document.body).backgroundColor,
    );
    const rgb = bg.match(/\d+/g)?.map(Number) ?? [];
    const average = rgb.length === 3 ? (rgb[0] + rgb[1] + rgb[2]) / 3 : 255;
    expect(average).toBeGreaterThan(200); // light surface, not the dark console
  });

  test('system mode follows the OS preference', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');
    await expect(page.locator('html')).toHaveClass(/\bdark\b/);

    await group(page).getByRole('button', { name: /claro|light/i }).click();
    await expect(page.locator('html')).toHaveClass(/\blight\b/);

    await group(page).getByRole('button', { name: /sistema|system/i }).click();
    await expect(page.locator('html')).toHaveClass(/\bdark\b/);
  });

  test('switching does not produce console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.goto('/');
    for (const label of [/sistema|system/i, /oscuro|dark/i, /claro|light/i]) {
      await group(page).getByRole('button', { name: label }).click();
    }
    expect(errors).toEqual([]);
  });
});
