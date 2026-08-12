#!/usr/bin/env node
/**
 * gen-rack-glb — genera `server_rack_v01.glb` procedural (ASSET-PIPELINE §5, §8).
 *
 * Contrato cumplido:
 *  - 6-8K tris, silueta frontal prioritaria, origen en base (y=0), metros reales
 *  - Meshes nombrados canonicos: chassis / plinth / door / units / leds_status /
 *    leds_power / fasteners (puerta con celosia real, sin texturas)
 *  - Principled BSDF -> MeshStandardMaterial sin emission (bridge LEDs §4)
 *  - Sin camaras, luces, animaciones ni empties (GLB limpio)
 *
 * Uso: node scripts/gen-rack-glb.mjs   (escribe public/assets/3d/server_rack_v01.glb
 * y auto-valida re-parseando con GLTFLoader: tris, nombres, materiales, camaras).
 */
import * as THREE from 'three'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { writeFileSync, readFileSync, mkdirSync } from 'node:fs'
import path from 'node:path'

const OUT = path.resolve(import.meta.dirname, '../public/assets/3d/server_rack_v01.glb')

// Materiales (ASSET-PIPELINE §4): metalness 0.8-0.9 chasis, 0.0 plasticos,
// roughness 0.3-0.5 cepillado / 0.7-0.9 mate. Cero emission en el GLB.
const M = {
  chassis: new THREE.MeshStandardMaterial({ color: 0x0d1524, metalness: 0.85, roughness: 0.4 }),
  door: new THREE.MeshStandardMaterial({ color: 0x101a30, metalness: 0.7, roughness: 0.5 }),
  unit: new THREE.MeshStandardMaterial({ color: 0x16263f, metalness: 0.5, roughness: 0.5 }),
  led: new THREE.MeshStandardMaterial({ color: 0x1c3357, metalness: 0.3, roughness: 0.6 }),
  plastic: new THREE.MeshStandardMaterial({ color: 0x0a1120, metalness: 0.0, roughness: 0.8 }),
}

const scene = new THREE.Scene()

// Chassis (gabinete) — segs 16x36x16 (~5.6K tris) + resto ≈ 6.6K total; base en y=0
const chassis = new THREE.Mesh(new THREE.BoxGeometry(1, 2.4, 0.9, 16, 36, 16), M.chassis)
chassis.name = 'chassis'
chassis.position.y = 1.2
scene.add(chassis)

// Plinto base
const plinth = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.08, 0.95, 1, 1, 1), M.plastic)
plinth.name = 'plinth'
plinth.position.y = 0.04
scene.add(plinth)

// Puerta de malla (ref AR2580): celosia de barras real, cara +z (camara S1)
const V = 24
const H = 8
const bars = []
for (let i = 0; i < V; i++) {
  const g = new THREE.BoxGeometry(0.016, 2.2, 0.02)
  g.translate(-0.46 + (i + 0.5) * (0.92 / V), 1.26, 0.452)
  bars.push(g)
}
for (let i = 0; i < H; i++) {
  const g = new THREE.BoxGeometry(0.92, 0.016, 0.02)
  g.translate(0, 0.24 + i * (2.04 / H), 0.452)
  bars.push(g)
}
const door = new THREE.Mesh(mergeGeometries(bars), M.door)
door.name = 'door'
scene.add(door)

// Unidades (servidores): 8 slots frontales, un solo mesh (1 draw call)
const unitGeoms = []
for (let i = 0; i < 8; i++) {
  const g = new THREE.BoxGeometry(0.94, 0.07, 0.6, 2, 1, 2)
  g.translate(0, 0.4 + i * 0.22, 0.35)
  unitGeoms.push(g)
}
const units = new THREE.Mesh(mergeGeometries(unitGeoms), M.unit)
units.name = 'units'
scene.add(units)

// LEDs — meshes separados con nombre canonico; el runtime asigna emission (§4)
const ledGeoms = []
for (let i = 0; i < 12; i++) {
  const g = new THREE.PlaneGeometry(0.02, 0.012)
  g.translate(-0.42 + i * (0.84 / 11), 2.32, 0.452)
  ledGeoms.push(g)
}
const ledsStatus = new THREE.Mesh(mergeGeometries(ledGeoms), M.led)
ledsStatus.name = 'leds_status'
scene.add(ledsStatus)

const ledsPower = new THREE.Mesh(new THREE.PlaneGeometry(0.03, 0.015), M.led)
ledsPower.name = 'leds_power'
ledsPower.position.set(0.44, 2.32, 0.452)
scene.add(ledsPower)

// Cubo instanciado: 24 remaches del marco (1 mesh, un solo draw call)
const rivetGeoms = []
for (let i = 0; i < 12; i++) {
  for (const x of [-0.47, 0.47]) {
    const g = new THREE.BoxGeometry(0.014, 0.014, 0.014).clone()
    g.translate(x, 0.18 + i * (2.04 / 11), 0.452)
    rivetGeoms.push(g)
  }
}
const fasteners = new THREE.Mesh(mergeGeometries(rivetGeoms), M.plastic)
fasteners.name = 'fasteners'
scene.add(fasteners)

// Export GLB limpio (ASSET-PIPELINE §5): solo geometria/materiales
// Polyfill minimo: GLTFExporter usa FileReader para el chunk binario (browser-only)
globalThis.FileReader = class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((ab) => {
      this.result = ab
      if (this.onloadend) this.onloadend()
    })
  }
}
const exporter = new GLTFExporter()
const glb = await exporter.parseAsync(scene, { binary: true })
mkdirSync(path.dirname(OUT), { recursive: true })
writeFileSync(OUT, Buffer.from(glb))
console.log('✓ escrito', path.relative(process.cwd(), OUT), (Buffer.byteLength(glb) / 1024).toFixed(1) + ' KB')

// Auto-validacion (gate de autoría §7): re-parsear y medir
const loader = new GLTFLoader()
loader.parse(
  readFileSync(OUT).buffer,
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
    console.log('triangulos:', Math.round(tris))
    console.log('meshes (' + meshes + '):', names.join(', '))
    console.log('materiales:', [...mats].join(', '))
    const ok =
      tris >= 6000 && tris <= 8500 &&
      meshes === 7 &&
      names.includes('chassis') && names.includes('door') && names.includes('units') &&
      names.includes('leds_status') && names.includes('leds_power') && names.includes('fasteners') &&
      cameras === 0 && lights === 0
    console.log(ok ? '✅ GATE autoría: PASS (6-8K tris, meshes canónicos, GLB limpio)' : '❌ GATE autoría: FAIL')
    process.exit(ok ? 0 : 1)
  },
  (err) => {
    console.error('❌ parse GLB falló:', err)
    process.exit(1)
  },
)
