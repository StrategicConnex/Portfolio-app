import { test, expect } from '@playwright/test';

test.describe('Contact Section', () => {
  test('should display contact section with all action cards', async ({ page }) => {
    await page.goto('/');
    
    // Scroll down to contact section to trigger lazy-loaded components
    const contacto = page.locator('#contacto');
    await contacto.scrollIntoViewIfNeeded();
    await expect(contacto).toBeVisible({ timeout: 5000 });
    
    // Verify the section header is visible
    const header = contacto.locator('h2');
    await expect(header).toBeVisible();
    await expect(header).toContainText(/Contact|Contacto|Direct/i);
    
    // Verify all 3 action cards are present
    // LinkedIn card
    const linkedinCard = contacto.locator('a[href*="linkedin.com"]').first();
    await expect(linkedinCard).toBeVisible();
    await expect(linkedinCard).toHaveAttribute('target', '_blank');
    await expect(linkedinCard).toHaveAttribute('rel', 'noopener noreferrer');
    
    // Download CV card
    const cvCard = contacto.locator('a[download], a[href$=".pdf"]').first();
    await expect(cvCard).toBeVisible();
    const cvHref = await cvCard.getAttribute('href');
    expect(cvHref).toMatch(/\.pdf$/i);
    
    // Credly card
    const credlyCard = contacto.locator('a[href*="credly.com"]').first();
    await expect(credlyCard).toBeVisible();
    await expect(credlyCard).toHaveAttribute('target', '_blank');
    await expect(credlyCard).toHaveAttribute('rel', 'noopener noreferrer');
  });

  test('should scroll to contact section when clicking contact nav link', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Find the nav link that leads to #contacto — the text depends on current language
    const navLink = page.locator('nav a[href="#contacto"]').first();
    await expect(navLink).toBeVisible({ timeout: 5000 });
    
    // Click the nav link
    await navLink.click();
    
    // Verify the contact section is in view by checking scroll position
    await page.waitForTimeout(800); // Wait for smooth scroll animation
    const contacto = page.locator('#contacto');
    await expect(contacto).toBeVisible();
    
    // Verify scroll position has changed from the top
    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBeGreaterThan(100);
  });

  test('should display availability badge', async ({ page }) => {
    await page.goto('/');
    const contacto = page.locator('#contacto');
    await contacto.scrollIntoViewIfNeeded();
    
    // Find the availability badge — text varies by language (Disponible/Available)
    const badge = contacto.locator('text=/Disponible|Available|proyectos|projects/i').first();
    await expect(badge).toBeVisible({ timeout: 5000 });
  });

  test('should have correct URLs on action cards', async ({ page }) => {
    await page.goto('/');
    const contacto = page.locator('#contacto');
    await contacto.scrollIntoViewIfNeeded();
    
    // Verify LinkedIn link goes to the right URL
    const linkedinCard = contacto.locator('a[href*="linkedin.com"]').first();
    const linkedinHref = await linkedinCard.getAttribute('href');
    expect(linkedinHref).toContain('linkedin.com/in/juanfpalacios');
    
    // Verify Credly link goes to the right URL
    const credlyCard = contacto.locator('a[href*="credly.com"]').first();
    const credlyHref = await credlyCard.getAttribute('href');
    expect(credlyHref).toContain('credly.com/users/juan-palacios');
    
    // Verify CV download link has download attribute and href points to a PDF
    const cvCard = contacto.locator('a[download]').first();
    await expect(cvCard).toHaveAttribute('download', '');
    const cvHref = await cvCard.getAttribute('href');
    expect(cvHref).toMatch(/\.pdf$/i);
  });

  test('should maintain responsive layout', async ({ page }) => {
    // Test on mobile viewport
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    const contacto = page.locator('#contacto');
    await contacto.scrollIntoViewIfNeeded();
    
    // Cards should stack vertically on mobile — use known action card selectors
    const linkedinCard = contacto.locator('a[href*="linkedin.com"]');
    const cvCard = contacto.locator('a[download]');
    const credlyCard = contacto.locator('a[href*="credly.com"]');
    
    await expect(linkedinCard).toBeVisible();
    await expect(cvCard).toBeVisible();
    await expect(credlyCard).toBeVisible();
    
    // Each card should be tappable on mobile (clickable)
    await expect(linkedinCard).toBeEnabled();
    await expect(cvCard).toBeEnabled();
    await expect(credlyCard).toBeEnabled();
  });
});
