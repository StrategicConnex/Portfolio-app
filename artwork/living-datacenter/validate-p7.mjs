/**
 * Validación P7a+P7c (storyline: eje Purdue en HUD + failover visible en S4).
 *   P7c — por escena, el label de escena muestra `NIVEL 0X · NOMBRE` (Purdue
 *         IEC 62443) bajo el `FASE 0n/05`.
 *   P7a — en S4 (resilience), el evento failover es determinístico por
 *         progreso de escena: sampleamos el progreso real de la cámara y lo
 *         contrastamos con la función pura `failoverEvent`; además capturamos
 *         el canvas en la ventana dead (primary muerta) y medimos ámbar/rojo
 *         en la fila de storage (el corte → reroute se lee en color).
 * Uso: node validate-p7.mjs [base] [outDir]
 */
import { chromium } from 'playwright'
import sharp from 'sharp'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const base = process.argv[2] || 'http://localhost:3100'
const here = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.resolve(here, process.argv[3] || 'refcheck/p7-storyline')
fs.mkdirSync(OUT, { recursive: true })

const EXPECT = [
  { section: 'home', scene: 0, level: '04', name: 'EMPRESA' },
  { section: 'arquitectura', scene: 1, level: '03', name: 'OPERACIONES' },
  { section: 'siem', scene: 2, level: '03.5', name: 'DMZ' },
  { section: 'audit-hub', scene: 3, level: '01', name: 'CONTROL' },
  { section: 'contacto', scene: 4, level: '05', name: 'INTERNET' },
]

async function amberStats(file) {
  // % de píxeles ámbar/rojo (fault: amber #f59e0b, dead: dark red #7f1d1d) en
  // la mitad inferior del frame (fila de storage de S4).
  const { data, info } = await sharp(file).resize(640).raw().toBuffer({ resolveWithObject: true })
  const { width: w, height: h, channels: ch } = info
  let amber = 0, red = 0, n = 0
  for (let y = Math.floor(h * 0.55); y < h; y += 2) {
    for (let x = 0; x < w; x += 2) {
      const i = (y * w + x) * ch
      const r = data[i], g = data[i + 1], b = data[i + 2]
      if (r > 130 && g > 70 && b < 90 && r - b > 80) amber++ // ámbar caliente
      if (r > 90 && g < 70 && b < 80 && r > g + 40) red++ // rojo oscuro
      n++
    }
  }
  return { amberPct: +((amber / n) * 100).toFixed(2), redPct: +((red / n) * 100).toFixed(2) }
}

const browser = await chromium.launch()
try {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  const errors = []
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 140)) })
  page.on('pageerror', (e) => errors.push(String(e).slice(0, 140)))

  await page.goto(base, { waitUntil: 'networkidle', timeout: 90000 })
  await page.waitForSelector('[data-testid="datacenter-canvas"]', { timeout: 90000 })
  await page.waitForTimeout(3000)

  // P7c — línea Purdue en el HUD por escena
  const purdue = []
  for (const e of EXPECT) {
    if (e.section === 'home') await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
    else await page.evaluate((id) => document.getElementById(id)?.scrollIntoView({ block: 'center', behavior: 'instant' }), e.section)
    await page.waitForTimeout(6500)
    const label = await page.evaluate((scene) => {
      const els = Array.from(document.querySelectorAll('[data-testid="hud-label"]'))
      const el = els.find((x) => (x.textContent || '').includes(`FASE ${String(scene + 1).padStart(2, '0')}/05`))
      return el ? (el.textContent || '').replace(/\s+/g, ' ').trim() : null
    }, e.scene)
    purdue.push({ scene: e.scene, section: e.section, expected: `NIVEL ${e.level} · ${e.name}`, found: label?.match(/NIVEL [\d.]+ · \S+/)?.[0] || null, ok: !!label?.includes(`NIVEL ${e.level} · ${e.name}`) })
  }

  // P7a — failover en S4: muestreo del progreso de escena y colores en la
  // ventana dead (primary muerta, backup transporta todo). S4 = 3 secciones
  // (audit-hub, scaudit, blog); el evento va fault@0.3 → dead@0.48 →
  // recover@0.62 → restored@0.8. Se scrollea HACIA ABAJO desde el tope de
  // audit-hub para cruzar la ventana del evento y se muestrea el progreso
  // real con la MISMA lógica de midpoint de useSectionProgress.
  const S4_SECTIONS = ['audit-hub', 'scaudit', 'blog']
  const TL = { faultStart: 0.3, deadStart: 0.48, recoverStart: 0.62, restored: 0.8 }
  const failoverState = (p) => {
    if (p < TL.faultStart) return 'normal'
    if (p < TL.deadStart) return 'fault'
    if (p < TL.recoverStart) return 'dead'
    if (p < TL.restored) return 'recover'
    return 'restored'
  }
  await page.evaluate(() => {
    const el = document.getElementById('audit-hub')
    el?.scrollIntoView({ block: 'start', behavior: 'instant' })
  })
  await page.waitForTimeout(7000)
  const failover = []
  for (let step = 0; step < 14; step++) {
    await page.evaluate(() => window.scrollBy(0, Math.round(window.innerHeight * 0.09)))
    await page.waitForTimeout(3200)
    // Progreso real de la escena S4 (midpoint del centro del viewport).
    const prog = await page.evaluate((ids) => {
      const vh = window.innerHeight
      const center = vh / 2
      let best = -1
      let bestDist = Infinity
      for (let i = 0; i < ids.length; i++) {
        const el = document.getElementById(ids[i])
        if (!el) continue
        const rect = el.getBoundingClientRect()
        if (rect.height <= 0) continue
        const d = Math.abs(center - (rect.top + rect.height / 2))
        if (d < bestDist) { bestDist = d; best = i }
      }
      if (best === -1) return -1
      const rect = document.getElementById(ids[best]).getBoundingClientRect()
      const sp = Math.min(1, Math.max(0, (center - rect.top) / rect.height))
      return (best + sp) / ids.length
    }, S4_SECTIONS)
    const file = path.resolve(OUT, `s4-step-${step}.png`)
    await page.screenshot({ path: file })
    const st = await amberStats(file)
    failover.push({ step, progress: +(prog * 100).toFixed(1), state: prog >= 0 ? failoverState(prog) : '?', ...st })
  }
  const sawAmber = failover.some((f) => f.amberPct > 0.12)
  const sawRed = failover.some((f) => f.redPct > 0.1)

  const result = {
    date: new Date().toISOString(),
    purdue,
    purdueAllOk: purdue.every((p) => p.ok),
    failover: { samples: failover, sawAmber, sawRed, pass: sawAmber || sawRed },
    consoleErrors: errors.slice(0, 5),
  }
  fs.writeFileSync(path.join(OUT, 'result.json'), JSON.stringify(result, null, 2))
  console.log(JSON.stringify(result, null, 2))
} finally {
  await browser.close()
}
