# ADR-001: Production Hardening — Security, Testing, Performance

**Status:** Accepted
**Date:** 2026-08-04
**Branch:** `remediation/portfolio-production-hardening`

---

## Context

El portfolio (Next.js App Router + React 19) requería una auditoría completa de
hardening de producción: seguridad, testing, performance, UX/design. El audit de
dependencias (`npm audit`) reportaba 6 vulnerabilidades (5 high) en la cadena de
Next.js 16.2.9, y el CSP incluía `unpkg.com` contradiciendo el plan interno RUM.

## Problem

1. **Vulnerabilidades de producción**: Next.js 16.2.9 con SSRF en Server Actions,
   bypass de middleware, DoS, cache confusion y disclosure de endpoints.
2. **CSP inconsistente**: `unpkg.com` en `script-src`/`connect-src` pese a que
   `STRATEGICAUDIT_RUM_IMPLEMENTATION_PLAN.md` lo prohíbe explícitamente.
3. **Rate limiting spoofeable**: `/api/chat` reenviaba headers de IP del cliente
   y `getClientId` usaba la primera IP de `x-forwarded-for` (spoofeable).
4. **Ruido en tests**: warnings de React por props de `framer-motion` y
   `next/image` filtradas incorrectamente en mocks.
5. **Imágenes sobrepesadas**: `quality={100}` en imágenes mostradas a ≤360px.

## Decision

### Seguridad (P0)
- **Upgrade Next.js 16.2.9 → 16.3.0** (+ `eslint-config-next@16.3.0`): mitiga las
  5 vulns high de la cadena Next.
- **CSP**: eliminar `https://unpkg.com` de `script-src` y `connect-src`
  (el script RUM debe auto-contenerse, ver plan RUM-05).
- **`/api/chat`**: propagar al endpoint primario el `x-forwarded-for`/`x-real-ip`
  **exactamente como los entregó el edge** (nunca construidos a partir de input del
  cliente), para que el rate limit del fallback no colapse en el bucket global
  `internal` (remediación H2 de la auditoría de seguridad).
- **`getClientId`**: usar la **última** IP de `x-forwarded-for` (la añadida por la
  plataforma), no la primera (spoofeable por el cliente).

> **Supersession (Agosto 2026):** la cláusula original "dejar de reenviar headers
> de IP" fue motivada por `getClientId` leyendo la PRIMERA IP (spoofeable). Con
> la decisión de esta misma sección (última IP), reenviar verbatim el header del
> edge no reintroduce el vector: la última entrada sigue siendo la del edge, y en
> un despliegue sin edge el fallback expone la misma superficie que llamar a
> `/api/ask-ai` directamente (el vector no es nuevo). Se reabre la cláusula por
> fricción real: sin propagación, todos los requests del fallback comparten el
> bucket `internal` y un solo cliente puede agotar la cuota de todos.

### Dependencias (P0)
Intención original (Agosto 2026): overrides npm para resolver el audit completo a **0 vulnerabilidades**. Hoy esa meta **no se cumple** — ver la nota de estado al final de esta sección.

**Tabla vigente (Octubre 2026)** — la columna “¿cierra el advisory?” compara el
override contra el **rango afectado real** reportado por `npm audit` en la
rama `19d3e86`:

| Paquete | Rango afectado (actual) | Override vigente | ¿Cierra? | Racional |
| --- | --- | --- | --- | --- |
| `fast-uri` | — (fuera de rango) | `3.1.8` | ✅ | transitiva, parche same-major |
| `dompurify` | — (fuera de rango) | `3.4.16` | ✅ | transitiva, parche same-major |
| `js-yaml` | — (fuera de rango) | `4.3.2` | ✅ | transitiva de `shadcn` (dev) |
| `postcss` | — (fuera de rango) | `8.5.28` | ✅ | transitiva de `@tailwindcss/postcss` — **pero** arrastra `postcss-selector-parser@7.1.4` (`<7.1.6`, moderate), que este override no cubre |
| `@hono/node-server` | — (no vulnerable en sí) | `2.1.1` | ✅ | requerido por SDK MCP |
| `baseline-browser-mapping` | — (fuera de rango) | `2.11.0` | ✅ | transitiva de `browserslist` |
| `browserslist` | — (fuera de rango) | `4.28.7` | ✅ | transitiva dev |
| `qs` | — (fuera de rango) | `6.16.0` | ✅ | transitiva dev |
| `fflate@>=0.6.0 <0.6.11` | `<0.6.11` | `0.6.11` | ✅ | override *scoped por rango* |
| `undici` | `7.0.0 – 7.29.0` | `7.29.0` | ❌ **dentro del rango** | transitiva de `jsdom`/`shadcn` (dev) |
| `ip-address` | `≤10.7.0` | `10.4.0` | ❌ **dentro del rango** | transitiva de `express-rate-limit` (dev) |
| `hono` | `4.12.4 – 4.13.10` | `4.13.8` | ❌ **dentro del rango** | transitiva de `@modelcontextprotocol/sdk` (dev) |
| `@modelcontextprotocol/sdk` | `≤1.31.0` (GHSA-6qxp-vccf-f47h) | `1.30.1` | ❌ **dentro del rango** | fix upstream de `@hono/node-server` |
| `mermaid` | `10.9.0-rc.1 – 12.1.0` (low) | `11.16.1` | ❌ **dentro del rango** | transitiva de `streamdown` |
| `brace-expansion` | `≤1.1.20 \|\| 4.0.0 – 5.0.11` (high) | **sin override** | ❌ **regresión** | el override *scoped* se eliminó |

