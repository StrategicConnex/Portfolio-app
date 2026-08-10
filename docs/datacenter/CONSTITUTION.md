# CONSTITUTION — THE LIVING DATACENTER

**Status:** Active (referenced from `AGENTS.md`)
**Date:** 2026-08-10
**Scope:** cualquier trabajo sobre la experiencia 3D de `juanpalacios.vercel.app`.
**Companion doc:** [`SPEC.md`](./SPEC.md) (especificación técnica). **Consolidación de visualizaciones:** [`ADR-003`](../adr/ADR-003-visualization-consolidation-datacenter.md).

Esta constitución reemplaza al "super prompt V2/V3" como fuente de verdad de gobernanza. Tiene prioridad sobre cualquier decisión estética. Si una regla choca con una instrucción puntual de un agente, gana la constitución.

---

## 1. Prime Directive

**EL DOM ES LA FUENTE DE VERDAD. EL 3D ES UNA CAPA VISUAL.**

El contenido real siempre vive en HTML/DOM. El Canvas:

- NO define navegación, estructura, headings, enlaces, botones, formularios ni textos.
- NO es requisito para comprender el sitio.
- NO impide navegación con teclado ni screen readers.
- NO depende de recursos externos en runtime.

El 3D es una representación visual cinematográfica del contenido real.

## 2. Authority Levels

| Nivel | Naturaleza | Cambio requiere |
| --- | --- | --- |
| **L0 — Invariantes absolutos** | Nunca modificables | Solo decisión humana explícita |
| **L1 — Contratos arquitectónicos** | Revalidación formal (ADR + gate) | Nuevo ADR + aprobación |
| **L2 — Decisiones de implementación** | Optimizables libremente | Gate de fase |
| **L3 — Presentación** | Totalmente modificable | Ninguna |

## 3. Invariantes (L0)

**R1 — DOM first.** Las secciones existentes son contractuales. No eliminarlas, fusionarlas por comodidad del 3D, ni reemplazarlas por escenas Canvas. IDs reales verificados (2026-08-10): `#home`, `#perfil`, `#arquitectura`, `#experiencia`, `#confianza`, `#siem`, `#audit-hub`, `#scaudit`, `#blog`, `#stack`, `#certificaciones` (id añadido en este thread — no existía pese al JSON-LD), `#proyecto`, `#contacto` (+ Footer). Nota: `#home` (no `#hero`), `#proyecto` (singular), `#audit-hub` (con guion).

  **Hero (`#home`) protegido — directiva del propietario:** la foto de perfil y todo el bloque de texto (badge Sistema Activo, Protocolo, nombre, roles, tagline y CTAs) se conservan **siempre**. El 3D es su fondo; el re-layout del Hero está permitido (foto como tarjeta HUD, tipografía sobre el canvas, reposicionar CTAs), pero **eliminar o reemplazar ese contenido está prohibido**, igual que el de cualquier otra sección.

**R2 — Cinco escenas, inmutables.** La narrativa 3D se limita a: 01 Boot Sequence, 02 Core Architecture, 03 Data in Motion, 04 Resilience & Depth, 05 Connection Point. Las secciones alimentan las escenas (mapeo en `SPEC.md §5`); no crear una escena por sección.

**R3 — Sin scroll hijacking.** Nunca interceptar `wheel`, `preventDefault`, contenedores de scroll propios ni navegación tipo fullpage. Scroll nativo → `useScroll()` → `scrollYProgress` → `useSpring` → interpolación de escena. El usuario conserva wheel, trackpad, touch, teclado, PageUp/Down, Home/End, anclas e historial.

**R4 — AI Copilot es sagrado.** No modificar lógica, API, estado, hooks, providers, streaming, memoria, prompts, eventos ni z-index funcional. Solo styling visual (CSS/Tailwind) está permitido. Si el 3D puede afectar al Copilot, resolver el conflicto antes de implementar.

**R5 — Cero dependencias externas en runtime.** Nada de HDRI externos, CDN de texturas, GLB remotos, imágenes, fuentes, shaders ni entornos remotos. Assets en `/public` o generación procedural (Lightformer, luces Three.js, fog, partículas). Obligatorio por la CSP del repo.

**R6 — Progressive enhancement.** Niveles: 0 sin JS pesado → 1 DOM+CSS → 2 DOM+motion → 3 DOM+3D. El 3D es enhancement, nunca dependency.

**R7 — Accesibilidad y motion safety.** `prefers-reduced-motion: reduce` → sin animación de cámara, sin partículas continuas, sin transiciones cinematográficas → `StaticPoster` o escena congelada. Toggle manual "Reduce Motion" adicional.

