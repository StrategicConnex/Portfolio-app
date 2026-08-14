'use client'

import { useEffect, useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { getMeshDoorTexture } from './meshDoorTexture'
import { getSiemUiTexture } from './screenUiTexture'
import { clearcoatForMesh } from '@/lib/datacenter.materials'
import {
  getBrushedBump,
  getBrushedMap,
  getChassisBump,
  getChassisMap,
  getUnitBump,
} from '@/lib/datacenterTextures'

/**
 * Mesh del asset GLB (ASSET-PIPELINE.md §7): carga con `useGLTF` (suspende
 * mientras descarga/parsea) y clona la escena para no mutar la caché de drei.
 *
 * Bridge §4: el GLB se exporta SIN emission (Principled BSDF puro); el runtime
 * asigna material emisivo a los meshes `leds_*` (y un glow sutil a `units`)
 * según los tokens del datacenter — el GLB nunca se re-exporta por color.
 * Bridge de texturas (puerta de malla): la puerta viaja como plano PBR-neutral
 * y el runtime le inyecta el patrón AR2580 procedural (alpha cutout + bump).
 */
export default function GlbMesh({ path }: { path: string }) {
  const invalidate = useThree((s) => s.invalidate)
  const { scene } = useGLTF(path)
  const clone = useMemo(() => {
    const c = scene.clone(true)
    applyRuntimeMaterials(c)
    return c
  }, [scene])
  // frameloop="demand" (SPEC §10): al resolver el suspense no se invalida solo;
  // sin este frame el GLB quedaría invisible hasta el próximo scroll (verificado
  // en runtime). Un invalidate por montaje basta.
  useEffect(() => {
    invalidate()
  }, [invalidate, path])
  return <primitive object={clone} />
}

/** Bridge ASSET-PIPELINE §4: emisivos de runtime sobre meshes canónicos. */
function applyRuntimeMaterials(root: THREE.Object3D) {
  root.traverse((o) => {
    if (!(o as THREE.Mesh).isMesh) return
    const mesh = o as THREE.Mesh
    const mat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material
    if (!(mat instanceof THREE.MeshStandardMaterial)) return
    const name = mesh.name.toLowerCase()
    const cc = clearcoatForMesh(name)
    if (name.startsWith('leds')) {
      // LCD del storage (ME5) → cyan de datos; LEDs de estado → azul boot
      mat.emissive = new THREE.Color(name === 'leds_lcd' ? '#22d3ee' : '#4DA3FF')
      mat.emissiveIntensity = name === 'leds_lcd' ? 0.6 : 0.8
    } else if (name === 'units') {
      mat.emissive = new THREE.Color('#4DA3FF')
      mat.emissiveIntensity = 0.32
      // Ranuras de ventilación de unidad (bump) — detalle que lee de cerca
      mat.bumpMap = getUnitBump()
      mat.bumpScale = 0.05
    } else if (name === 'chassis') {
      // Bridge de texturas (ASSET-PIPELINE §4): panel de chasis con juntas,
      // filas de ventilación y ruido industrial — la caja pasa a leerse como
      // hardware (los GLB siguen PBR-neutral, el detalle es 100% runtime).
      mat.map = getChassisMap()
      mat.bumpMap = getChassisBump()
      mat.bumpScale = 0.04
      mat.needsUpdate = true
    } else if (name === 'bezel_slats') {
      // Bezel plateado cepillado (storage AFF/ME5): rayas anisotrópicas
      mat.map = getBrushedMap()
      mat.bumpMap = getBrushedBump()
      mat.bumpScale = 0.06
      mat.needsUpdate = true
    } else if (name === 'screen') {
      // Pantalla SIEM (gap G4): emisivo blanco-frío + UI procedural local
      // (screenUiTexture — ASSET-SCENE-MAP §6, R5). El mapa oscuro del
      // dashboard se ilumina con el emisivo; cero texto en geometría (SPEC §23).
      mat.emissive = new THREE.Color('#e8f6ff')
      mat.emissiveIntensity = 0.85
      const ui = getSiemUiTexture()
      mat.map = ui
      mat.emissiveMap = ui
      mat.needsUpdate = true
    } else if (name === 'door') {
      // Bridge de texturas (ASSET-PIPELINE §4/§3.4): patrón de malla AR2580
      // procedural (canvas, R5 — cero texturas externas). alphaMap cutout +
      // bumpMap sutil; DoubleSide para la vista trasera de S5. El GLB sigue
      // siendo 100% PBR-neutral (sin textura embebida).
      const tex = getMeshDoorTexture()
      mat.alphaMap = tex
      mat.bumpMap = tex
      mat.bumpScale = 0.35
      mat.transparent = true
      mat.alphaTest = 0.5
      mat.side = THREE.DoubleSide
      mat.needsUpdate = true
     } else if (cc) {
      // Clearcoat sutil (audit G5, bridge §4): chasis/bezel → MeshPhysicalMaterial
      // con acabado industrial. El GLB sigue PBR-neutral (sin re-exportar).
      //
      // No usamos .copy(mat) porque MeshPhysicalMaterial.copy() llama internamente
      // this.clearcoatNormalScale.copy(source.clearcoatNormalScale) y varias
      // propiedades .copy() más que NO existen en MeshStandardMaterial (son solo
      // de MeshPhysicalMaterial) → source.xxx es undefined → .copy(undefined) lanza
      // "Cannot read properties of undefined (reading 'x')".
      // Copiamos manualmente las propiedades visuales que importan.
      const phys = new THREE.MeshPhysicalMaterial({
        color: mat.color,
        metalness: mat.metalness,
        roughness: mat.roughness,
        emissive: mat.emissive,
        emissiveIntensity: mat.emissiveIntensity,
        emissiveMap: mat.emissiveMap,
        map: mat.map,
        bumpMap: mat.bumpMap,
        bumpScale: mat.bumpScale,
        normalMap: mat.normalMap,
        alphaMap: mat.alphaMap,
        alphaTest: mat.alphaTest,
        transparent: mat.transparent,
        side: mat.side,
        depthWrite: mat.depthWrite,
        depthTest: mat.depthTest,
        toneMapped: mat.toneMapped,
        clearcoat: cc.clearcoat,
        clearcoatRoughness: cc.clearcoatRoughness,
      })
      if (Array.isArray(mesh.material)) mesh.material[0] = phys
      else mesh.material = phys
      phys.needsUpdate = true
    }
  })
}
