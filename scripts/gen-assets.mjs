#!/usr/bin/env node
/**
 * gen-assets — genera los 4 GLBs del pipeline (ASSET-PIPELINE §5, §8):
 *   server_rack_v02.glb     (6-8K tris, 9 meshes)   rack hero S1
 *   network_switch_v01.glb  (4-6K tris, 7 meshes)   switch S2/S3
 *   storage_unit_v01.glb    (6-8K tris, 7 meshes)   storage S3/S4
 *   siem_display_v01.glb    (3-4K tris, 5 meshes)   SIEM display S3/S4
 *
 * Contrato (igual que gen-rack-glb): Principled BSDF -> MeshStandardMaterial
 * SIN emission (bridge LEDs §4: el runtime asigna emisivo a `leds_*`/`screen`),
 * meshes con nombres canónicos, origen en base, sin cámaras/luces/animaciones.
 * Cada asset se auto-valida re-parseando con GLTFLoader (tris, nombres, GLB limpio)
 * y al final se reporta el payload total vs el presupuesto §12 (< 3 MB).
 *
 * Uso: node scripts/gen-assets.mjs
 */
import * as THREE from 'three'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { writeFileSync, readFileSync, mkdirSync } from 'node:fs'
import path from 'node:path'

const OUT_DIR = path.resolve(import.meta.dirname, '../public/assets/3d')

// Polyfill minimo: GLTFExporter usa FileReader para el chunk binario (browser-only)
globalThis.FileReader = class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((ab) => {
      this.result = ab
      if (this.onloadend) this.onloadend()
    })
  }
}

// Materiales (ASSET-PIPELINE §4): metalness 0.8-0.9 chasis, 0.0 plasticos,
// roughness 0.3-0.5 cepillado / 0.7-0.9 mate. Cero emission en el GLB.
const M = {
  chassis: new THREE.MeshStandardMaterial({ color: 0x0d1524, metalness: 0.85, roughness: 0.4 }),
  // Chasis del rack: hueco por delante y con interior visible (DoubleSide) —
  // las unidades con glow se ven a través de la puerta de malla (ver buildRack).
  chassisHollow: new THREE.MeshStandardMaterial({ color: 0x0d1524, metalness: 0.85, roughness: 0.4, side: THREE.DoubleSide }),
  door: new THREE.MeshStandardMaterial({ color: 0x101a30, metalness: 0.7, roughness: 0.5 }),
  unit: new THREE.MeshStandardMaterial({ color: 0x16263f, metalness: 0.5, roughness: 0.5 }),
  led: new THREE.MeshStandardMaterial({ color: 0x1c3357, metalness: 0.3, roughness: 0.6 }),
  plastic: new THREE.MeshStandardMaterial({ color: 0x0a1120, metalness: 0.0, roughness: 0.8 }),
  silver: new THREE.MeshStandardMaterial({ color: 0xb8c0cc, metalness: 0.9, roughness: 0.35 }),
  port: new THREE.MeshStandardMaterial({ color: 0x05070c, metalness: 0.0, roughness: 0.85 }),
  screen: new THREE.MeshStandardMaterial({ color: 0x0b1220, metalness: 0.0, roughness: 0.6 }),
  frame: new THREE.MeshStandardMaterial({ color: 0x0a1120, metalness: 0.3, roughness: 0.6 }),
}

const mergedMesh = (name, geoms, material) => {
  const m = new THREE.Mesh(mergeGeometries(geoms), material)
  m.name = name
  return m
}

// --- builders --------------------------------------------------------------

