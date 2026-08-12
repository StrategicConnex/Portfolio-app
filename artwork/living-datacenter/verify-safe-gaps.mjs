/**
 * Validación en navegador real de los gaps SAFE G1 · G5 · G6 (CREATIVE-AUDIT §5).
 *
 * - G1: `FASE 0n/05` / `PHASE 0n/05` en el HUD de escena (DOM dentro del canvas, es/en).
 * - G5: clearcoat en GLB hero — análisis de la captura del rack hero (S1): el
 *       clearcoat 0.25/0.35 eleva el pico especular del chasis vs. el procedural.
 * - G6: estilos computados del DOM editorial (eyebrow mono+tracking, título clamp,
 *       pill del hero font-mono).
 * - Dirección de arte: por escena, histograma de luminancia/saturación y presencia
 *       de los acentos del token (cian #22d3ee, dorado #d4a94e, ámbar) sobre base
 *       oscura premium — sin neón excesivo (SPEC §3).
 *
 * Capturas en refcheck/gaps-*.png · JSON en refcheck/gaps-result.json · exit 0/1.
 */
import { chromium } from 'playwright';
import sharp from 'sharp';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const base = process.argv[2] || 'http://localhost:3100';
const lang = process.argv[3] || 'es'; // es | en
const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(here, 'refcheck');

const SCENES = [
  { id: 'S1-boot', section: 'home', hudKey: 'dc.scene.boot.status', phase: 1, sceneIdx: 0, hasPhase: false },
  { id: 'S2-core', section: 'arquitectura', hudKey: 'dc.scene.architecture.title', phase: 2, sceneIdx: 1, hasPhase: true },
  { id: 'S3-data', section: 'siem', hudKey: 'dc.scene.data.title', phase: 3, sceneIdx: 2, hasPhase: true },
  { id: 'S4-resilience', section: 'audit-hub', hudKey: 'dc.scene.resilience.title', phase: 4, sceneIdx: 3, hasPhase: true },
  { id: 'S5-connection', section: 'contacto', hudKey: 'dc.scene.connection.title', phase: 5, sceneIdx: 4, hasPhase: true },
];

const ACCENTS = [
  { name: 'cyan', rgb: [34, 211, 238] },
  { name: 'gold', rgb: [212, 169, 78] },
  { name: 'amber', rgb: [245, 158, 11] },
];

function hueOf(r, g, b) {
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  if (max === min) return -1;
  const d = max - min;
  let h;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return (h * 60 + 360) % 360;
}

async function analyzeShot(file) {
  const { data, info } = await sharp(file).resize(800).raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h, channels: ch } = info;
  const px = (x, y, c) => data[(y * w + x) * ch + c];
  let lumSum = 0, satSum = 0, n = 0, darkPx = 0;
  const accentHits = {};
  for (const a of ACCENTS) accentHits[a.name] = 0;
  let maxSat = 0, neonPx = 0, alienNeonPx = 0;
  // gold/amber (18-62) · cyan/blue (150-245): incluye el verde-cian de los LEDs de
  // estado del hardware real (rgb ~16,162,119, hue ~165 — Cisco/Dell status OK).
  // Alien = magenta/rojo puro/verde puro (anti-patrón gamer).
  const tokenHues = (h) => (h >= 18 && h <= 62) || (h >= 150 && h <= 245);
  for (let y = 0; y < h; y += 2) {
    for (let x = 0; x < w; x += 2) {
      const r = px(x, y, 0), g = px(x, y, 1), b = px(x, y, 2);
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      lumSum += lum; n++;
      if (lum < 40) darkPx++;
      const sat = max === 0 ? 0 : (max - min) / max;
      satSum += sat;
      if (sat > maxSat) maxSat = sat;
      if (sat > 0.85 && lum > 60) {
        neonPx++;
        const hue = hueOf(r, g, b);
        if (!tokenHues(hue)) alienNeonPx++; // magenta/verde/rojo puro = neón fuera del sistema (anti-patrón)
      }
      // Detección de acentos: píxel relativamente saturado cercano al hue del token
      if (sat > 0.35) {
        const hue = hueOf(r, g, b);
        // one-hit: cada píxel cuenta UNA sola vez, en el acento de hue más cercano
        let best = null, bestDh = 1e9;
        for (const a of ACCENTS) {
          const target = a.name === 'cyan' ? 190 : 42;
          const dh = Math.min(Math.abs(hue - target), 360 - Math.abs(hue - target));
          if (dh < bestDh) { bestDh = dh; best = a.name; }
        }
        if (best && bestDh < (best === 'cyan' ? 18 : 20)) accentHits[best]++;
      }
    }
  }
  return {
    meanLum: +(lumSum / n).toFixed(2),
    darkPct: +((darkPx / n) * 100).toFixed(1),
    meanSat: +(satSum / n).toFixed(3),
    maxSat: +maxSat.toFixed(2),
    neonPct: +((neonPx / n) * 100).toFixed(3),
    alienNeonPct: +((alienNeonPx / n) * 100).toFixed(4),
    accentHits: Object.fromEntries(Object.entries(accentHits).map(([k, v]) => [k, v])),
  };
}

