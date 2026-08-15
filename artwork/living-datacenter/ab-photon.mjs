/**
 * A/B del fotón (P7d): captura S1 y S4 con el fotón ON, y luego difiere contra
 * el baseline OFF (mismo build sin <StoryPhoton/>). El diff ON−OFF en la
 * región esperada es la huella EXACTA del fotón — la prueba decisiva de que
 * renderiza. Uso: node ab-photon.mjs <tag>
 */
import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const tag = process.argv[2] || 'on'
const OUT = path.resolve(here, `refcheck/p7d-ab/${tag}`)
fs.mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch()
try {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  const errors = []
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 120)) })
  await page.goto('http://localhost:3100', { waitUntil: 'networkidle', timeout: 90000 })
  await page.waitForSelector('[data-testid="datacenter-canvas"]', { timeout: 90000 })
  await page.waitForTimeout(3000)

  const shots = async (name, scrollExpr) => {
    await page.evaluate(scrollExpr)
    await page.waitForTimeout(7000)
    const file = path.join(OUT, `${name}.png`)
    await page.locator('[data-testid="datacenter-canvas"]').screenshot({ path: file })
    return file
  }

  await shots('S1', () => window.scrollTo({ top: 0, behavior: 'instant' }))
  await shots('S4', () => document.getElementById('audit-hub')?.scrollIntoView({ block: 'start', behavior: 'instant' }))
  await shots('S5', () => document.getElementById('contacto')?.scrollIntoView({ block: 'center', behavior: 'instant' }))

  console.log('capturas:', tag, 'listas — errores:', errors.filter((e) => !e.includes('telemetry')).length)
} finally {
  await browser.close()
}