**R8 — Seguridad y CSP.** Mantener la CSP estricta de `next.config.ts`. No agregar `unsafe-eval` como workaround. No agregar dominios externos para que funcione el 3D. Si una librería exige excepción: detener e implementar alternativa compatible.

**R9 — Un solo contexto WebGL activo.** Máx. 2 montados (datacenter + modal case study), nunca 2 renderizando. Ver `ADR-003`. No añadir canvas de alta frecuencia fuera del inventario aprobado.

## 4. Priority Order

Cuando haya conflicto entre objetivos: **1. Funcionalidad → 2. Accesibilidad → 3. Seguridad → 4. SEO → 5. Performance → 6. Responsive → 7. Mantenibilidad → 8. Fidelidad visual → 9. Efectos cinematográficos.** Nunca sacrificar los primeros por los últimos.

## 5. Change Control

| Clase | Ejemplos | Requisito |
| --- | --- | --- |
| **SAFE** | CSS, spacing, colores, cambios visuales no funcionales | Directo |
| **ARCHITECTURAL** | Nueva arquitectura de render, dependencia, flujo de datos, sistema de estado | Explicación + gate |
| **RISKY** | Copilot, CSP, i18n, navegación, next.config, código crítico de performance | Explicación + validación completa |

## 6. Self-check antes de cada cambio

¿Rompe DOM-first? ¿Rompe progressive enhancement? ¿Afecta SEO? ¿A11y? ¿i18n? ¿Copilot? ¿CSP? ¿Aumenta bundle? ¿Aumenta draw calls? ¿Aumenta GPU/CPU? ¿Funciona en mobile? ¿Tiene fallback? ¿Es reversible? ¿Existe una solución más simple? Si **cualquier** respuesta es negativa, reconsiderar.

## 7. Decision Engine

Toda decisión de impacto MEDIUM/HIGH requiere: 1) identificar el problema, 2) **mínimo 3 alternativas**, 3) evaluar performance, mantenibilidad, accesibilidad, seguridad, SEO, complejidad, impacto de bundle y mobile, 4) seleccionar y **justificar**, 5) implementar, 6) medir el resultado. Formato en `SPEC.md §37`.

## 8. Anti-Overengineering

- Si se resuelve con CSS antes que Framer Motion: CSS.
- Si se resuelve con Three.js antes que una dependencia nueva: Three.js.
- Si se resuelve con la arquitectura existente antes que una abstracción nueva: existente.
- Nunca crear una abstracción solo porque parece elegante. Cada dependencia, render y efecto debe justificar su existencia.

## 9. Code Health Contract

TypeScript estricto, sin `any` innecesario, sin código muerto, sin imports sin usar, sin lógica duplicada, sin dependencias circulares, sin componentes gigantes. Señales de revisión (no leyes): componente < 300 líneas, hook < 200, función < 50. El 3D debe aislarse con Error Boundary (`SPEC.md §26`).

## 10. Scorecard + Veto

Al final de cada fase, puntuar 0–10: Architecture, Performance, Accessibility, Security, SEO, Visual Quality, Maintainability, Mobile, i18n, Resilience. **Un promedio alto no compensa un fallo crítico:** cualquier dimensión < 5 (o Security/Accesibilidad < 7) bloquea la fase.

## 11. Self-critique Loop

Tras implementar: TEST → MEASURE → CRITIQUE → COMPARE contra la constitución → OPTIMIZE → RETEST. Preguntas: ¿complejidad innecesaria? ¿sacrifico performance por estética? ¿violo algún invariante? ¿existe solución más simple? ¿la experiencia realmente mejoró? ¿el usuario obtiene valor o solo efectos? ¿sigue siendo mantenible?

## 12. Stop Conditions

Detenerse de inmediato (y reportar PROBLEMA / CAUSA / IMPACTO / OPCIONES / RECOMENDACIÓN, sin workaround silencioso) ante: regresión de build, regresión del Copilot, violación de CSP, navegación rota, i18n roto, regresión de accesibilidad, crash en mobile, leak de memoria, degradación severa de FPS, request de red externa inesperada, o conflicto arquitectónico.

## 13. Design Philosophy

No es "una web con un Canvas 3D": es un **Digital Twin narrativo** del perfil profesional.

```
DOM = KNOWLEDGE · 3D = SYSTEM · scroll = FLOW · cámara = PERSPECTIVE
HUD = TELEMETRY · Copilot = INTELLIGENCE · navegación = CONTROL · contacto = CONNECTION
```

El objetivo: el visitante piensa *"No estoy navegando un portfolio. Estoy recorriendo el sistema que representa cómo este profesional piensa, diseña, opera y protege infraestructura crítica"*. Impresionar con precisión, performance, narrativa, arquitectura y contención — nunca con complejidad técnica gratuita.
