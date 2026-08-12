# Report — G6: Tratamiento editorial del DOM (tamaños display, tracking, teletipo)

**Fecha:** 2026-08-11 · **GATE: ✅ PASS** · **Origen:** CREATIVE-AUDIT §5 (gap G6, lección Noomo: el DOM conversa con el 3D) · **Clase:** SAFE (CSS/Tailwind)

## IMPLEMENTED

- **`SectionHeader`** (el header común de las 13 secciones — impacto máximo en 1 punto):
  - Eyebrow → **mono teletipo** (`font-mono`, 0.68rem, `tracking-[0.3em]`, opacity 80%) — voz de sistema JetBrains Mono (SPEC §4).
  - Título → display mayor `clamp(1.75rem, 3.6vw, 2.6rem)` + `tracking-tight` + `line-height 1.12` (Space Grotesk editorial).
- **`Hero`**: el pill de estado ("Sistema Activo · Protocolo IT/OT…") gana `font-mono` — teletipo sin tocar ni foto ni texto (constraint del usuario respetada).
- Sin animaciones nuevas (anti-patrón "typewriter" descartado: sería decoración sin propósito); reduced-motion no afectado.

## FILES MODIFIED

- `src/components/ui/SectionHeader.tsx`
- `src/components/Hero.tsx` (una clase)

## ARCHITECTURAL IMPACT / PERFORMANCE / A11Y / CSP / I18N / COPILOT

**LOW** · cero JS nuevo (CSS puro) · contraste intacto (colores de token) · sin requests · Copilot **UNCHANGED** · las 13 secciones y su contenido **intactos** (solo tratamiento).

## TESTS / GATE

Cambios CSS/className: typecheck 0 · suite 45/45 · lint 0 → **PASS** (verificación visual en navegador real como siguiente paso).
