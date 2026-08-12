/**
 * Captura fresca de S1 (rack hero) con el encuadre EXACTO del baseline
 * (1440x900, #home centrado) para comparación apples-to-apples pre/post-fidelity.
 * Salida: refcheck/s1-fresh-current.png + crop del rack + JSON de métricas.
 */
import { chromium } from 'playwright';
import sharp from 'sharp';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const base = process.argv[2] || 'http://localhost:3100';
const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(here, 'refcheck');
const W = 1440, H = 900;

async function main() {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: W, height: H } });
  const page = await ctx.newPage();
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.waitForSelector('[data-testid="datacenter-canvas"]', { timeout: 60000 });
  await page.waitForTimeout(2500);

  // Mismo encuadre que el baseline: #home centrado
  await page.evaluate(() => {
    const el = document.getElementById('home');
    if (el) el.scrollIntoView({ block: 'center', behavior: 'instant' });
  });
  await page.waitForTimeout(8000);

  const shot = path.resolve(OUT, 's1-fresh-current.png');
  await page.screenshot({ path: shot });
  await browser.close();

  // Crop del rack (zona central, ~35-65% x, 20-75% y)
  const crop = path.resolve(OUT, 's1-fresh-rack-crop.png');
  await sharp(shot).extract({ left: Math.floor(W * 0.30), top: Math.floor(H * 0.15), width: Math.floor(W * 0.40), height: Math.floor(H * 0.65) }).toFile(crop);

  console.log('captured:', path.basename(shot), path.basename(crop));
}
main().catch((e) => { console.error(e); process.exit(2); });
