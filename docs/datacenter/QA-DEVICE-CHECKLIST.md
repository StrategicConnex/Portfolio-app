# QA de Performance en Dispositivo Real — Living Datacenter

**Propósito:** validar en hardware real (iPhone / Android mid-range / Android low-end) los números medidos localmente con Lighthouse (móvil emulado, 4G throttled). Los números locales son **sintéticos**: el throttle de CPU/red no reproduce GPU, batería ni thermal del dispositivo real. Este checklist es la única fuente de verdad para el gate de performance en mobile (SPEC §30, §31, §35).

**Baseline local de referencia** (auditoría 2026-08-10, reports en `docs/datacenter/reports/perf-audit/`):

| Métrica | Local (Lighthouse móvil, 4G throttled) |
| --- | --- |
| Performance score | 50 (aspiracional ≥90, SPEC §41) |
| LCP (normal) | 4.8–6.5 s — elemento: póster (capa base Z-10) |
| LCP (reduce-motion) | ~6.0 s (paint real ~0.7 s sin throttle) |
| FCP | 1.2–1.7 s |
| TBT | 1.2–1.6 s (rango ruidoso 1.15–2.44 s) |
| CLS | 0 |
| JS total | ~1.28 MB gz (chunk 3D `08k-*` = 231 KB gz / 873 KB raw) |
| Total página | ~2.3 MB (JS + 793 KB imágenes + 112 KB fonts) |

En dispositivo real con 4G y hardware decente se espera **mejor** que el baseline throttled. El gate duro es "**sin regresión vs baseline local**" (SPEC §31); los objetivos de dispositivo son aspiracionales.

---

## 1. Precondiciones (antes de medir)

- [ ] Build de **producción** (nunca dev server): `npm run build && npm start` local en LAN, **o** preview de Vercel con el branch `feat/living-datacenter`. Dev server no es representativo (sin compresión, JS en modo dev).
- [ ] Teléfono y PC en la misma red Wi-Fi; verificar que la página carga (HTTP 200).
- [ ] Brillo fijo al 50%, modo avión **apagado** (se mide con red real), sin otras apps en primer plano, sin cargador conectado durante la prueba de batería.
- [ ] Batería ≥ 80% al empezar.
- [ ] Preferencia del SO: `prefers-reduced-motion` **off** para la prueba normal; se activa solo en el test §6.
- [ ] Navegador limpio (pestañas cerradas, sin extensiones).
- [ ] Anotar **modelo exacto + versión de SO + navegador** (ver matriz §9).

## 2. Instrumentación por plataforma

| Plataforma | Herramienta | Cómo se conecta |
| --- | --- | --- |
| **Android + Chrome** (recomendado) | Chrome DevTools remoto (`chrome://inspect`) | USB + depuración USB activada; paneles Performance, Network, Rendering (FPS meter) y Console |
| **iOS + Safari** | Web Inspector de Safari (macOS) | Cable + Mac: menú *Desarrollar* → *Inspeccionar* (timeline con FPS meter, Network, Energy Impact) |
| **Sin PC (cualquier teléfono)** | Observación directa + batería del SO | Ajustes → Batería; fluidez del scroll a ojo; LCP no medible sin consola |

> Nota: iOS sin Mac no permite consola/network → medir solo batería y comportamiento visual. Android sin PC: batería vía Ajustes. El `DatacenterDebugPanel` del SPEC §28 no está implementado; si se necesita FPS/draw calls en producción de forma portable, implementarlo como overlay gated por query string (`?dc-debug=1`) y eliminarlo antes de release.

## 3. FPS del canvas (objetivo SPEC §10: 60 desktop / 45+ mobile, piso 30)

- [ ] **Scroll continuo** a velocidad normal por las 5 escenas (`#home → #perfil → #arquitectura → #experiencia → #proyecto → #siem → #audit-hub → #scaudit → #blog → #stack → #certificaciones → #proyecto → #contacto`).
- [ ] FPS meter (DevTools Rendering tab / Safari Timeline): registrar **min / media / max** durante el scroll.
- [ ] **Transiciones de escena** (cambio de waypoint de cámara): ningún drop sostenido < 30.
- [ ] **Idle** (sin scroll, 10 s): el canvas es `frameloop="demand"` → **0 frames** (GPU idle). Si el FPS meter muestra actividad continua en reposo, es una regresión del §10.
- [ ] **Scrolling rápido** (flick): sin jank visual del DOM (el contenido Z-40 nunca debe degradarse por el 3D).
- [ ] Repetir en cada dispositivo de la matriz (§9).

