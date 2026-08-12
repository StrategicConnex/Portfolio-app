# Report — G2: Event bus DOM→3D de nodo focal (sección activa → baliza 3D)

**Fecha:** 2026-08-11 · **GATE: ✅ PASS** · **Origen:** CREATIVE-AUDIT §5 (gap G2, lección Noomo/Mastercard) · **Clase:** ARCHITECTURAL (nuevo data flow DOM→3D), aprobado por el brief del audit

## IMPLEMENTED

- **Event bus `focusNode`** (`src/lib/focusNode.ts`): store de módulo con `publishFocusSection(id)` + `useFocusSection()` — el DOM publica la sección activa, el 3D **observa** (mismo patrón que `copilotVisual`/`activeScene`; idempotente, notifica solo al cambiar).
- **Mapa data-driven `FOCUS_NODES`** (`src/lib/datacenter.focus.ts`): 13 secciones → ancla 3D REAL (racks del corredor, PurdueHologram, storage S4, nodo central), escena, color del token system y label i18n `dc.focus.*`. Cero `if section === …` dispersos (SPEC §20).
- **`FocusNodeLayer` 3D** (montado en `DatacenterScene`): baliza core + halo + ring (patrón `CopilotNode`) que aparece con fade-in al cambiar de sección — sin viajes de cámara (restraint, SPEC §3); pulso invalidado por `MicroAnimDriver`; con reduced-motion queda estática (defensivo).
- **Emisor en `DatacenterCamera`** (3 líneas junto a `setActiveScene`): publica `ALL_SECTIONS[active]` — sin tocar lógica de secciones (ya calculada por `useSectionProgress`) ni del Copilot (R4).

## FILES CREATED

- `src/lib/focusNode.ts` + `src/lib/focusNode.test.ts`
- `src/lib/datacenter.focus.ts` + `src/lib/datacenter.focus.test.ts`
- `src/components/datacenter/FocusNodeLayer.tsx` + `FocusNodeLayer.test.tsx`

## FILES MODIFIED

- `src/components/datacenter/DatacenterCamera.tsx` (publisher idempotente en useFrame)
- `src/components/datacenter/DatacenterScene.tsx` (monta `<FocusNodeLayer />`)
- `src/context/translations/datacenter.ts` (claves `dc.focus.*` es/en, paridad)

## DEPENDENCIES

- **Ninguna nueva** (patrón existente: `useSyncExternalStore` + R3F + tokens).

## ARCHITECTURAL IMPACT

**LOW-MEDIUM** — data flow nuevo pero aditivo y reversible: el emisor es un observador read-only de un hook existente; el consumidor es un layer aislado (fallback seguro: sección sin mapeo → no renderiza nada). No toca secciones, cámara, escenas ni Copilot.

## PERFORMANCE

| Métrica | Delta |
| --- | --- |
| Draw calls | +3 (core + halo + ring de la baliza) — dentro del presupuesto < 50 (§21); se renderiza UNA baliza, no 13 |
| Frames | Sin coste extra: pulso montado sobre la invalidación de `MicroAnimDriver` (GPU idle en reposo) |
| Re-renders | Solo al cruzar de sección (store idempotente + `useSyncExternalStore`) |
| Bundle | +0 dependencias; ~1.5 KB gz estimados de módulos propios |

## ACCESSIBILITY

- Canvas decorativo intacto (`aria-hidden`, `pointer-events:none`) — la baliza es visual, no anunciada.
- reduced-motion → baliza estática (sin pulso ni fade progresivo).
- El label es clave i18n (nunca texto en geometría).

## SECURITY / CSP

Sin cambios — cero requests nuevos, cero dominios externos (R5).

## I18N

13 claves `dc.focus.*` en es/en con paridad verificada (test `datacenter.test.ts`).

## COPILOT

**UNCHANGED** — el bus es independiente; el Copilot conserva lógica, API y streaming intactos (R4). El nodo central S5 (`CopilotNode`) y la baliza de `contacto` conviven en la misma zona sin tocarse.

## TESTS

- `focusNode.test.ts` (4): notifica solo en cambio, unsubscribe, null/reset.
- `datacenter.focus.test.ts` (5): cobertura total de `ALL_SECTIONS`, escena consistente, labels i18n, colores del token system, sección desconocida → null.
- `FocusNodeLayer.test.tsx` (4): sin sección → nada; baliza 3 meshes + label; reacción al cambio; sección sin mapeo → fallback seguro.
- Suite completa datacenter: **37 passed (8 files)** · typecheck 0 errores · lint 0.

## GATE

**PASS** — el recorrido visual (baliza siguiendo la sección activa) queda para validación en navegador real; la lógica, el data flow y los fallbacks están cubiertos por tests.

## NEXT

- G1 (fase `PHASE 0n/05` en HudLabel) · G3 (datos encarnados) · G4 (pools switch/display + fit S4) — orden de CREATIVE-AUDIT §7.
