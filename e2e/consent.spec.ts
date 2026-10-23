import { test, expect } from '@playwright/test'

const bannerName = /preferencias de cookies|cookie preferences/i
const acceptName = /aceptar|accept/i
const declineName = /rechazar|decline/i
const prefsName = /^(cookies|cookie settings)$/i

test.describe('Consent banner (M-05)', () => {
  test('asks before loading analytics and persists a rejection', async ({ page, context }) => {
    await page.goto('/')

    const banner = page.getByRole('region', { name: bannerName })
    await expect(banner).toBeVisible()

    await page.getByRole('button', { name: declineName }).click()
    await expect(banner).toHaveCount(0)

    const cookies = await context.cookies()
    expect(cookies.find((c) => c.name === 'portfolio_consent')?.value).toBe('denied')

    await page.reload()
    await expect(page.getByRole('region', { name: bannerName })).toHaveCount(0)
  })

  test('accepts and can reopen the preferences from the footer', async ({ page }) => {
    await page.goto('/')

    await page.getByRole('button', { name: acceptName }).click()
    await expect(page.getByRole('region', { name: bannerName })).toHaveCount(0)

    await page.getByRole('button', { name: prefsName }).click()
    await expect(page.getByRole('region', { name: bannerName })).toBeVisible()
  })
})