function buildRack() {
  const scene = new THREE.Scene()
  // Chasis HUECO por delante: 5 PLANOS fusionados (paredes finas — el grosor
  // real es invisible a escala; el interior se ve a través de la puerta de malla,
  // por eso DoubleSide). La cara +z se omite: la puerta con cutout (runtime) ES
  // la cara frontal; las unidades con glow se ven por los huecos (look AR2580 —
  // con la cara sólida el patrón era imperceptible, verificado en runtime).
  // Incluye un piso interior bajo la puerta (la puerta no llega al suelo: 0.16).
  const S = { h: 44 }
  const pl = (w, h, ws, hs, rx, ry, rz, x, y, z) => {
    const g = new THREE.PlaneGeometry(w, h, ws, hs)
    g.rotateX(rx)
    g.rotateY(ry)
    g.rotateZ(rz)
    g.translate(x, y, z)
    return g
  }
  const parts = [
    pl(0.9, 2.4, 16, S.h, 0, Math.PI / 2, 0, -0.5, 1.2, 0),   // pared izq
    pl(0.9, 2.4, 16, S.h, 0, -Math.PI / 2, 0, 0.5, 1.2, 0),   // pared der
    pl(1, 0.9, 20, 20, -Math.PI / 2, 0, 0, 0, 2.39, 0),        // techo
    pl(1, 0.9, 20, 20, Math.PI / 2, 0, 0, 0, 0.02, 0),         // piso interior
    pl(1, 2.4, 16, S.h, 0, Math.PI, 0, 0, 1.2, -0.45),         // pared trasera
  ]
  const chassis = new THREE.Mesh(mergeGeometries(parts), M.chassisHollow)
  chassis.name = 'chassis'
  scene.add(chassis)
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.08, 0.95, 1, 1, 1), M.plastic)
  plinth.name = 'plinth'
  plinth.position.y = 0.04
  scene.add(plinth)
  // Postes de esquina (estructural — el rack lee como rack al instante, no
  // como caja) + bandeja de cableado superior (cable tray).
  const frameGeoms = []
  for (const x of [-0.47, 0.47]) {
    for (const z of [-0.44, 0.44]) {
      const g = new THREE.BoxGeometry(0.035, 2.42, 0.035)
      g.translate(x, 1.21, z)
      frameGeoms.push(g)
    }
  }
  scene.add(mergedMesh('frame_posts', frameGeoms, M.chassis))
  const tray = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.02, 0.28, 1, 1, 1), M.plastic)
  tray.name = 'tray'
  tray.position.set(0, 2.42, 0.04)
  scene.add(tray)
  // Puerta: plano PBR-neutral — el patrón de malla AR2580 (alpha/bump) lo
  // inyecta el runtime (bridge de texturas, ASSET-PIPELINE §4/§3.4 — cero
  // geometría por vent; antes era celosía real de 32 barras, ~384 tris).
  const door = new THREE.Mesh(new THREE.PlaneGeometry(0.92, 2.2), M.door)
  door.name = 'door'
  door.position.set(0, 1.26, 0.452)
  scene.add(door)
  const unitGeoms = []
  for (let i = 0; i < 8; i++) {
    // Unidades RECESADAS (z=0.15, flush con la cara interior): quedan DETRÁS de
    // la puerta (z=0.452) — sus frentes emisivos se ven a través de los huecos
    // de la malla, con las barras por delante.
    const g = new THREE.BoxGeometry(0.94, 0.07, 0.6, 2, 1, 2)
    g.translate(0, 0.4 + i * 0.22, 0.15)
    unitGeoms.push(g)
  }
  scene.add(mergedMesh('units', unitGeoms, M.unit))
  const ledGeoms = []
  for (let i = 0; i < 12; i++) {
    const g = new THREE.PlaneGeometry(0.02, 0.012)
    g.translate(-0.42 + i * (0.84 / 11), 2.32, 0.456)
    ledGeoms.push(g)
  }
  scene.add(mergedMesh('leds_status', ledGeoms, M.led))
  const ledsPower = new THREE.Mesh(new THREE.PlaneGeometry(0.03, 0.015), M.led)
  ledsPower.name = 'leds_power'
  ledsPower.position.set(0.44, 2.32, 0.456)
  scene.add(ledsPower)
  const rivetGeoms = []
  for (let i = 0; i < 12; i++) {
    for (const x of [-0.47, 0.47]) {
      const g = new THREE.BoxGeometry(0.014, 0.014, 0.014).clone()
      g.translate(x, 0.18 + i * (2.04 / 11), 0.452)
      rivetGeoms.push(g)
    }
  }
  scene.add(mergedMesh('fasteners', rivetGeoms, M.plastic))
  return scene
}

