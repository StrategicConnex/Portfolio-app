import { chromium } from 'playwright';
const browser = await chromium.launch();
const base = process.argv[2] || 'http://localhost:3100';

// mode: reduced motion → poster <img> present (capa base Z-10, LCP), canvas 3D ausente
const ctxR = await browser.newContext({ reducedMotion: 'reduce' });
const pR = await ctxR.newPage();
await pR.goto(base, { waitUntil: 'networkidle' });
await pR.waitForTimeout(1200);
const reduced = await pR.evaluate(() => {
  const img = document.querySelector('img[data-poster-img]');
  const preload = [...document.querySelectorAll('link[rel="preload"]')]
    .find(l => (l.getAttribute('href') || '').includes('cold-cathedral-poster.webp'));
  return {
    posterImg: !!img,
    posterSrc: img ? img.getAttribute('src') : null,
    fetchpriority: img ? img.getAttribute('fetchpriority') : null,
    preloadLink: preload ? { as: preload.getAttribute('as'), fp: preload.getAttribute('fetchpriority') } : null,
    datacenterCanvas: !!document.querySelector('[data-testid="datacenter-canvas"]'),
    toggle: [...document.querySelectorAll('button')].some(b => b.textContent === '◌'),
  };
});
console.log('REDUCED MOTION:', JSON.stringify(reduced));
await ctxR.close();

// mode: normal → canvas 3D vivo (Z-20), póster base presente pero cubierto
const ctxN = await browser.newContext();
const pN = await ctxN.newPage();
await pN.goto(base, { waitUntil: 'networkidle' });
await pN.waitForTimeout(1500);
const normal = await pN.evaluate(() => ({
  posterImg: !!document.querySelector('img[data-poster-img]'),
  datacenterCanvas: !!document.querySelector('[data-testid="datacenter-canvas"]'),
  toggle: [...document.querySelectorAll('button')].some(b => b.textContent === '◎'),
}));
console.log('NORMAL:', JSON.stringify(normal));
await ctxN.close();
await browser.close();
