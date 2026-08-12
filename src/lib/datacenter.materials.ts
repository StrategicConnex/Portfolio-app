/**
 * Clearcoat sutil para GLBs hero (audit CREATIVE-AUDIT §5, gap G5 — bridge
 * ASSET-PIPELINE §4): el GLB sigue 100% PBR-neutral; el runtime eleva los
 * meshes de chasis/bezel a `MeshPhysicalMaterial` con clearcoat de acabado
 * industrial (metal cepillado premium, dirección iyO/NRG). Cero cambio de
 * albedo ni emisivos — solo el acabado de superficie.
 *
 * Regla: NUNCA clearcoat en meshes emisivos/alpha (`leds_*`, `screen`, `door`,
 * `units`) — cutout + clearcoat despilfarra el sombreador y ensucia el look.
 */

export type ClearcoatSpec = { clearcoat: number; clearcoatRoughness: number }

/** Meshes canónicos con acabado claro (valores conservadores: sutil, no plástico). */
export const CLEARCOAT_BY_MESH: Record<string, ClearcoatSpec> = {
  chassis: { clearcoat: 0.25, clearcoatRoughness: 0.35 },
  frame: { clearcoat: 0.3, clearcoatRoughness: 0.3 },
  bezel_slats: { clearcoat: 0.35, clearcoatRoughness: 0.25 },
}

/** Meshes que JAMÁS llevan clearcoat (emisivos/alpha del bridge §4). */
export const NO_CLEARCOAT_MESHES = ['leds', 'screen', 'door', 'units', 'fasteners', 'plinth', 'rear_controllers', 'back_panel'] as const

export function clearcoatForMesh(meshName: string): ClearcoatSpec | null {
  return CLEARCOAT_BY_MESH[meshName.toLowerCase()] ?? null
}
