import { chromium } from 'playwright';
import sharp from 'sharp';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const base = process.argv[2] || 'http://localhost:3100';
const here = path.dirname(fileURLToPath(import.meta.url));
const GLOBAL_BOUNDARY = '[datacenter] 3D scene error';
const GLBS = {
  rack: '/assets/3d/server_rack_v02.glb',
  switch: '/assets/3d/network_switch_v01.glb',
  storage: '/assets/3d/storage_unit_v01.glb',
  display: '/assets/3d/siem_display_v01.glb',
};

async function httpStatus(url) {
  const r = await fetch(url, { method: 'HEAD' });
  return r.status;
}

async function capture(browser, { abortStorage = false } = {}) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const requests = { rack: 0, switch: 0, storage: 0, display: 0 };
  const errors = [];
  page.on('request', (r) => {
    for (const [k, u] of Object.entries(GLBS)) {
      if (r.url().includes(u) && r.method() !== 'HEAD') requests[k]++;
    }
  });
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  if (abortStorage) await page.route(`**${GLBS.storage}`, (r) => r.abort());

  await page.goto(base, { waitUntil: 'networkidle' });
  await page.waitForSelector('[data-testid="datacenter-canvas"]', { timeout: 15000 });
  await page.waitForTimeout(2000);
  // Scroll FIJO (6000): la unidad protagonista de storage está en frame y la
  // escena es determinista entre runs. #audit-hub.offsetTop NO sirve: varía
  // entre cargas (fonts/layout) → la cámara se mueve → diff de frame completo
  // (verificado: con offsetTop el ruido B-vs-B era 6.5-7.5; con 6000 fijo, 0.4).
  await page.evaluate(() => window.scrollTo(0, 6000));
  await page.waitForTimeout(3000);

  const alive = await page.evaluate(() => !!document.querySelector('[data-testid="datacenter-canvas"]'));
  const shot = path.resolve(here, `refcheck/glb-assets-${abortStorage ? 'b-procedural' : 'a-glb'}.png`);
  await page.screenshot({ path: shot });
  await ctx.close();
  return { requests, canvasAlive: alive, boundaryHit: errors.some((e) => e.includes(GLOBAL_BOUNDARY)), shot };
}

async function diffAnalysis(a, b) {
  const [ra, rb] = await Promise.all([
    sharp(a).resize(900).raw().toBuffer({ resolveWithObject: true }),
    sharp(b).resize(900).raw().toBuffer({ resolveWithObject: true }),
  ]);
  const ch = ra.info.channels;
  const w = ra.info.width;
  const h = ra.info.height;
  let sum = 0, n = 0, minX = 1e9, minY = 1e9, maxX = -1, maxY = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * ch;
      let d = 0;
      for (let c = 0; c < ch; c++) d += Math.abs(ra.data[i + c] - rb.data[i + c]);
      d /= ch;
      sum += d;
      if (d > 40) {
        n++;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  return { mean: sum / (w * h), strongPx: n, bbox: n > 0 ? { x: [minX, maxX], y: [minY, maxY], wPct: ((maxX - minX) / w) * 100 } : null };
}

// 1) los 4 GLBs se sirven desde /public
const statuses = {};
for (const [k, u] of Object.entries(GLBS)) statuses[k] = await httpStatus(base + u);

// 2) runtime: A (GLBs) vs B (storage abortado) + piso de ruido (A vs A)
const browser = await chromium.launch();
const a1 = await capture(browser, { abortStorage: false });
const a2 = await capture(browser, { abortStorage: false });
const b = await capture(browser, { abortStorage: true });
await browser.close();

const noise = await diffAnalysis(a1.shot, a2.shot);
const signal = await diffAnalysis(a1.shot, b.shot);

console.log(JSON.stringify({ statuses, A: a1.requests, B: b.requests, canvasAlive: a1.canvasAlive && b.canvasAlive, boundaryHit: a1.boundaryHit || b.boundaryHit, noise: { mean: noise.mean }, signal: { mean: signal.mean, bbox: signal.bbox } }, null, 2));

const pass =
  Object.values(statuses).every((s) => s === 200) &&      // 4 GLBs servidos
  a1.requests.rack >= 1 && a1.requests.storage >= 1 &&    // slots cableados piden sus GLBs
  a1.requests.switch === 0 && a1.requests.display === 0 && // sin slot → sin request
  a1.canvasAlive && b.canvasAlive && !a1.boundaryHit && !b.boundaryHit &&
  noise.mean < 0.2 &&                                       // piso de ruido bajo
  signal.mean > 0.06 && signal.mean > noise.mean * 3 &&     // storage GLB reemplaza al procedural
  signal.bbox && signal.bbox.wPct < 60;
console.log(pass ? 'GATE: PASS — storage GLB carga en su slot S4 y reemplaza al procedural; switch/display declarados sin slot (listos para sus pools)' : 'GATE: FAIL');
process.exit(pass ? 0 : 1);