function buildSwitch() {
  const scene = new THREE.Scene()
  // chasis 1U (ref hero Cisco 9300X)
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.07, 0.5, 32, 5, 18), M.chassis) // ~3.3K tris
  chassis.name = 'chassis'
  chassis.position.y = 0.035
  scene.add(chassis)
  // orejas de rack
  const flanges = [
    new THREE.BoxGeometry(0.02, 0.07, 0.06).translate(-0.43, 0.035, 0),
    new THREE.BoxGeometry(0.02, 0.07, 0.06).translate(0.43, 0.035, 0),
  ]
  scene.add(mergedMesh('flanges', flanges, M.plastic))
  // 48 puertos RJ45 (2 filas × 24) en cara +z — geometría, sin texturas
  const ports = []
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 24; c++) {
      const g = new THREE.BoxGeometry(0.014, 0.016, 0.02)
      g.translate(-0.34 + c * 0.028, 0.045 + r * 0.022, 0.245)
      ports.push(g)
    }
  }
  scene.add(mergedMesh('ports', ports, M.port))
  // 8 uplinks SFP a la derecha
  const sfp = []
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 4; c++) {
      const g = new THREE.BoxGeometry(0.045, 0.018, 0.03)
      g.translate(0.31 + c * 0.055, 0.045 + r * 0.022, 0.24)
      sfp.push(g)
    }
  }
  scene.add(mergedMesh('sfp', sfp, M.chassis))
  // Ventilación lateral: 4 tiras oscuras por lado, flush en el canto
  // (ref 9300X — patrón repetitivo bakeable, sin rejilla geométrica)
  const ventGeoms = []
  for (const sx of [-0.414, 0.414]) {
    for (let i = 0; i < 4; i++) {
      const g = new THREE.BoxGeometry(0.012, 0.066, 0.006)
      g.translate(sx, 0.035, -0.16 + i * 0.1)
      ventGeoms.push(g)
    }
  }
  scene.add(mergedMesh('vents', ventGeoms, M.port))
  // Aletas de disipación superiores (ref switch enterprise 1U)
  const finGeoms = []
  for (let i = 0; i < 3; i++) {
    const g = new THREE.BoxGeometry(0.62, 0.008, 0.02)
    g.translate(0, 0.079, -0.1 + i * 0.1)
    finGeoms.push(g)
  }
  scene.add(mergedMesh('fins', finGeoms, M.silver))
  // hilera de LEDs de estado (runtime emisivo, §4)
  const leds = []
  for (let c = 0; c < 16; c++) {
    const g = new THREE.BoxGeometry(0.012, 0.008, 0.008)
    g.translate(-0.4 + c * 0.052, 0.068, 0.25)
    leds.push(g)
  }
  scene.add(mergedMesh('leds_status', leds, M.led))
  return scene
}

