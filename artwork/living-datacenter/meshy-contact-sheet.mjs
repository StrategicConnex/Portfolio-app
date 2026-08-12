#!/usr/bin/env node
/**
 * Meshy.ai — generador de la hoja de contacto comparativa (CONTACT-SHEET.html)
 *
 * Compara por asset: REFERENCIA (foto del kit) ↔ FOOTPRINT DEL SLOT (SVG a
 * escala de aspecto exacta) ↔ OUTPUT MESHY (raw/, si el usuario lo sube) ↔
 * RUNTIME (captura del probe con el GLB montado).
 *
 * Uso:
 *   node artwork/living-datacenter/meshy-contact-sheet.mjs
 *   → artwork/living-datacenter/meshy-kit/CONTACT-SHEET.html
 *   → artwork/living-datacenter/meshy-kit/contact-sheet-state.json
 *
 * Reglas:
 *   - Sin dependencias (Node puro). El HTML se abre localmente con rutas
 *     relativas al kit.
 *   - Lee un contact-sheet-state.json previo si existe y conserva los
 *     campos editados a mano (verdict / notas) — nunca los pisa.
 *   - Detecta en cada carpeta: ref-* (referencias), raw/<asset>-preview.*
 *     (render del output), raw/<asset>-runtime.* (captura en el sitio),
 *     raw/<asset>-*.glb (output descargado).
 */

