#!/usr/bin/env node
/**
 * glb-pipeline — pipeline de optimización de assets GLB (ASSET-PIPELINE.md §6).
 *
 * Etapas:  optimize → validate → inspect → payload gate (< 3 MB, SPEC §12).
 *
 * SIN dependencias instaladas: usa `gltf-transform`/`gltf-validator` desde
 * node_modules/.bin si existen. Si no están instalados y no se pasa `--strict`,
 * el pipeline se omite con estado SKIP (Fase 6 es opcional — default SKIP,
 * SPEC §12). Para activar: npm i -D @gltf-transform/cli gltf-validator.
 *
 * Uso:
 *   node scripts/glb-pipeline.mjs                    # pipeline completo
 *   node scripts/glb-pipeline.mjs --verify           # solo validate + payload (sin optimize)
 *   node scripts/glb-pipeline.mjs --promote          # gate PASS → copia optimizados a /public
 *   node scripts/glb-pipeline.mjs --strict           # falla si faltan las herramientas (CI)
 *   node scripts/glb-pipeline.mjs --src DIR --out DIR
 *
 * Perfil de flags verificado contra gltf-transform CLI 4.4.2 (fuente):
 *   --compress draco --texture-compress ktx2 --texture-size 2048
 *   --instance --flatten --join --join-named false --simplify false
 *   (no existen --resize ni --dedup en `optimize`; --join-named false preserva
 *   los meshes nombrados `leds_*` del contrato ASSET-PIPELINE §4; --simplify
 *   false respeta el presupuesto de tris del authoring, §2.)
 */
import { spawnSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const SRC_DEFAULT = path.join(ROOT, 'public/assets/3d')
const OUT_DEFAULT = path.join(ROOT, '.glb-pipeline/optimized')
const BUDGET_BYTES = 3 * 1024 * 1024 // SPEC §12: payload 3D total < 3 MB

const OPTIMIZE_FLAGS = [
  '--compress', 'draco',
  '--texture-compress', 'ktx2',
  '--texture-size', '2048',
  '--instance',
  '--flatten',
  '--join',
  '--join-named', 'false', // preserva meshes nombrados (leds_*, §4)
  '--simplify', 'false',   // el presupuesto de tris lo fija el authoring (§2)
]

// --- utilidades ------------------------------------------------------------

const bin = (name) => {
  const candidates =
    process.platform === 'win32'
      ? [path.join(ROOT, `node_modules/.bin/${name}.cmd`), path.join(ROOT, `node_modules/.bin/${name}`)]
      : [path.join(ROOT, `node_modules/.bin/${name}`)]
  return candidates.find((p) => existsSync(p)) ?? null
}

const run = (cmd, args, { cwd = ROOT, quiet = false } = {}) => {
  // En Windows los bins de npm son .cmd → spawnSync necesita shell
  const isCmd = process.platform === 'win32' && cmd.toLowerCase().endsWith('.cmd')
  const res = isCmd
    ? spawnSync(cmd + ' ' + args.map((a) => (/\s/.test(a) ? `"${a}"` : a)).join(' '), {
        cwd, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024, shell: true,
      })
    : spawnSync(cmd, args, { cwd, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 })
  const out = [res.stdout, res.stderr].filter(Boolean).join('\n').trim()
  if (!quiet && out) console.log(out)
  return { ok: res.status === 0, status: res.status, out }
}

const fmt = (bytes) => (bytes / 1024 / 1024).toFixed(2) + ' MB'

// Resolución de herramientas: bin local; si faltan → SKIP (o error con --strict)
function resolveTools(strict) {
  const gtf = bin('gltf-transform')
  const validator = bin('gltf-validator')
  if (gtf || validator) return { gtf, validator }

  if (strict) {
    console.error('❌ Herramientas no disponibles y --strict activo. Instala cuando toque la Fase 6:')
    console.error('   npm i -D @gltf-transform/cli gltf-validator')
    process.exit(1)
  }
  console.log('ℹ️  Pipeline SKIP — herramientas no instaladas (Fase 6 opcional, default SKIP).')
  console.log('   Para activar: npm i -D @gltf-transform/cli gltf-validator')
  process.exit(0)
}

function glbSources(dir) {
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter((f) => f.toLowerCase().endsWith('.glb'))
    .map((f) => path.join(dir, f))
}

function dirBytes(dir) {
  if (!existsSync(dir)) return 0
  return readdirSync(dir)
    .filter((f) => f.toLowerCase().endsWith('.glb'))
    .reduce((acc, f) => acc + statSync(path.join(dir, f)).size, 0)
}

function payloadGate(dir) {
  const total = dirBytes(dir)
  const ok = total <= BUDGET_BYTES
  console.log(`\n📦 PAYLOAD GATE (SPEC §12: < 3 MB) — ${dir === SRC_DEFAULT ? 'public/assets/3d' : path.relative(ROOT, dir)}`)
  if (!existsSync(dir)) {
    console.log('   (directorio vacío/inexistente — 0 bytes)')
    return ok
  }
  for (const f of readdirSync(dir).filter((f) => f.toLowerCase().endsWith('.glb'))) {
    console.log(`   ${f.padEnd(30)} ${fmt(statSync(path.join(dir, f)).size)}`)
  }
  console.log(`   TOTAL: ${fmt(total)} ${ok ? '✅ dentro de presupuesto' : '❌ EXCEDE presupuesto'}`)
  if (!ok) {
    console.log('   Excepción §12: requiere demostrar impacto visual antes de aceptar (ASSET-PIPELINE §6).')
  }
  return ok
}

// --- pasos -----------------------------------------------------------------

function stepOptimize(gtf, srcDir, outDir) {
  const sources = glbSources(srcDir)
  if (sources.length === 0) {
    console.log('ℹ️  No hay GLB en', path.relative(ROOT, srcDir), '— nada que optimizar.')
    return { ran: false, ok: true }
  }
  mkdirSync(outDir, { recursive: true })
  let allOk = true
  for (const src of sources) {
    const out = path.join(outDir, path.basename(src))
    console.log(`\n⚙️  optimize ${path.basename(src)}`)
    const res = run(gtf, ['optimize', src, out, ...OPTIMIZE_FLAGS])
    if (!res.ok) {
      console.error(`   ❌ optimize falló (exit ${res.status})`)
      allOk = false
    }
  }
  return { ran: true, ok: allOk }
}

function stepInspect(gtf, outDir) {
  if (!existsSync(outDir)) return { ran: false, ok: true }
  const outputs = glbSources(outDir)
  let allOk = true
  for (const out of outputs) {
    console.log(`\n🔎 inspect ${path.basename(out)}`)
    const res = run(gtf, ['inspect', out])
    if (!res.ok) allOk = false
  }
  return { ran: outputs.length > 0, ok: allOk }
}

function stepValidate(gtf, validator, outDir) {
  if (!existsSync(outDir)) return { ran: false, ok: true }
  const outputs = glbSources(outDir)
  let allOk = true
  const engine = validator ? 'gltf-validator' : 'gltf-transform validate'
  for (const out of outputs) {
    console.log(`\n🧪 validate ${path.basename(out)} (${engine})`)
    // gltf-validator (Khronos) si está; si no, el validate integrado del CLI
    const res = validator ? run(validator, [out]) : run(gtf, ['validate', out])
    if (!res.ok) {
      console.error(`   ❌ validación falló (exit ${res.status})`)
      allOk = false
    }
  }
  return { ran: outputs.length > 0, ok: allOk }
}

// --- main ------------------------------------------------------------------

const argv = process.argv.slice(2)
const opts = {
  srcDir: SRC_DEFAULT,
  outDir: OUT_DEFAULT,
  verify: argv.includes('--verify'),
  promote: argv.includes('--promote'),
  strict: argv.includes('--strict'),
}
const i = argv.indexOf('--src'); if (i !== -1) opts.srcDir = path.resolve(ROOT, argv[i + 1])
const j = argv.indexOf('--out'); if (j !== -1) opts.outDir = path.resolve(ROOT, argv[j + 1])
if (argv.includes('--help') || argv.includes('-h')) {
  console.log('Uso: node scripts/glb-pipeline.mjs [--verify] [--promote] [--strict] [--src DIR] [--out DIR]')
  process.exit(0)
}

console.log('━━━ LIVING DATACENTER — glb-pipeline (ASSET-PIPELINE §6) ━━━')
const { gtf, validator } = resolveTools(opts.strict)

let gate = true

if (opts.verify) {
  // Solo validar el estado actual de /public/assets/3d + payload
  const v = stepValidate(gtf, validator, opts.srcDir)
  gate = v.ok && payloadGate(opts.srcDir)
} else {
  const o = stepOptimize(gtf, opts.srcDir, opts.outDir)
  const v = stepValidate(gtf, validator, opts.outDir)
  const ins = stepInspect(gtf, opts.outDir)
  const pay = payloadGate(opts.outDir)
  gate = o.ok && v.ok && ins.ok && pay
}

if (gate && opts.promote) {
  console.log('\n🚀 PROMOTE → public/assets/3d/')
  for (const f of readdirSync(opts.outDir).filter((f) => f.toLowerCase().endsWith('.glb'))) {
    copyFileSync(path.join(opts.outDir, f), path.join(opts.srcDir, f))
    console.log(`   ${f} ✓`)
  }
  console.log('⚠️  Reinicia el servidor: `next start` mapea /public al arrancar y hace 404 a archivos nuevos (hallazgo verificado).')
}

console.log(gate ? '\n✅ GATE: PASS — assets listos para runtime (fallback procedural en GlbAsset, SPEC §37)' : '\n❌ GATE: FAIL')
process.exit(gate ? 0 : 1)