**Criterio PASS:** media ≥ 45 en mid-range, ≥ 30 como piso absoluto, 0 frames en idle, DOM fluido siempre.

## 4. TBT / JS (objetivo: sin regresión vs local 1.2–1.6 s)

- [ ] DevTools Performance: grabar la carga completa + 5 s posteriores de scroll.
- [ ] Contar **Long Tasks** (> 50 ms) y su duración total = TBT real. Sumar solo tasks antes de "First Input".
- [ ] Verificar qué tarea larga domina: la hipótesis es **evaluación de JS** (~1.3 MB de chunks, ver §5). El bundle 3D se ejecuta vía `<script async>` incluso en reduce-motion (comportamiento Next 16 documentado en SPEC §31b) — si el Long Task dominante es el chunk `08k-*` en reduce-motion, es el costo conocido, no una regresión.
- [ ] Interacción: tocar el toggle de idioma ES/EN y abrir el Copilot durante la carga — medir el delay perceptible.

**Criterio PASS:** TBT mid-range ≤ ~1.2 s (≈ local), flagship ≤ 0.6 s; sin Long Task > 500 ms.

## 5. Descargas del bundle 3D y red (SPEC §18, §43)

- [ ] Network panel → filtrar `_next/static/chunks/`: confirmar que en **modo normal** se descarga el chunk 3D (`08k-*`, ~231 KB gz) y que en **reduce-motion** también (comportamiento esperado por el preload del framework — verificar que ocurre igual en dispositivo).
- [ ] Sumar JS total ≈ 1.28 MB gz (no más de ~1.5× por red real).
- [ ] **Auditoría de red** (SPEC §18): sin HDR, texturas, GLB, fuentes o CDN externos. Solo deben aparecer: `/_next/*` (same-origin), `/images/*`, `/api/*` (legítimos: `ask-ai`, `contact`), `scaudit.vercel.app` (RUM), `posthog.com` (analytics, si está activo). Cualquier otro dominio = **hallazgo**.
- [ ] Fuentes: solo `/_next/static/media/*.woff2` (self-hosted).
- [ ] En **reduce-motion**: confirmar póster servido (`/images/cold-cathedral-poster.webp`, 42 KB) y el `<link rel="preload">` con `fetchpriority=high` presente en el `<head>`.

**Criterio PASS:** sin dominios inesperados; tamaños dentro de ±50% del baseline; póster + preload correctos en reduce-motion.

## 6. Reduce-motion, tiers y fallback en dispositivo (SPEC §8, §9, §25)

- [ ] **OS reduce-motion ON**: la página debe mostrar el **póster** (capa Z-10) y **no** debe montar el canvas. Verificar en consola (si hay): `document.querySelector('[data-testid="datacenter-canvas"]') === null` y `!!document.querySelector('img[data-poster-img]')`.
- [ ] **Toggle manual** (botón ◌/◎ abajo-izquierda): ON → póster + canvas desmontado; OFF → canvas 3D vuelve a montar. El cambio debe persistir (localStorage) tras recargar.
- [ ] **Tier esperado por dispositivo**: low-end Android → `LOW`/`STATIC` (póster); mid-range → `MEDIUM`/`HIGH` (DPR ≤ 1.25–1.5); flagship → `ULTRA`/`HIGH` (DPR 1.5–2). Verificar por comportamiento (canvas presente) o consola si se expone el tier.
- [ ] **Context lost / fallback**: forzar en dev (o simular `webglcontextlost`) → póster sin excepción; la página sigue navegable.

**Criterio PASS:** reduce-motion → póster sin canvas, sin animación continua; toggle funciona y persiste; fallback sin romper DOM.

## 7. Batería (protocolo de 3 fases, mismo brillo fijo)

| Fase | Duración | Acción | Métrica |
| --- | --- | --- | --- |
| A · Referencia | 5 min | Página en blanco (`about:blank`) | drain % |
| B · Idle en la página | 5 min | Cargar el sitio y no tocar nada | drain % |
| C · Scroll continuo | 3 min | Scrollear por las 5 escenas | drain % |

- Android: `adb shell dumpsys battery` (o Ajustes → Batería → uso por app) antes/después de cada fase.
- iOS: Ajustes → Batería → uso por app (Safari); o Energy Impact de Web Inspector (Mac).

