/**
 * Validación P7d — FOTÓN (hilo de continuidad). El fotón es la ÚNICA fuente
 * en el canvas cuyo color sigue el arco de temperatura por escena (azul →
 * cian → ámbar → champagne); los streams son SIEMPRE cian y el Phase Gate es
 * DOM (no entra en el screenshot del canvas). Por eso el discriminador es el
 * HUE del píxel brillante y saturado dominante en el CANVAS PURO por escena:
 *   S1 ≈ azul (220-250°), S3 ≈ cian (175-200°), S4 ≈ ámbar (30-50°),
 *   S5 ≈ champagne/dorado (35-60°).
 * Adicionalmente: S5 (llegada) debe mostrar un blob cálido (el bloom del
 * clímax) y la consola no debe tener errores nuevos.
 * Uso: node validate-p7d.mjs [base] [outDir]
 */
import { chromium } from 'playwright'
import sharp from 'sharp'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const base = process.argv[2] || 'http://localhost:3100'
const here = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.resolve(here, process.argv[3] || 'refcheck/p7d-photon')
fs.mkdirSync(OUT, { recursive: true })

const SCENES = [
  { id: 'S1', section: 'home', expect: 'azul', hueMin: 210, hueMax: 255 },
  { id: 'S2', section: 'arquitectura', expect: 'cielo', hueMin: 175, hueMax: 210 },
  { id: 'S3', section: 'siem', expect: 'cian', hueMin: 170, hueMax: 200 },
  { id: 'S4', section: 'audit-hub', expect: 'ámbar', hueMin: 28, hueMax: 55 },
  { id: 'S5', section: 'contacto', expect: 'champagne', hueMin: 32, hueMax: 60 },
]

function rgbHue(r, g, b) {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b)
  if (mx === mn) return 0
  let hue = 0
  if (mx === r) hue = ((g - b) / (mx - mn)) % 6
  else if (mx === g) hue = (b - r) / (mx - mn) + 2
  else hue = (r - g) / (mx - mn) + 4
  hue = Math.round(hue * 60)
  return hue < 0 ? hue + 360 : hue
}

async function dominantHue(file) {
  const { data, info } = await sharp(file).raw().toBuffer({ resolveWithObject: true })
  const { width: w, height: h, channels: ch } = info
  // El fotón es glow ADITIVO: su cabeza está entre lo MÁS brillante del frame.
  // Tomamos el hue de los ~300 píxeles de mayor luminancia (excluyendo blancos
  // puros — especulares del env — que no tienen hue) y su posición media.
  const TOP = 300
  const top = []
  let maxV = -1, maxRgb = null
  for (let i = 0; i < w * h; i++) {
    const r = data[i * ch], g = data[i * ch + 1], b = data[i * ch + 2]
    const v = 0.2126 * r + 0.7152 * g + 0.0722 * b
    if (v > maxV) { maxV = v; maxRgb = [r, g, b] }
    if (top.length < TOP) {
      top.push({ v, r, g, b, x: i % w, y: Math.floor(i / w) })
      top.sort((a, b) => b.v - a.v)
    } else if (v > top[top.length - 1].v) {
      top[top.length - 1] = { v, r, g, b, x: i % w, y: Math.floor(i / w) }
      top.sort((a, b) => b.v - a.v)
    }
  }
  const lit = top.filter((p) => !(p.r > 235 && p.g > 235 && p.b > 235)) // sin especulares puros
  if (lit.length === 0) return { hue: null, count: 0, brightest: maxRgb }
  let rSum = 0, gSum = 0, bSum = 0, cx = 0, cy = 0
  for (const p of lit) { rSum += p.r; gSum += p.g; bSum += p.b; cx += p.x; cy += p.y }
  const n = lit.length
  return {
    hue: rgbHue(rSum / n, gSum / n, bSum / n),
    count: n,
    avg: [Math.round(rSum / n), Math.round(gSum / n), Math.round(bSum / n)],
    brightest: maxRgb,
    centroid: [Math.round(cx / n), Math.round(cy / n)],
  }
}

const browser = await chromium.launch()
try {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  const errors = []
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 120)) })
  page.on('pageerror', (e) => errors.push(String(e).slice(0, 120)))

  await page.goto(base, { waitUntil: 'networkidle', timeout: 90000 })
  await page.waitForSelector('[data-testid="datacenter-canvas"]', { timeout: 90000 })
  await page.waitForTimeout(3000)

  const scenes = []
  for (const sc of SCENES) {
    if (sc.section === 'home') await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
    else await page.evaluate((id) => document.getElementById(id)?.scrollIntoView({ block: 'center', behavior: 'instant' }), sc.section)
    await page.waitForTimeout(6500)
    const file = path.resolve(OUT, `${sc.id}-canvas.png`)
    await page.locator('[data-testid="datacenter-canvas"]').screenshot({ path: file })
    const hue = await dominantHue(file)
    const ok = hue.hue !== null && hue.hue >= sc.hueMin && hue.hue <= sc.hueMax
    scenes.push({ id: sc.id, section: sc.section, expect: sc.expect, ...hue, ok })
  }

  // Llegada: el bloom del fotón en S5 (blob cálido) vs nacimiento S1
  const blob = async (file) => {
    const { data, info } = await sharp(file).raw().toBuffer({ resolveWithObject: true })
    const { width: w, height: h, channels: ch } = info
    let warm = 0, n = 0
    for (let y = 0; y < h; y += 2) for (let x = 0; x < w; x += 2) {
      const i = (y * w + x) * ch
      const r = data[i], g = data[i + 1], b = data[i + 2]
      if (r > 150 && g > 100 && b < 150 && r > b + 50) warm++ // cálido brillante
      n++
    }
    return +((warm / n) * 100).toFixed(3)
  }
  const arrival = { s1WarmPct: await blob(path.join(OUT, 'S1-canvas.png')), s5WarmPct: await blob(path.join(OUT, 'S5-canvas.png')) }
  arrival.bloom = arrival.s5WarmPct > arrival.s1WarmPct + 0.05

  const result = {
    date: new Date().toISOString(),
    scenes,
    scenesOk: scenes.filter((s) => s.ok).length,
    arrival,
    consoleErrors: errors.filter((e) => !e.includes('telemetry/vitals') && !e.includes('ERR_FAILED')).slice(0, 5),
  }
  fs.writeFileSync(path.join(OUT, 'result.json'), JSON.stringify(result, null, 2))
  console.log(JSON.stringify(result, null, 2))
} finally {
  await browser.close()
}