import { readFileSync, writeFileSync, readdirSync, existsSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const KIT = join(ROOT, 'artwork', 'living-datacenter', 'meshy-kit')
const HTML_OUT = join(KIT, 'CONTACT-SHEET.html')
const STATE_OUT = join(KIT, 'contact-sheet-state.json')

/**
 * Footprints del slot (ASSET-PIPELINE §5, verificado en runtime):
 * w×h×d en unidades de escena; `aspect` = aspecto frontal (w/h).
 * `meshes` = contrato bridge §4; `budget` = rango de tris del contrato.
 */
const ASSETS = [
  {
    id: '04-rack',
    name: 'Rack 42U',
    slot: 'heroRack · S1',
    glb: 'server_rack_v02.glb',
    w: 1, h: 2.4, d: 0.9,
    meshes: 'chassis · plinth · door · units · leds_status · leds_power · fasteners',
    budget: '6–8K tris',
    camera: 'S1: 20→32% alto desktop · en frame · ✅ COINCIDE',
    note: 'Puerta de malla: plano con alpha/normal map en runtime (bridge §4) — NO geometría de rejilla.',
  },
  {
    id: '01-switch',
    name: 'Switch 1U',
    slot: 'networkSwitch · S2/S3',
    glb: 'network_switch_v01.glb',
    w: 0.82, h: 0.07, d: 0.5,
    meshes: 'chassis · leds_status (+ cara de puertos)',
    budget: '4–6K tris',
    camera: 'S3: 1.4→2.7% alto · móvil FUERA entry/mid · ❌ sub-legible (slot cercano pendiente)',
    note: 'Grid de puertos como normal map bakeado — cero geometría por puerto.',
  },
  {
    id: '02-storage',
    name: 'Storage 2U-4U',
    slot: 'storageUnit · S4 (protagonista)',
    glb: 'storage_unit_v01.glb',
    w: 1.8, h: 1.0, d: 1.2,
    meshes: 'chassis · bezel_slats · leds_lcd · leds_status · rear_controllers',
    budget: '6–8K tris',
    camera: 'S4: FUERA en entry · 13→10% alto desktop · ⚠️ protagonista chico',
    note: 'Footprint 1.8×1.0×1.2 base-origen — NO proporciones 2U reales (bug corregido, §5 ASSET-PIPELINE).',
  },
  {
    id: '03-display',
    name: 'Display SIEM',
    slot: 'siemDisplay · S1/S3/S4/S5',
    glb: 'siem_display_v01.glb',
    w: 1.62, h: 0.9, d: 0.12,
    meshes: 'frame · screen · back_panel',
    budget: '3–4K tris',
    camera: 'S5: 4.4→8.7% (pulso) · S3: 12→30% legible · ⚠️ UI se lee en S3',
    note: 'Solo marco físico; pantalla = quad a +z, UI como textura/DOM separada (nunca en geometría).',
  },
]

const IMG_RE = /\.(png|jpe?g|webp|avif)$/i

function list(dir) {
  if (!existsSync(dir)) return []
  return readdirSync(dir).filter((f) => !f.startsWith('.')).sort()
}

function sizeLabel(p) {
  const kb = statSync(p).size / 1024
  return kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${Math.round(kb)} KB`
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
}

function collect(asset) {
  const dir = join(KIT, asset.id)
  const rawDir = join(dir, 'raw')
  const files = list(dir)
  const raws = list(rawDir)
  const refs = files.filter((f) => /^ref-/i.test(f) && IMG_RE.test(f))
  const glb = raws.filter((f) => /\.glb$/i.test(f))
  const preview = raws.find((f) => /-preview\./i.test(f) && IMG_RE.test(f)) ?? null
  const runtime = raws.find((f) => /-runtime\./i.test(f) && IMG_RE.test(f)) ?? null
  const mainGlb = glb.sort((a, b) => statSync(join(rawDir, b)).mtimeMs - statSync(join(rawDir, a)).mtimeMs)[0] ?? null
  return {
    refs,
    glb,
    mainGlb: mainGlb ? { name: mainGlb, size: sizeLabel(join(rawDir, mainGlb)) } : null,
    preview,
    runtime,
  }
}

function fpDims(a) {
  const boxH = 220
  const boxW = Math.max(70, Math.min(300, boxH * (a.w / a.h)))
  return { boxW, boxH, pad: 4, W: boxW + 8 }
}

function footprintSvg(a) {
  const { boxW, boxH, pad, W } = fpDims(a)
  return `<svg viewBox="0 0 ${W} ${boxH + pad * 2}" width="100%" style="max-width:${W}px;display:block;margin:0 auto">
  <rect x="${pad}" y="${pad}" width="${boxW}" height="${boxH}" rx="3" fill="rgba(90,160,255,0.06)" stroke="rgba(90,160,255,0.5)" stroke-width="1.5" stroke-dasharray="6 4"/>
  <line x1="${pad}" y1="${pad + boxH}" x2="${pad + boxW}" y2="${pad + boxH}" stroke="#4ade80" stroke-width="2"/>
  <text x="${pad + boxW / 2}" y="${pad + boxH / 2 - 6}" text-anchor="middle" fill="#9fc8ff" font-family="monospace" font-size="12">${a.w} × ${a.h} × ${a.d}</text>
  <text x="${pad + boxW / 2}" y="${pad + boxH / 2 + 12}" text-anchor="middle" fill="#5b7aa0" font-family="monospace" font-size="11">aspecto ${(a.w / a.h).toFixed(2)}:1</text>
</svg>`
}

/** Panel de comparación: el render del output superpuesto al SVG del footprint,
 * alineado a la caja del slot (sin deformar — object-fit: contain) con slider
 * de opacidad. Solo se activa cuando existe raw/<asset>-preview.*. */
function comparePanel(a, c) {
  if (!c.preview) {
    return panel('Comparación (overlay)', null, 'Sube raw/<asset>-preview.png (render del output post-proceso) para superponerlo al footprint con opacidad ajustable.')
  }
  const { boxW, boxH, W } = fpDims(a)
  return panel('Comparación (overlay)', `
  <div class="cmp" data-cmp="${esc(a.id)}">
    <div class="cmp-stage" style="width:${W}px">${footprintSvg(a)}
      <img class="cmp-overlay" src="${esc(a.id + '/raw/' + c.preview)}" style="width:${boxW}px;height:${boxH}px" alt="Render de ${esc(a.name)} superpuesto al footprint del slot"/>
    </div>
    <label class="cmp-slider">Opacidad <input type="range" min="0" max="100" value="50"/><span class="cmp-val">50%</span></label>
    <div class="cap">${esc(c.preview)} — arrastra la opacidad para alinear la silueta con la caja del slot (sin deformar: contain)</div>
  </div>`)
}

function panel(title, body, emptyHint) {
  return `<div class="panel"><h3>${title}</h3>${body || `<div class="empty">${emptyHint}</div>`}</div>`
}

function imgPanel(title, file, rel) {
  return panel(
    title,
    file ? `<a href="${esc(rel)}" target="_blank"><img src="${esc(rel)}" alt="${esc(title)}"/></a><div class="cap">${esc(file)}</div>` : null,
    `Pendiente — ${title === 'Output Meshy' ? 'descargar de Meshy a raw/<asset>-preview.png' : 'correr el probe y copiar la captura a raw/<asset>-runtime.png'}`
  )
}

function build() {
  let state = {}
  if (existsSync(STATE_OUT)) {
    try { state = JSON.parse(readFileSync(STATE_OUT, 'utf8')) } catch { state = {} }
  }

  const sections = ASSETS.map((a) => {
    const c = collect(a)
    const stateEntry = state[a.id] ?? { verdict: null, notes: '' }

    const refsHtml = c.refs
      .map((f) => `<a href="${esc(a.id + '/' + f)}" target="_blank"><img src="${esc(a.id + '/' + f)}" alt="${esc(f)}"/></a><div class="cap">${esc(f)}</div>`)
      .join('\n')
    const glbHtml = c.mainGlb
      ? `<div class="glb-hit">📦 <b>${esc(c.mainGlb.name)}</b> · ${esc(c.mainGlb.size)}${c.glb.length > 1 ? ` · +${c.glb.length - 1} más` : ''}</div>`
      : null

    state[a.id] = {
      asset: a.name,
      slot: a.slot,
      footprint: { w: a.w, h: a.h, d: a.d, aspect: +(a.w / a.h).toFixed(3) },
      baseline: a.glb,
      output: c.mainGlb ? { file: c.mainGlb.name, size: c.mainGlb.size } : null,
      preview: c.preview,
      runtime: c.runtime,
      verdict: stateEntry.verdict ?? null,
      notes: stateEntry.notes ?? '',
    }

    return `<section class="asset">
  <header><h2>${a.name} <span class="slot">${a.slot} · baseline ${a.glb}</span></h2></header>
  <div class="grid">
    ${panel('Referencia (kit)', refsHtml, 'Sin ref-* en la carpeta')}
    ${panel('Footprint del slot', footprintSvg(a) + `<div class="cap">${esc(a.meshes)} · ${a.budget}</div><div class="camfit">📷 ${esc(a.camera)}</div>`, '')}
    ${imgPanel('Output Meshy', c.preview, `${a.id}/raw/${c.preview ?? ''}`)}
    ${comparePanel(a, c)}
    ${imgPanel('Runtime en el sitio', c.runtime, `${a.id}/raw/${c.runtime ?? ''}`)}
  </div>
  ${glbHtml ? `<div class="raw-hits">${glbHtml}</div>` : '<div class="raw-hits muted">Sin output descargado en raw/ — la fila queda pendiente.</div>'}
  <p class="note">${esc(a.note)}</p>
  <p class="verdict">Veredicto: <b>${esc(state[a.id].verdict ?? 'PENDIENTE')}</b>${state[a.id].notes ? ` · ${esc(state[a.id].notes)}` : ''} <span class="muted">(editar en contact-sheet-state.json y re-correr)</span></p>
</section>`
  }).join('\n')

  const html = `<!doctype html>
<html lang="es"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Hoja de contacto — Living Datacenter × Meshy</title>
<style>
  :root{color-scheme:dark}
  body{font-family:system-ui,-apple-system,sans-serif;background:#070d18;color:#c9d6e8;margin:0;padding:24px;max-width:1200px;margin:0 auto}
  h1{font-size:20px;margin:0 0 4px}h1 small{color:#5b7aa0;font-weight:400;font-size:13px}
  .sub{color:#5b7aa0;font-size:13px;margin:0 0 24px}
  section.asset{background:#0b1424;border:1px solid #1c2b45;border-radius:10px;padding:16px 18px;margin-bottom:20px}
  header h2{margin:0 0 12px;font-size:16px;color:#e8f0fb}
  .slot{color:#5b7aa0;font-weight:400;font-size:12px;margin-left:8px}
  .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px}
  .panel{border:1px solid #16233c;border-radius:8px;padding:10px;background:#0a1420;min-height:220px}
  .panel h3{margin:0 0 8px;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#7fa3c9}
  .panel img{width:100%;max-height:190px;object-fit:contain;background:#050b14;border-radius:4px;display:block}
  .cap{font-size:11px;color:#5b7aa0;margin-top:6px;font-family:ui-monospace,monospace;word-break:break-all}
  .empty{color:#3d5678;font-size:12px;padding:60px 8px;text-align:center;border:1px dashed #1c2b45;border-radius:4px}
  .glb-hit{font-size:13px;color:#9fe8b0;margin-top:10px}
  .raw-hits{margin-top:10px;font-size:12px}.muted{color:#3d5678}
  .note{margin:10px 0 4px;font-size:12px;color:#8fa8c8}
  .camfit{margin-top:8px;font-size:11px;color:#9fc8ff;font-family:ui-monospace,monospace;border-top:1px dashed #16233c;padding-top:6px}
  .cmp-stage{position:relative;margin:0 auto}
  .cmp-overlay{position:absolute;top:4px;left:4px;object-fit:contain;opacity:.5;pointer-events:none;background:#050b14;border-radius:4px}
  .cmp-slider{display:flex;align-items:center;gap:8px;margin-top:8px;font-size:11px;color:#7fa3c9}
  .cmp-slider input{flex:1;accent-color:#5aa0ff}
  .cmp-val{font-family:ui-monospace,monospace;color:#9fc8ff;min-width:34px;text-align:right}
  .verdict{font-size:13px;color:#e8f0fb;border-top:1px solid #16233c;padding-top:8px;margin-top:8px}
</style></head>
<body>
  <h1>Hoja de contacto comparativa <small>Living Datacenter × Meshy.ai</small></h1>
  <p class="sub">Referencia ↔ footprint del slot ↔ output de Meshy ↔ runtime. Metodología y criterios: <code>docs/datacenter/MESHY-CONTACT-SHEET.md</code>. Regenerar con <code>node artwork/living-datacenter/meshy-contact-sheet.mjs</code>.</p>
${sections}
<script>
// QA-only — nunca en el bundle del sitio: opacidad del overlay en la hoja de contacto
;(function () {
  document.querySelectorAll('.cmp-slider input[type=range]').forEach(function (inp) {
    var upd = function () {
      var cmp = inp.closest('.cmp')
      var ov = cmp.querySelector('.cmp-overlay')
      if (ov) ov.style.opacity = inp.value / 100
      cmp.querySelector('.cmp-val').textContent = inp.value + '%'
    }
    inp.addEventListener('input', upd)
  })
})()
</script>
</body></html>`

  writeFileSync(HTML_OUT, html)
  writeFileSync(STATE_OUT, JSON.stringify(state, null, 2) + '\n')
  console.log(`✓ CONTACT-SHEET.html → ${HTML_OUT}`)
  console.log(`✓ contact-sheet-state.json → ${STATE_OUT}`)
  for (const a of ASSETS) {
    const s = state[a.id]
    console.log(`  ${a.name.padEnd(12)} output:${s.output ? s.output.file + ' ' + s.output.size : '—'} preview:${s.preview ?? '—'} runtime:${s.runtime ?? '—'} verdict:${s.verdict ?? 'PENDIENTE'}`)
  }
}

build()