function buildStorage() {
  const scene = new THREE.Scene()
  // Cuerpo al FOOTPRINT del slot (1.8 × 1 × 1.2): el GLB reemplaza al bloque
  // procedural 1×1×1 escalado [1.8,1,1.2] (ASSET-PIPELINE §5 — misma convención
  // que el rack: autorizar a las dims del slot, origen en base, sin scale en runtime).
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.0, 1.2, 30, 16, 26), M.chassis) // ~6.7K tris
  chassis.name = 'chassis'
  chassis.position.y = 0.5
  scene.add(chassis)
  // bezel plateado: listones de ventilación solo en la zona superior
  // (ref AFF A250 — la zona baja ahora son bahías de discos)
  const slats = []
  for (let i = 0; i < 14; i++) {
    const g = new THREE.BoxGeometry(1.62, 0.02, 0.03)
    g.translate(0, 0.66 + i * (0.24 / 13), 0.602)
    slats.push(g)
  }
  scene.add(mergedMesh('bezel_slats', slats, M.silver))
  // Bahías de discos: 2 columnas × 6 filas de caddies con gap (ref ME5/AFF)
  const bayGeoms = []
  for (let col = 0; col < 2; col++) {
    for (let row = 0; row < 6; row++) {
      const g = new THREE.BoxGeometry(0.62, 0.065, 0.03)
      g.translate(-0.3 + col * 0.62, 0.14 + row * 0.075, 0.602)
      bayGeoms.push(g)
    }
  }
  scene.add(mergedMesh('drive_bays', bayGeoms, M.unit))
  // Manijas laterales hot-swap (barras de agarre, ref AFF A250)
  const handleGeoms = []
  for (const sx of [-0.915, 0.915]) {
    for (const y of [0.3, 0.75]) {
      const g = new THREE.BoxGeometry(0.02, 0.035, 0.4)
      g.translate(sx, y, 0.45)
      handleGeoms.push(g)
    }
  }
  scene.add(mergedMesh('handles', handleGeoms, M.silver))
  // display LCD (ME5) — runtime emisivo cyan (sobre los listones superiores)
  const lcd = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 0.2), M.led)
  lcd.name = 'leds_lcd'
  lcd.position.set(0.5, 0.75, 0.602)
  scene.add(lcd)
  // LEDs de estado
  const leds = []
  for (let c = 0; c < 8; c++) {
    const g = new THREE.BoxGeometry(0.016, 0.016, 0.01)
    g.translate(-0.72 + c * 0.2, 0.88, 0.602)
    leds.push(g)
  }
  scene.add(mergedMesh('leds_status', leds, M.led))
  // trasera ME5: 2 controladores + 2 PSU (visible en vistas amplias S4/S5)
  const rear = []
  for (const x of [-0.5, 0.5]) {
    const g = new THREE.BoxGeometry(0.4, 0.24, 0.04)
    g.translate(x, 0.55, -0.59)
    rear.push(g)
  }
  for (const x of [-0.5, 0.5]) {
    const g = new THREE.BoxGeometry(0.36, 0.16, 0.04)
    g.translate(x, 0.2, -0.59)
    rear.push(g)
  }
  scene.add(mergedMesh('rear_controllers', rear, M.plastic))
  return scene
}

function buildDisplay() {
  const scene = new THREE.Scene()
  // marco industrial delgado (ref monitores NOC)
  const frame = []
  const bars = [
    { w: 1.62, h: 0.06, x: 0, y: 0.48 },
    { w: 1.62, h: 0.06, x: 0, y: -0.48 },
    { w: 0.06, h: 0.9, x: 0.81, y: 0 },
    { w: 0.06, h: 0.9, x: -0.81, y: 0 },
  ]
  for (const b of bars) {
    const g = new THREE.BoxGeometry(b.w, b.h, 0.06, 24, 2, 2)
    g.translate(b.x, b.y, 0)
    frame.push(g)
  }
  scene.add(mergedMesh('frame', frame, M.frame))
  // pantalla — el runtime le asigna emisivo (bridge §4); UI oscura de referencia
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.84, 32, 20), M.screen)
  screen.name = 'screen'
  screen.position.set(0, 0, 0.032)
  scene.add(screen)
  // panel trasero
  const back = new THREE.Mesh(new THREE.BoxGeometry(1.62, 0.9, 0.05, 16, 10, 2), M.plastic)
  back.name = 'back_panel'
  back.position.z = -0.03
  scene.add(back)
  // Bracket de montaje (VESA simplificado — se ve en pull-backs amplios)
  const mount = []
  const arm1 = new THREE.BoxGeometry(0.06, 0.06, 0.14).translate(0, 0.2, -0.1)
  const arm2 = new THREE.BoxGeometry(0.06, 0.06, 0.14).translate(0, -0.2, -0.1)
  const plate = new THREE.BoxGeometry(0.32, 0.32, 0.02).translate(0, 0, -0.17)
  mount.push(arm1, arm2, plate)
  scene.add(mergedMesh('mount', mount, M.plastic))
  // LED de encendido (emisivo en runtime — nombre canónico leds_*)
  const pwr = new THREE.Mesh(new THREE.PlaneGeometry(0.015, 0.008), M.led)
  pwr.name = 'leds_power'
  pwr.position.set(0.74, -0.42, 0.036)
  scene.add(pwr)
  return scene
}

// --- export + auto-validación por asset -------------------------------------