> **Nota**: `eslint-plugin-import → minimatch` requiere override **scoped por
> versión** (`minimatch@3.1.5`) para no afectar a `minimatch@10.2.5` (hoisted por
> ESLint), que necesita la API de `brace-expansion` 2.x/5.x.

> ⚠️ **Estado real (Octubre 2026):** el audit **no está en cero** —
> `npm audit --audit-level=moderate` reporta **37 avisos (1 critical, 15 high,
> 13 moderate, 8 low)** y sale con código 1, lo que deja el job `validate` de
> GitHub Actions en **rojo** y los jobs `lighthouse`, `e2e` y `deploy` en
> **skipped**: hoy **no se puede desplegar a producción**. Cinco overrides
> (`undici`, `ip-address`, `hono`, `@modelcontextprotocol/sdk`, `mermaid`) fijan
> versiones **dentro** del rango afectado y no aportan nada, y el override
> *scoped* de `brace-expansion` ya no existe (el advisory **high** volvió).
> La tabla de arriba es la que hay que re-auditar contra
> `npm audit --audit-level=moderate` en cada actualización de dependencias.

### Testing (P1)
- Nuevo helper compartido `src/test-utils/framer-motion.tsx`:
  - `createMotionMock` / `COMMON_MOTION_TAGS` / `stripMotionProps` — elimina
    warnings de props de animación en DOM mocks.
  - `createImageMock` / `IMAGE_SKIP_PROPS` — filtra `fill`/`priority`/`quality`
    para `next/image` en tests.
  - Factory **async** con `import()` dinámico dentro de `vi.mock` (resuelve el
    hoisting de Vitest).
- Migrados 8 tests: Hero, Stack, Blog, Experiencia, Contacto, Navbar, SCAudit,
  Certificaciones. La aserción de Navbar usa ahora el `<nav>` real en vez de
  `data-mock`.

### Performance (P2)
- `quality={100}` → `75` en `Hero.tsx` (imagen LCP) y `Perfil.tsx` — dentro del
  allowlist `qualities: [100, 75]` ya configurado. Reduce ~30–40% del peso de la
  imagen LCP sin pérdida visible a ≤360px.
- La página permanece **dinámica** de forma deliberada: `cookies()`/`headers()`
  en el layout alimentan i18n SSR para evitar FOUC en usuarios en inglés.
  Convertirla a estática degradaría el first paint correcto.

## Alternatives

- **Override global de `brace-expansion`**: descartado — rompe `minimatch@10`
  (ESLint) que espera la API 5.x; verificado con `npm run lint` en rojo.
- **Eliminar overrides dev-only**: descartado en favor de la cadena completa
  parcheada; se mantuvo la corrección con overrides same-major y scoped.
- **Hacer la página estática**: descartado por el trade-off de FOUC de idioma.

## Consequences

- **Positivas**: rate limiting resistente a spoofing de IP; suite de tests amplia
  y en verde; LCP más ligero; CSP alineada con el plan RUM; cap de `memoryContext`
  y cola 429 con backoff que mantienen el copilot dentro del `maxDuration`.
- **Negativas**: los overrides de npm deben mantenerse documentados **y
  re-auditados** — un override que fija una versión dentro del rango afectado
  es peor que no tener override, porque aparenta estar resuelto. El override de
  `brace-expansion` es scoped por versión y requiere cuidado al actualizar
  `eslint-plugin-import`.
- **Pendiente (P0)**: el audit no está en cero. La afirmación original de este
  ADR ("0 vulnerabilidades") **ya no es cierta**; ver la nota de estado en
  "Dependencias" y la sección "Deuda abierta" al final.

## Risks

- **Riesgo residual**: `undici@7.29.0` es parche de la línea 7.x (la 8.x es un
  salto mayor); si jsdom migra a undici 8.x, revisar si el override sigue
  necesario.
