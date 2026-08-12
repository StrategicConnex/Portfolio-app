# FIX — AI COPILOT: el launcher no abría el panel (regresión Fase 7)

**Fecha:** 2026-08-12 · **Clasificación:** SAFE (solo styling — RULE 04 respetada, cero cambios de lógica/API/estado/streaming)

## PROBLEMA (STOP §64)
El usuario reportó: "el AI Copilot no funciona, cuando hago click no abre el copilot".

## DIAGNÓSTICO (2 causas raíz, ambas del shell visual Fase 7 / clases Tailwind)

### C1 — Spans decorativos del launcher interceptaban el click
`AskAILauncher.tsx`: los spans del "AI Node Console" (`absolute inset-0` + `absolute -inset-1.5`,
aria-hidden decorativos) se pintaban **por encima** del `Button` (elementos posicionados pintan
después que el estático) y tenían `pointer-events: auto`. `document.elementFromPoint(centro)`
devolvía el span → el click nunca llegaba al botón.
**Evidencia:** `topIsButton: false`, click real sobre el span → panel no abre.

### C2 — Panel con `fixed ... relative` simultáneos → `relative` ganaba
`AskAIPanel.tsx`: el `className` del panel tenía `fixed bottom-4 right-4 ... flex flex-col relative ...`.
En el CSS generado de Tailwind v4 `.relative` se emite después de `.fixed` → el panel se
renderizaba `position: relative`, **en flujo normal al fondo de la página** (x=-24, y=22636),
invisible aunque `isOpen=true`.
**Evidencia:** computed `position: relative` con rect off-viewport; tras el fix, `fixed` con
rect exacto del bottom-right (420×640 en 1440×900: x=996=1440−24−420, y=236=900−24−640).

## FIX
1. `pointer-events-none` en los 2 spans decorativos del launcher.
2. Quitar `relative` del `className` del panel (el `fixed` ya provee containing block para la
   línea de acento `absolute` interna).

## VALIDACIÓN (navegador real, Playwright)
- Launcher visible → click → **panel abre `position: fixed`, z-50, en viewport**.
- Botón "Cerrar panel" → **panel cierra y el launcher vuelve**.
- Consola: 0 errores 3D/React (solo el CORS de telemetry preexistente).
- Gate: typecheck 0 · tests ask-ai 15/15 · tests datacenter 36/36 · lint 0 · build OK.
- Copilot: **UNCHANGED en lógica** — solo clases de styling (RULE 04).

## GATE: PASS ✅