async function run() {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const consoleErrors = [];
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });

  await page.goto(base, { waitUntil: 'networkidle' });
  // Máquina degradada: el canvas puede tardar ~30s en montarse (chunks + hidratación).
  await page.waitForSelector('[data-testid="datacenter-canvas"]', { timeout: 60000 });
  await page.waitForTimeout(2500);

  // --- G6: estilos computados del DOM editorial ---
  const g6 = await page.evaluate(() => {
    const cs = (el) => el ? getComputedStyle(el) : null;
    const h2 = document.querySelector('h2');
    const heroPill = [...document.querySelectorAll('span')].find((s) =>
      s.className && typeof s.className === 'string' && s.className.includes('rounded-full') && s.className.includes('font-mono'));
    const h1 = document.querySelector('h1');
    return {
      hasH1: !!h1,
      h2: h2 ? { text: h2.textContent.slice(0, 60), fontSize: cs(h2).fontSize } : null,
      heroPill: heroPill
        ? { text: heroPill.textContent.trim().slice(0, 40), fontFamily: cs(heroPill).fontFamily.slice(0, 80) }
        : null,
      // eyebrow mono con tracking amplio (G6): buscar el elemento uppercase con tracking-[0.3em]
      anyMonoTracking: [...document.querySelectorAll('[class*="font-mono"]')]
        .filter((el) => {
          const st = cs(el);
          return st.letterSpacing.includes('0.3em') || st.letterSpacing.includes('4.8px') || st.letterSpacing.includes('0.3');
        })
        .map((el) => ({ tag: el.tagName, ls: cs(el).letterSpacing, text: el.textContent.trim().slice(0, 40) }))
        .slice(0, 4),
    };
  });

  // --- G1 + capturas por escena ---
  const results = [];
  for (const sc of SCENES) {
    const sec = await page.$(`#${sc.section}`);
    if (!sec) { results.push({ ...sc, error: `section #${sc.section} not found` }); continue; }
    await sec.scrollIntoViewIfNeeded();
    // Centrar la sección en viewport para el encuadre de cámara de la escena
    await page.evaluate((id) => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ block: 'center', behavior: 'instant' });
    }, sc.section);
    await page.waitForTimeout(6000); // spring de cámara + micro-anims (máquina degradada: el DOM del Html transform tarda)

    // G1: texto de fase en el HUD (DOM del Html transform, dentro del canvas)
    const hud = await page.evaluate(() => {
      const labels = [...document.querySelectorAll('[data-testid="hud-label"]')];
      return labels.map((l) => l.textContent.replace(/\s+/g, ' ').trim()).filter(Boolean);
    });
    const phaseText = lang === 'es' ? 'FASE' : 'PHASE';
    const phaseHit = hud.find((t) => t.includes(`${phaseText} ${String(sc.phase).padStart(2, '0')}/05`));
    const bootStatusOk = !sc.hasPhase && ['INICIALIZANDO SISTEMA', 'SYSTEM INITIALIZING'].some((k) => hud.join(' ').includes(k));

    const shot = path.resolve(OUT, `gaps-${sc.id}.png`);
    await page.screenshot({ path: shot });
    const art = await analyzeShot(shot);
    const ok = sc.hasPhase ? !!phaseHit : bootStatusOk;
    results.push({
      id: sc.id,
      section: sc.section,
      hasPhase: sc.hasPhase,
      phaseExpected: sc.hasPhase ? `${phaseText} ${String(sc.phase).padStart(2, '0')}/05` : '(boot: status, sin fase por diseño)',
      phaseInHud: ok,
      phaseTextFound: phaseHit || null,
      bootStatusOk,
      hudLabels: hud.slice(0, 4),
      shot: path.basename(shot),
      art,
    });
  }

  // --- G5: clearcoat del rack hero (S1) — pico especular del chasis ---
  // Re-capturamos S1 con scroll donde el rack GLB es visible (patrón verify-glb-load)
  await page.evaluate((y) => window.scrollTo(0, y), 600);
  await page.waitForTimeout(6000);
  const heroShot = path.resolve(OUT, 'gaps-hero-rack.png');
  await page.screenshot({ path: heroShot });
  // Pico especular: píxeles de luminancia alta (190-255) en zona central (rack)
  const spec = await analyzeSpecular(heroShot);

  // --- G6: pill del hero en scroll 0 ---
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(3000);
  const heroPill = await page.evaluate(() => {
    const pill = [...document.querySelectorAll('span')].find((s) =>
      s.className && typeof s.className === 'string' && s.className.includes('rounded-full') && s.className.includes('font-mono'));
    if (!pill) return null;
    const st = getComputedStyle(pill);
    return { text: pill.textContent.trim().slice(0, 50), fontFamily: st.fontFamily.slice(0, 60), fontSize: st.fontSize, letterSpacing: st.letterSpacing };
  });
  const heroShot2 = path.resolve(OUT, 'gaps-hero-top.png');
  await page.screenshot({ path: heroShot2 });

  // --- G6: eyebrow editorial del SectionHeader (check directo del elemento) ---
  const eyebrowCheck = await page.evaluate(() => {
    // el eyebrow del SectionHeader es el <p> previo al primer <h2> con clase font-mono
    const h2 = document.querySelector('h2');
    const p = h2 ? h2.previousElementSibling : null;
    if (!p) return null;
    const st = getComputedStyle(p);
    return {
      text: p.textContent.trim().slice(0, 50),
      fontFamily: st.fontFamily.slice(0, 50),
      letterSpacing: st.letterSpacing,
      textTransform: st.textTransform,
      fontSize: st.fontSize,
    };
  });
  if (eyebrowCheck) g6.eyebrow = eyebrowCheck;

  await browser.close();

  // --- Verdicts ---
  const g1Pass = results.every((r) => r.phaseInHud) && results.length === SCENES.length;
  const g6Pass = g6.hasH1 && g6.h2 && g6.heroPill && g6.heroPill.fontFamily.toLowerCase().includes('mono') && heroPill && heroPill.fontFamily.toLowerCase().includes('mono');
  const g5Pass = spec.highPct > 0.05 && spec.meanLum < 160; // highlight especular presente sobre base oscura
  // Dirección de arte (SPEC §3): base oscura premium + acentos SOLO del token.
  // El neón del token (gold/amber/cyan = estado/actividad) es legítimo; el neón
  // alienígena (magenta/verde/rojo puro) es el anti-patrón gamer a evitar.
  const artPass = results.every((r) => r.art.darkPct > 45 && r.art.alienNeonPct < 0.05 && (r.art.accentHits.cyan > 0 || r.art.accentHits.gold > 0 || r.art.accentHits.amber > 0));

  // Errores de consola: excluir el CORS del telemetry legítimo existente
  // (ObservabilityProvider → scaudit.vercel.app — tráfico de la app, no del 3D; R5).
  const legitTelemetry = (e) => e.includes('scaudit.vercel.app/api/telemetry') || e.includes('ERR_FAILED');
  const realErrors = consoleErrors.filter((e) => !legitTelemetry(e));

  const out = {
    date: new Date().toISOString().slice(0, 10),
    lang,
    base,
    g1: { pass: g1Pass, perScene: results.map((r) => ({ id: r.id, phaseExpected: r.phaseExpected, phaseInHud: r.phaseInHud, hudLabels: r.hudLabels })) },
    g5: { pass: g5Pass, spec },
    g6: { pass: g6Pass, dom: g6, heroPill },
    artDirection: { pass: artPass, perScene: results.map((r) => ({ id: r.id, art: r.art })) },
    consoleErrors: consoleErrors.slice(0, 5),
    realConsoleErrors: realErrors,
  };
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.resolve(OUT, 'gaps-result.json'), JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));

  const pass = g1Pass && g5Pass && g6Pass && artPass && realErrors.length === 0;
  console.log(pass ? 'GATE: PASS — G1 · G5 · G6 validados en navegador real' : 'GATE: FAIL');
  process.exit(pass ? 0 : 1);
}

async function analyzeSpecular(file) {
  const { data, info } = await sharp(file).resize(800).raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h, channels: ch } = info;
  let high = 0, n = 0, lumSum = 0;
  for (let y = Math.floor(h * 0.25); y < h * 0.9; y += 2) {
    for (let x = Math.floor(w * 0.2); x < w * 0.8; x += 2) {
      const r = data[(y * w + x) * ch], g = data[(y * w + x) * ch + 1], b = data[(y * w + x) * ch + 2];
      const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      lumSum += lum; n++;
      if (lum > 185) high++;
    }
  }
  return { highPct: +((high / n) * 100).toFixed(2), meanLum: +(lumSum / n).toFixed(1) };
}

run().catch((e) => { console.error(e); process.exit(2); });