- Los overrides pinzan versiones transitivas; al actualizar `shadcn`/`jsdom`
  re-ejecutar `npm audit && npm run lint`.

## Migration / Rollback

- **Rollback**: revertir `package.json` (deps + overrides) y `next.config.ts`
  con `git revert`; re-instalar con `npm install`.
- El CSP y los overrides son deploy-time, sin migración de datos.

## Validation

```text
npm audit            → 37 vulnerabilities (8 low, 13 moderate, 15 high, 1 critical)  ← EXIT 1
npm run lint         → exit 0 (3 warnings)
npm run typecheck    → exit 0
npm run test         → 539 passed (50 files)
npm run build        → OK, 17 routes
npx playwright test  → 38 tests declarados (9 specs)
```

> **Estado actualizado (Octubre 2026):** la suite creció con los seams de
> arquitectura cerrados posteriormente (RAG unificado, corpus proyectado,
> rate-limit, prompt builder, model pool, memoria client-side, idioma, tema,
> stats/panel y biblioteca). Hoy: `npm test` → **539 passed (50 files)**,
> `npx playwright test --list` → **38 tests (9 specs)** contra el build de
> producción (`E2E_PROD_SERVER=1`).
> Los overrides de npm, la CSP y el contrato `getClientId` (última IP de XFF)
> siguen vigentes según lo decidido en este ADR. La cláusula de `/api/chat`
> evolucionó con la remediación H2 (ver supersession arriba).
>
> ⚠️ La línea de `npm audit` **cambió**: este ADR se escribió cuando el audit
> estaba en cero. Hoy el comando sale con **código 1**, lo que rompe el job
> `validate` de CI y bloquea `lighthouse` / `e2e` / `deploy`.

### Deuda abierta (Octubre 2026)

| Ítem | Estado |
|---|---|
| `npm audit --audit-level=moderate` en verde | ❌ Exit 1 — 37 avisos (1 critical, 15 high, 13 moderate, 8 low) |
| Overrides que fijan versiones dentro del rango afectado | ❌ 5 (`undici`, `ip-address`, `hono`, `@modelcontextprotocol/sdk`, `mermaid`) |
| Override *scoped* de `brace-expansion` | ❌ eliminado — el advisory high volvió |
| `next@16.3.6` dentro del rango `16.0.0–16.3.7` | ❌ fix en `≥16.3.8` |
| `sharp@0.35.4` dentro del rango `<0.35.5` | ❌ fix en `≥0.35.5` |
| Cadena del AI SDK en runtime (`ai`, `@ai-sdk/react`, `@ai-sdk/openai`, `@ai-sdk/gateway`, `@ai-sdk/mcp`, `@ai-sdk/provider-utils`) | ❌ Todos en el rango afectado (moderate); hay patch disponible |
| `katex@0.16.47` en runtime (vía `mermaid` → `@streamdown/mermaid` → `streamdown`) | ❌ Rango `0.11.0–0.18.1` (low), sin parche publicado |
| `proxy-addr@2.0.7` (critical) | ⚠️ Solo devDependencies: `shadcn` → `@modelcontextprotocol/sdk` → `express@5.2.1` → `proxy-addr` |
| `vite@8.3.0` (vía `vitest`), `source-map-js@1.2.1`, `fast-glob`/`braces`, `ts-morph` | ⚠️ Solo dev/build, pero todos `high` y mantienen el CI rojo |
| `postcss-selector-parser@7.1.4` (vía `postcss`) | ⚠️ El override de `postcss` **no** cubre este paquete (rango `<7.1.6`) |
| `npm audit fix` sobre `eslint-config-next` | ❌ npm propone **downgrade** a `14.2.35` (`isSemVerMajor`), incompatible con Next 16 — no aceptar |
| Warnings `act(...)` de React | ⚠️ 6 en la suite actual (2 en `src/features/portfolio/accessibility.test.tsx` + 4 en `src/features/ask-ai/components/ask-ai/AskAISuggestionBar.test.tsx`); el ADR los daba por resueltos |

---

## Traceability

| Requerimiento | Decisión | Artefacto |
| --- | --- | --- |
| Eliminar vulns Next | Upgrade 16.3.0 (hoy `^16.3.3` → instalado 16.3.6) | `package.json` |
| CSP sin unpkg | Editar CSP | `next.config.ts` |
| Anti-spoofing rate limit | Última IP + reenvío verbatim del header del edge | `src/lib/rate-limit.ts`, `src/app/api/chat/route.ts` |
| Tests sin warnings | Helper compartido | `src/test-utils/framer-motion.tsx`, 8 tests |
| LCP más ligero | quality 75 | `src/features/portfolio/Hero.tsx`, `Perfil.tsx` |
| Documentar | Este ADR | `docs/adr/ADR-001-production-hardening.md` |
