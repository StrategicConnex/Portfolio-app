/**
 * A/B del corte físico (P7a.1): mismo scroll en S4 → misma cámara y MISMOS
 * materiales en ambas builds; la única diferencia entre motion ON (actual) y
 * OFF (P7 color-only, FailoverStreams revertido) es la POSICIÓN del tráfico
 * de A. El diff filtrado por hue ámbar aísla el re-ruteo físico de la
 * varianza del polvo (neutra). Estados: fault (scaudit start, sp≈0.33),
 * dead (scaudit center, sp≈0.5), recover (blog start, sp≈0.67).
 * Uso: node ab-failover-motion.mjs <tag>
 */
import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const tag = process.argv[2] || 'on'
const OUT = path.resolve(here, `refcheck/p7a1-ab/${tag}`)
fs.mkdirSync(OUT, { recursive: true })

const STATES = [
  { name: 'fault', fn: () => document.getElementById('scaudit')?.scrollIntoView({ block: 'start', behavior: 'instant' }) },
  { name: 'dead', fn: () => document.getElementById('scaudit')?.scrollIntoView({ block: 'center', behavior: 'instant' }) },
  { name: 'recover', fn: () => document.getElementById('blog')?.scrollIntoView({ block: 'start', behavior: 'instant' }) },
]

const browser = await chromium.launch()
try {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  await page.goto('http://localhost:3100', { waitUntil: 'networkidle', timeout: 90000 })
  await page.waitForSelector('[data-testid="datacenter-canvas"]', { timeout: 90000 })
  await page.waitForTimeout(3000)
  for (const s of STATES) {
    await page.evaluate(s.fn)
    await page.waitForTimeout(7500)
    await page.locator('[data-testid="datacenter-canvas"]').screenshot({ path: path.join(OUT, `${s.name}.png`) })
  }
  console.log('capturas:', tag, 'listas')
} finally {
  await browser.close()
}