const ASSETS = [
  {
    file: 'server_rack_v02.glb', build: buildRack, min: 6000, max: 8500, meshes: 9,
    names: ['chassis', 'plinth', 'door', 'units', 'leds_status', 'leds_power', 'fasteners', 'frame_posts', 'tray'],
  },
  {
    file: 'network_switch_v01.glb', build: buildSwitch, min: 4000, max: 6000, meshes: 7,
    names: ['chassis', 'flanges', 'ports', 'sfp', 'leds_status', 'vents', 'fins'],
  },
  {
    file: 'storage_unit_v01.glb', build: buildStorage, min: 6000, max: 8500, meshes: 7,
    names: ['chassis', 'bezel_slats', 'leds_lcd', 'leds_status', 'rear_controllers', 'drive_bays', 'handles'],
  },
  {
    file: 'siem_display_v01.glb', build: buildDisplay, min: 3000, max: 4500, meshes: 5,
    names: ['frame', 'screen', 'back_panel', 'mount', 'leds_power'],
  },
]

async function exportAndValidate(spec) {
  const exporter = new GLTFExporter()
  const glb = await exporter.parseAsync(spec.build(), { binary: true })
  mkdirSync(OUT_DIR, { recursive: true })
  const out = path.join(OUT_DIR, spec.file)
  writeFileSync(out, Buffer.from(glb))
  const kb = (Buffer.byteLength(glb) / 1024).toFixed(1)

  return await new Promise((resolve) => {
    const loader = new GLTFLoader()
    loader.parse(
      readFileSync(out).buffer,
      '',
      (result) => {
        let tris = 0
        let meshes = 0
        const names = []
        const mats = new Set()
        let cameras = 0
        let lights = 0
        result.scene.traverse((o) => {
          if (o.isMesh) {
            meshes++
            names.push(o.name)
            const geo = o.geometry
            tris += (geo.index ? geo.index.count : geo.attributes.position.count) / 3
            const arr = Array.isArray(o.material) ? o.material : [o.material]
            arr.forEach((m) => mats.add(m.type))
          }
          if (o.isCamera) cameras++
          if (o.isLight) lights++
        })
        // El gate valida nombres canónicos presentes, cero nombres inesperados
        // y conteo acotado (si el authoring usa multi-material, GLTF divide en
        // primitivas — verificado con el frontVoid previo, descartado).
        const ok =
          tris >= spec.min && tris <= spec.max &&
          meshes <= spec.meshes * 2 &&
          spec.names.every((n) => names.includes(n)) &&
          names.every((n) => spec.names.includes(n)) &&
          [...mats].every((t) => t === 'MeshStandardMaterial') &&
          cameras === 0 && lights === 0
        console.log(
          `${ok ? '✅' : '❌'} ${spec.file.padEnd(26)} ${Math.round(tris)} tris · ${meshes} meshes · ${kb} KB · ${ok ? 'GATE PASS' : 'GATE FAIL'}`,
        )
        if (!ok) console.log('   nombres:', names.join(', '), '| materiales:', [...mats].join(', '))
        resolve({ ok, bytes: Buffer.byteLength(glb) })
      },
      (err) => {
        console.error('❌ parse falló en', spec.file, err)
        resolve({ ok: false, bytes: Buffer.byteLength(glb) })
      },
    )
  })
}

// --- main -------------------------------------------------------------------

console.log('━━━ gen-assets — Living Datacenter GLBs (ASSET-PIPELINE §8) ━━━')
let allOk = true
let totalBytes = 0
for (const spec of ASSETS) {
  const r = await exportAndValidate(spec)
  allOk = allOk && r.ok
  totalBytes += r.bytes
}
const budget = 3 * 1024 * 1024
console.log(`\n📦 PAYLOAD total /public/assets/3d: ${(totalBytes / 1024 / 1024).toFixed(2)} MB (presupuesto §12: 3 MB) ${totalBytes <= budget ? '✅' : '❌'}`)
allOk = allOk && totalBytes <= budget
console.log(allOk ? '\n✅ GATE GLOBAL: PASS — 4 assets listos (sin texturas; LEDs/screen con emisivo en runtime, bridge §4)' : '\n❌ GATE GLOBAL: FAIL')
process.exit(allOk ? 0 : 1)