**Criterio PASS:** Fase B ≈ Fase A (delta < 0.5 %/5 min — `frameloop="demand"` = GPU idle en reposo). Fase C moderada (no más de ~2× el drain de idle por minuto). Si B >> A: buscar actividad continua (invalidación sin necesidad, §10).

## 8. Scripts de consola listos para pegar (DevTools remoto)

```js
// LCP + CLS + Long Tasks (TBT aprox.) — pegar en la consola tras cargar
new PerformanceObserver((l) => { for (const e of l.getEntries()) console.log('LCP:', Math.round(e.startTime), 'ms', (e.url || '').split('/').pop()); })
  .observe({ type: 'largest-contentful-paint', buffered: true });
let cls = 0;
new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) cls += e.value; console.log('CLS acumulado:', cls.toFixed(3)); })
  .observe({ type: 'layout-shift', buffered: true });
let longTasks = 0, tbt = 0;
new PerformanceObserver((l) => { for (const e of l.getEntries()) { longTasks++; tbt += e.duration - 50; console.log('Long Task:', Math.round(e.duration), 'ms'); } console.log('Long tasks:', longTasks, '| TBT aprox:', Math.round(tbt), 'ms'); })
  .observe({ type: 'longtask', buffered: true });

// Estado del datacenter
document.querySelector('[data-testid="datacenter-canvas"]') ? 'canvas 3D: MONTADO' : 'canvas 3D: AUSENTE';
document.querySelector('img[data-poster-img]') ? 'póster Z-10: presente' : 'póster: ausente';
[...document.querySelectorAll('link[rel="preload"]')].filter(l => (l.getAttribute('href')||'').includes('poster'))
  .map(l => 'preload póster: ' + l.getAttribute('as') + ' fp=' + l.getAttribute('fetchpriority'));
```

## 9. Matriz de dispositivos (mínimo obligatorio, SPEC §30)

| Dispositivo | SO | Navegador | FPS media | TBT | LCP | Drain idle | Chunk 3D | Reduce-motion | Tier observado | PASS/FAIL |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| iPhone (mid, p. ej. 12/13) | iOS 17+ | Safari | | | | | | | | |
| Android mid-range | 12+ | Chrome | | | | | | | | |
| Android low-end | 10+ | Chrome | | | | | | | | |

Prioridad crítica (SPEC §30): iPhone, Android mid-range, Android low-end. Opcional: Chrome Android reciente (flagship) como control.

## 10. Criterios de aceptación (gate, SPEC §35)

El QA de dispositivo pasa solo si **todos** los siguientes se cumplen en los 3 dispositivos:

- [ ] **FPS:** media ≥ 45 (mid-range) / piso ≥ 30; **0 frames en idle** (frameloop demand).
- [ ] **TBT:** sin regresión vs local (≤ ~1.2 s mid-range) y sin Long Task > 500 ms.
- [ ] **Red:** sin dominios externos inesperados; bundle 3D y totales ≈ baseline (±50 %).
- [ ] **Batería:** drain idle ≈ página en blanco (delta < 0.5 %/5 min).
- [ ] **Reduce-motion:** póster sin canvas; toggle manual funciona y persiste.
- [ ] **Fallback:** context lost / tier LOW → póster, sin romper DOM.
- [ ] **CWV en campo:** LCP < 4.0 s en 4G real (objetivo; el baseline throttled local es 4.8–6.5 s) y CLS = 0.

**Si algo falla:** STOP y reportar según CONSTITUTION §12 (PROBLEM / CAUSE / IMPACT / OPTIONS / RECOMMENDATION) — nunca aplicar un workaround silencioso. Un fallo de FPS en idle o un dominio externo inesperado son hallazgos críticos.

## 11. Plantilla de reporte (archivar como `docs/datacenter/reports/report-device-qa.md`)

```md
# Report — Device QA
Fecha · Dispositivos (modelo/SO/navegador) · Build (hash/commit) · URL

## Resultados por dispositivo (matriz §9)
## FPS (min/media/max por escena, idle)
## TBT / Long Tasks
## Red (chunks, totales, dominios)
## Batería (A/B/C)
## Reduce-motion / tiers / fallback
## CWV (LCP, CLS)
## GATE: PASS / FAIL
## Hallazgos y recomendaciones (CONSTITUTION §12)
```
