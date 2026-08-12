// Cold Cathedral — Abstraction: pure form, light, temperature. No text, no labels, no marks.
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const W = 2160, H = 2880, CX = 1080;

const CYAN = '95,212,230';
const AMBER = '197,164,109';
const INK = '231,238,246';
const STEEL = '34,50,74';
const rgba = (c, a) => `rgba(${c},${a})`;

const rect = (x, y, w, h, fill, o = 1, rx = 0) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" opacity="${o}"/>`;
const rectF = (x, y, w, h, fill, o, rx, filter) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" opacity="${o}" filter="url(#${filter})"/>`;
const line = (x1, y1, x2, y2, stroke, o = 1, sw = 1) =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-opacity="${o}" stroke-width="${sw}"/>`;
const circle = (x, y, r, fill, o = 1, stroke = null, sw = 0) =>
  `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" opacity="${o}"${stroke ? ` stroke="${stroke}" stroke-width="${sw}"` : ''}/>`;
const circleF = (x, y, r, fill, o, filter) =>
  `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" opacity="${o}" filter="url(#${filter})"/>`;
const poly = (pts, fill, o) =>
  `<polygon points="${pts}" fill="${fill}" opacity="${o}"/>`;

const S = [];
S.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`);
S.push(`<defs>
<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#04070b"/>
  <stop offset="0.5" stop-color="#080f17"/>
  <stop offset="1" stop-color="#05080d"/>
</linearGradient>
<radialGradient id="cold" cx="0.5" cy="0.5" r="0.5">
  <stop offset="0" stop-color="${rgba(CYAN, 0.10)}"/>
  <stop offset="1" stop-color="${rgba(CYAN, 0)}"/>
</radialGradient>
<radialGradient id="warmPool" cx="0.5" cy="0.5" r="0.5">
  <stop offset="0" stop-color="${rgba(AMBER, 0.13)}"/>
  <stop offset="1" stop-color="${rgba(AMBER, 0)}"/>
</radialGradient>
<radialGradient id="halo" cx="0.5" cy="0.5" r="0.5">
  <stop offset="0" stop-color="${rgba(CYAN, 0.055)}"/>
  <stop offset="0.6" stop-color="${rgba(CYAN, 0.02)}"/>
  <stop offset="1" stop-color="${rgba(AMBER, 0.04)}"/>
</radialGradient>
<linearGradient id="flank" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="${rgba(CYAN, 0.09)}"/>
  <stop offset="0.7" stop-color="${rgba(CYAN, 0.03)}"/>
  <stop offset="1" stop-color="${rgba(CYAN, 0)}"/>
</linearGradient>
<linearGradient id="shaft" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="${rgba(CYAN, 0.07)}"/>
  <stop offset="1" stop-color="${rgba(CYAN, 0.01)}"/>
</linearGradient>
<linearGradient id="tBand" x1="0" y1="0" x2="1" y2="0">
  <stop offset="0" stop-color="${rgba(CYAN, 0.45)}"/>
  <stop offset="1" stop-color="${rgba(AMBER, 0.45)}"/>
</linearGradient>
<linearGradient id="fog" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#0a0f16" stop-opacity="0"/>
  <stop offset="1" stop-color="#0a0f16" stop-opacity="0.9"/>
</linearGradient>
<radialGradient id="vig" cx="0.5" cy="0.46" r="0.75">
  <stop offset="0.55" stop-color="#04070b" stop-opacity="0"/>
  <stop offset="1" stop-color="#020309" stop-opacity="0.55"/>
</radialGradient>
<filter id="gBand" x="-150%" y="-300%" width="400%" height="700%"><feGaussianBlur stdDeviation="12"/></filter>
<filter id="gSoft" x="-150%" y="-300%" width="400%" height="700%"><feGaussianBlur stdDeviation="26"/></filter>
<filter id="gApex" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="34"/></filter>
</defs>`);

// background
S.push(rect(0, 0, W, H, 'url(#bg)'));
S.push(circleF(CX, 250, 1000, rgba(CYAN, 0.1), 1, 'gApex'));     // cold breath above
S.push(circleF(CX, 2600, 800, rgba(AMBER, 0.14), 1, 'gApex'));   // warm pool below

// apex: two faint rings of pure light (no crosshair)
S.push(circle(CX, 250, 190, 'none', 1, rgba(CYAN, 0.05), 1.2));
S.push(circle(CX, 250, 330, 'none', 1, rgba(CYAN, 0.03), 1.2));

// light shaft
S.push(poly('1080,30 800,1650 1360,1650', 'url(#shaft)'));

// faint floor (the aisle, barely there) — depth, not structure
const HORIZON = 2050;
for (let k = -8; k <= 8; k++) S.push(line(CX, HORIZON, CX + k * 150, H, rgba(STEEL, 0.06)));
for (const t of [0.15, 0.35, 0.6, 1.0]) {
  const y = HORIZON + (H - HORIZON) * t * t;
  S.push(line(0, y, W, y, rgba(STEEL, t > 0.9 ? 0.1 : 0.06)));
}

// dust motes — sparse, cold above, a few warm near the base
for (let i = 0; i < 46; i++) {
  const x = 180 + ((i * 173.3) % 1800);
  const y = 260 + ((i * 311.7) % 2100);
  const warm = y > 2100 && i % 4 === 0;
  const r = 1.5 + (i % 3);
  S.push(circle(x, y, r, rgba(warm ? AMBER : CYAN, 0.05 + (i % 6) * 0.022)));
}

// the two flank columns of light (no form — pure glow)
S.push(rect(420, 700, 200, 1750, 'url(#flank)'));
S.push(rectF(420, 700, 200, 1750, rgba(CYAN, 0.05), 1, 0, 'gSoft'));
S.push(rect(1540, 700, 200, 1750, 'url(#flank)'));
S.push(rectF(1540, 700, 200, 1750, rgba(CYAN, 0.05), 1, 0, 'gSoft'));

// the breathing column: constant form, varying light
const X0 = 850, XW = 460;
S.push(rectF(X0 - 60, 320, XW + 120, 2380, rgba(CYAN, 0.03), 1, 0, 'gSoft')); // halo
S.push(circleF(CX, 1450, 560, 'url(#halo)'));
const ACTIVE = new Set([0, 2, 5, 9, 14, 20, 26, 29, 33, 36]);
for (let r = 0; r <= 37; r++) {
  const y = 380 + r * 62;
  const warm = r >= 26;
  const transition = r === 24 || r === 25;
  const active = ACTIVE.has(r);
  let I;
  if (transition) I = 0.0; // drawn below as split gradient band
  else if (active) I = warm ? 0.55 : 0.6;
  else I = 0.09 + 0.09 * Math.abs(Math.sin(r * 1.1));
  if (transition) {
    S.push(rectF(X0 - 12, y - 20, XW + 24, 40, rgba(INK, 0.1), 1, 6, 'gBand'));
    S.push(rect(X0, y - 13, XW, 26, 'url(#tBand)', 0.5, 3));
  } else {
    const col = warm ? AMBER : CYAN;
    S.push(rectF(X0 - 12, y - 20, XW + 24, 40, rgba(col, active ? 0.45 : I * 0.75), 1, 6, 'gBand'));
    S.push(rect(X0, y - 13, XW, 26, rgba(col, active ? 0.62 : I), 1, 3));
  }
}

// fog at the base
S.push(rect(0, 2400, W, 480, 'url(#fog)'));

// vignette
S.push(rect(0, 0, W, H, 'url(#vig)'));
S.push('</svg>');

const svg = S.join('\n');
const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>Cold Cathedral — Abstraction</title>
<style>
html,body{margin:0;padding:0;background:#04060a;}
svg{display:block;}
@page{size:${W}px ${H}px;margin:0;}
</style></head>
<body>${svg}</body></html>`;
writeFileSync(join(__dirname, 'abstract.html'), html);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
await page.goto('file:///' + join(__dirname, 'abstract.html').replaceAll('\\', '/'));
await page.waitForTimeout(300);
await page.screenshot({ path: join(__dirname, 'abstract.png') });
await page.pdf({ path: join(__dirname, 'abstract.pdf'), width: W + 'px', height: H + 'px', printBackground: true });
await browser.close();
console.log('rendered abstract.html / abstract.png / abstract.pdf');
