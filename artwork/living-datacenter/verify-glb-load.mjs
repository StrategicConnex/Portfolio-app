import { chromium } from 'playwright';
import sharp from 'sharp';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const base = process.argv[2] || 'http://localhost:3100';
const here = path.dirname(fileURLToPath(import.meta.url));
const GLB = '/assets/3d/server_rack_v02.glb';
const GLOBAL_BOUNDARY = '[datacenter] 3D scene error';
// El DOM del hero (Z-40) cubre el rack en scroll 0 — se compara donde el rack
// es visible (scroll 600: hero DOM desplazado, cámara aún en el rack hero).
const SCROLL = 600;

async function capture(browser, { abortGlb = false } = {}) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const glb = { head: 0, get: 0 };
  const errors = [];
  page.on('request', (r) => {
    if (!r.url().includes(GLB)) return;
    if (r.method() === 'HEAD') glb.head++;
    else glb.get++;
  });
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  if (abortGlb) await page.route(`**${GLB}`, (r) => r.abort());

  await page.goto(base, { waitUntil: 'networkidle' });
  await page.waitForSelector('[data-testid="datacenter-canvas"]', { timeout: 15000 });
  await page.waitForTimeout(2000);
  await page.evaluate((y) => window.scrollTo(0, y), SCROLL);
  // espera larga: dejar asentar el spring de cámara (useSpring) y micro-anims
  await page.waitForTimeout(3000);

  const alive = await page.evaluate(() => !!document.querySelector('[data-testid="datacenter-canvas"]'));
  const shot = path.resolve(here, `refcheck/glb-load-${abortGlb ? 'b-procedural' : 'a-glb'}.png`);
  await page.screenshot({ path: shot });
  await ctx.close();
  return { glb, canvasAlive: alive, boundaryHit: errors.some((e) => e.includes(GLOBAL_BOUNDARY)), shot };
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
      if (d > 60) {
        n++;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  const bbox = n > 0 ? { x: [minX, maxX], y: [minY, maxY], wPct: ((maxX - minX) / w) * 100, hPct: ((maxY - minY) / h) * 100, strongPx: n } : null;
  return { mean: sum / (w * h), bbox };
}

const browser = await chromium.launch();
// piso de ruido: dos capturas del MISMO escenario (A) — spring/micro-anims
const a1 = await capture(browser, { abortGlb: false });
const a2 = await capture(browser, { abortGlb: false });
const b = await capture(browser, { abortGlb: true });
await browser.close();

const noise = await diffAnalysis(a1.shot, a2.shot);   // A vs A: solo ruido
const signal = await diffAnalysis(a1.shot, b.shot);   // A vs B: GLB + ruido
console.log(JSON.stringify({
  A: { glb: a1.glb, canvasAlive: a1.canvasAlive },
  B: { glb: b.glb, canvasAlive: b.canvasAlive },
  boundaryHit: a1.boundaryHit || b.boundaryHit,
  noise: { mean: noise.mean },
  signal: { mean: signal.mean, bbox: signal.bbox },
}, null, 2));

const pass =
  a1.glb.head >= 1 && a1.glb.get >= 1 &&            // A descargó el GLB (HEAD + GET)
  b.glb.head >= 1 && b.glb.get === 0 &&             // B solo intentó (HEAD abortado), sin GET
  a1.canvasAlive && b.canvasAlive &&                // canvas vivo — boundary global nunca disparado
  !a1.boundaryHit && !b.boundaryHit &&
  signal.mean > 0.4 &&                               // cambio visible (observado 0.89-2.1)
  signal.mean > noise.mean * 3 &&                    // señal muy por encima del piso de ruido
  signal.bbox && signal.bbox.hPct > 10;              // hay una región de cambio sustancial
console.log(pass ? 'GATE: PASS — el GLB del rack hero cargó y reemplazó al procedural (visible al scrollear; en scroll 0 lo cubre el DOM del hero, Z-40 > Z-20)' : 'GATE: FAIL');
process.exit(pass ? 0 : 1);
