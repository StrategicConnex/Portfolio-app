import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const base = process.argv[2] || 'http://localhost:3100';
const here = path.dirname(fileURLToPath(import.meta.url));

const results = [];
const GLOBAL_BOUNDARY = '[datacenter] 3D scene error'; // marcador del DatacenterErrorBoundary global
const LOCAL_BOUNDARY = 'GLB fallback to procedural';    // marcador del AssetFallbackBoundary local

// NOTA: `next start` hace 404 a archivos nuevos en /public (mapea el dir al
// arrancar), así que el caso "GLB corrupto" se inyecta por la red con route
// fulfill (HEAD y GET con body corrupto) — determinista y sin tocar disco.
const CORRUPT_BODY = 'this is not a glb binary';

async function scenario(name, url, { abortAssets = false, setup = null } = {}) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  const glbRequests = [];
  const errors = [];
  const warns = [];
  page.on('request', (r) => { if (r.url().includes('/assets/3d/')) glbRequests.push(`${r.method()} ${r.url()}`); });
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
    if (m.type() === 'warning') warns.push(m.text());
  });
  if (abortAssets) await page.route('**/assets/3d/**', (r) => r.abort());
  if (setup) await setup(page);

  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForSelector('[data-testid="datacenter-canvas"]', { timeout: 15000 });
  await page.waitForTimeout(1200);

  const state = await page.evaluate(() => ({
    canvasAlive: !!document.querySelector('[data-testid="datacenter-canvas"]'),
    posterPresent: !!document.querySelector('img[data-poster-img]'),
  }));

  const boundaryHit = errors.some((e) => e.includes(GLOBAL_BOUNDARY));
  const localFallback = warns.some((w) => w.includes(LOCAL_BOUNDARY));
  const otherErrors = errors.filter((e) => !e.includes(GLOBAL_BOUNDARY));

  await page.screenshot({ path: path.resolve(here, `refcheck/glb-fallback-${name.replace(/\W+/g, '-')}.png`) });
  await browser.close();
  return { scenario: name, glbRequests, boundaryHit, localFallback, otherErrors: otherErrors.slice(0, 4), ...state };
}

// Escenario 0 — control: sin GLB configurado, cero requests a /assets/3d/
results.push(await scenario('control', `${base}/`));

// Escenario 1 — GLB ausente: ?dc-glb=missing_rack → HEAD 404 → fallback procedural
results.push(await scenario('missing-404', `${base}/?dc-glb=missing_rack`));

// Escenario 2 — red caída: el request se aborta → fallback procedural
results.push(await scenario('network-abort', `${base}/?dc-glb=missing_rack`, { abortAssets: true }));

// Escenario 3 — GLB corrupto: HEAD 200 (route fulfill) pero parse falla →
// boundary LOCAL actúa; el boundary global jamás se dispara
results.push(await scenario('corrupt-parse', `${base}/?dc-glb=corrupt`, {
  setup: (page) =>
    page.route('**/assets/3d/corrupt.glb', (route) =>
      route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: CORRUPT_BODY }),
    ),
}));

console.log(JSON.stringify(results, null, 2));

// Gate: 4 escenarios, canvas vivo siempre, boundary global NUNCA disparado
const pass =
  results.every((r) => r.canvasAlive) &&
  results.every((r) => !r.boundaryHit) &&
  results[0].glbRequests.length === 0 &&           // control: inerte
  results.slice(1).every((r) => r.glbRequests.length >= 1) && // los demás intentaron el GLB
  results[3].localFallback === true;                // corrupto: boundary local SÍ actuó
console.log(pass ? 'GATE: PASS — fallback procedural verificado sin error boundary global' : 'GATE: FAIL');
process.exit(pass ? 0 : 1);
