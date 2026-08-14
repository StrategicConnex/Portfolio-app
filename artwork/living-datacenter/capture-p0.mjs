/**
 * Capturas por escena para el audit de diseño P0 — playwright + sharp.
 * Uso: node capture-p0.mjs [base] [outDir] [label]
 *   base   → URL del server (default http://localhost:3100)
 *   outDir → relativo a artwork/living-datacenter/ (default refcheck/p0-before)
 *   label  → sufijo de archivo (default 'before')
 * Escribe <outDir>/S{n}-*.png + <outDir>/result.json (stats por escena).
 */
import { chromium } from 'playwright';
import sharp from 'sharp';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const base = process.argv[2] || 'http://localhost:3100';
const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(here, process.argv[3] || 'refcheck/p0-before');
const label = process.argv[4] || 'before';

// Escenas → sección DOM representativa del tramo de cámara (SCENES en scenes.ts).
const SCENES = [
  { id: 'S1-boot', section: 'home' },
  { id: 'S2-core', section: 'arquitectura' },
  { id: 'S3-data', section: 'siem' },
  { id: 'S4-resilience', section: 'audit-hub' },
  { id: 'S5-connection', section: 'contacto' },
];

async function stats(file) {
  const { data, info } = await sharp(file).resize(640).raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h, channels: ch } = info;
  let lum = 0, dark = 0, n = 0, sat = 0;
  for (let y = 0; y < h; y += 2) {
    for (let x = 0; x < w; x += 2) {
      const i = (y * w + x) * ch;
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const L = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      lum += L; n++;
      if (L < 40) dark++;
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
      sat += mx === 0 ? 0 : (mx - mn) / mx;
    }
  }
  return {
    meanLum: +(lum / n).toFixed(1),
    darkPct: +((dark / n) * 100).toFixed(1),
    meanSat: +(sat / n).toFixed(3),
  };
}

const browser = await chromium.launch();
try {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 160)); });
  page.on('pageerror', (e) => errors.push(String(e).slice(0, 160)));

  await page.goto(base, { waitUntil: 'networkidle', timeout: 90000 });
  await page.waitForSelector('[data-testid="datacenter-canvas"]', { timeout: 90000 });
  await page.waitForTimeout(3000);

  const shots = [];
  for (const sc of SCENES) {
    if (sc.section === 'home') {
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    } else {
      await page.evaluate((id) => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ block: 'center', behavior: 'instant' });
      }, sc.section);
    }
    // Spring de cámara + settle (SPEC §6, 650 ms) + micro-anims del driver.
    await page.waitForTimeout(6500);
    const file = path.resolve(OUT, `${sc.id}-${label}.png`);
    await page.screenshot({ path: file });
    shots.push({
      id: sc.id,
      section: sc.section,
      file: path.basename(file),
      stats: await stats(file),
    });
  }

  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(
    path.resolve(OUT, 'result.json'),
    JSON.stringify({ label, date: new Date().toISOString(), shots, errors: errors.slice(0, 6) }, null, 2),
  );
  console.log(JSON.stringify(shots, null, 2));
  console.log(`consoleErrors: ${errors.length}`);
} finally {
  await browser.close();
}
