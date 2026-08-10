# Reporte de Auditoría de Runtime — THE LIVING DATACENTER

**Fecha:** 2026-08-10 · **Ámbito:** consola (React/WebGL/red), z-order, ciclo de vida de contextos WebGL, interacciones críticas.
**Método:** preview del dev server (localhost:55868) + `preview_logs`/`preview_evaluate`/`preview_click` + `npm run typecheck`/`npm test`/lint.

## Hallazgos

### 1. FIX en este audit: poster atascado por `contextLost` sticky
- **Síntoma:** tras activar/desactivar el toggle reduce-motion, el canvas WebGL no volvía a montarse (poster mostrado con `reduced=false`).
- **Causa:** al desmontar el canvas, three dispara `webglcontextlost` (log `THREE.WebGLRenderer: Context Lost.`) → `reportContextLost()` → `contextLost=true` a nivel de módulo → nunca se reseteaba (el evento `webglcontextrestored` no llega porque el contexto ya no existe).
- **Fix (`useWebGLContextManager.ts`):** `registerContext()` resetea `contextLost=false` (un contexto nuevo es estado limpio) y el unregister también lo resetea al llegar a 0 contextos.
- **Verificado en runtime:** ciclo completo ON→poster→OFF→canvas (WebGL remontado, 2 canvases) sin atascos.

### 2. Hallazgo pre-existente corregido: `#certificaciones` sin id
- El `<section>` de Certificaciones no tenía `id="certificaciones"` aunque el JSON-LD del layout lo referencia (breadcrumb). Añadido `id="certificaciones"` (1 línea, cambio seguro). Docs actualizados (`discovery.md`, `CONSTITUTION.md`).

### 3. Pre-existente, NO de este thread: CORS de SCAudit RUM en localhost
- `https://scaudit.vercel.app/api/telemetry/vitals` bloqueado por CORS en dev local (origin `http://localhost:55868`). Es el script RUM del layout (integración existente); solo ocurre en localhost, no en producción. **No es regresión.**

### 4. Informativo: log `THREE.WebGLRenderer: Context Lost.`
- three.js lo emite al desmontar el renderer. No es un error; el app ya lo maneja (el flag no queda atascado). No se suprime (evitar parchear three).

## Matriz de verificación (runtime)

| Interacción | Resultado |
| --- | --- |
| Scroll completo (13 secciones, 10 pasos) | ✅ sin errores React/WebGL |
| Anclas (`#perfil` etc.) | ✅ scrollIntoView OK |
| Toggle reduce-motion ON | ✅ poster reemplaza canvas (WebGL desmontado) |
| Toggle reduce-motion OFF | ✅ canvas remonta con WebGL (fix §1) |
| Modal case study abrir/cerrar | ✅ contextos WebGL 1 → 2 → 1 (ADR-003) |
| Copilot abrir panel | ✅ panel z-50, sin errores |
| Z-order | ✅ canvas z-20, Copilot z-50, main z-40 |
| Red | ✅ sin requests externas nuevas (solo las legítimas + CORS SCAudit en dev) |
| Consola | ✅ sin errores React/WebGL (solo SCAudit CORS + log three) |

## Gates

```text
npm run typecheck  → exit 0
npm test           → 27 files / 249 tests passed
npx eslint (hooks/context manager) → exit 0
```

## Veredicto

**Sin regresiones de este thread.** Los errores que reportaste ("Maximum update depth") fueron corregidos en el turno anterior (identidades estables) y este audit confirmó en runtime que el ciclo completo funciona. Queda un bug de UX menor documentado para Fase 7: el flag `suspended` del context manager aún no se cablea al modal case study (el datacenter sigue renderizando detrás mientras el modal está abierto — 2 contextos activos, dentro de lo permitido por ADR-003 pero sin pausa GPU). **Escalamiento: ninguno requerido.**
