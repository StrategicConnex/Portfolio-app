/**
 * Probe P4 — atravieso de racks + cull de Html labels tras la cámara.
 * Uso: node capture-p4.mjs [base] [outDir]
 *   1) Regresión por escena (5 capturas, stats vs p3-after).
 *   2) Tramo S3: dump de opacidad de [data-testid=hud-label] en 3 posiciones
 *      (mid-S3 · pass-through · exit profundo) + capturas.
 * Escribe <outDir>/S{n}-*.png, <outDir>/pass-*.png y <outDir>/result.json.
 */
import { chromium } from 'playwright';
import sharp from 'sharp';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const base = process.argv[2] || 'http://localhost:3100';
const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(here, process.argv[3] || 'refcheck/p4-passthrough');
fs.mkdirSync(OUT, { recursive: true });

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

// Dump de labels: texto + opacidad computada + scrollY + sección activa.
async function dumpLabels(page, tag) {
  return page.evaluate((t) => {
    const els = Array.from(document.querySelectorAll('[data-testid="hud-label"]'));
    return {
      tag: t,
      scrollY: window.scrollY,
      count: els.length,
      labels: els.map((el) => ({
        text: (el.textContent || '').replace(/\s+/g, ' ').slice(0, 42),
        opacity: getComputedStyle(el).opacity,
      })),
    };
  }, tag);
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

  // 1) Regresión por escena.
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
    await page.waitForTimeout(6500);
    const file = path.resolve(OUT, `${sc.id}-p4.png`);
    await page.screenshot({ path: file });
    shots.push({ id: sc.id, section: sc.section, file: path.basename(file), stats: await stats(file) });
  }

  // 2) Tramo S3 — cull de labels durante el atravieso.
  const passes = [];
  const passTargets = [
    { tag: 'S3-mid', section: 'experiencia', extra: 0 },      // frente a la columna de anillos
    { tag: 'S3-pass', section: 'siem', extra: 0 },            // cruzando el display (siem centrado)
    { tag: 'S3-deep', section: 'siem', extra: 0.5 },          // fondo del corredor (exit)
  ];
  for (const pt of passTargets) {
    await page.evaluate(({ section, extra }) => {
      const el = document.getElementById(section);
      if (el) el.scrollIntoView({ block: 'center', behavior: 'instant' });
      if (extra > 0) window.scrollBy(0, window.innerHeight * extra);
    }, pt);
    await page.waitForTimeout(7000);
    const dump = await dumpLabels(page, pt.tag);
    passes.push(dump);
    const file = path.resolve(OUT, `pass-${pt.tag}.png`);
    await page.screenshot({ path: file });
    dump.file = path.basename(file);
    dump.stats = await stats(file);
  }

  fs.writeFileSync(
    path.resolve(OUT, 'result.json'),
    JSON.stringify({ date: new Date().toISOString(), shots, passes, errors: errors.slice(0, 6) }, null, 2),
  );
  console.log('=== scenes ===');
  console.log(JSON.stringify(shots, null, 2));
  console.log('=== passes (labels) ===');
  for (const p of passes) {
    console.log(`\n[${p.tag}] scrollY=${p.scrollY} labels=${p.count}`);
    for (const l of p.labels) console.log(`  opacity=${l.opacity}  ${l.text}`);
  }
  console.log(`\nconsoleErrors: ${errors.length}`);
} finally {
  await browser.close();
}
