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

Estado **cerrado en octubre 2026**: la superficie de producción está en cero y el
gate de CI vuelve a verde. La meta original ("audit completo en 0") se cumple para
todo lo que se despliega; queda un advisory **dev-only sin parche publicado**.

**Tabla vigente (octubre 2026)** — la columna "¿cierra el advisory?" compara el
override contra el **rango afectado real** que reporta `npm audit`:

| Paquete | Rango afectado | Versión fijada | ¿Cierra? | Racional |
| --- | --- | --- | --- | --- |
| `next` (directa) | `16.0.0 – 16.3.7` (high) | `16.4.2` | ✅ | SSRF en Image Optimization, cache poisoning SSG/ISR, Draft Mode leak, disclosure del endpoint MCP |
| `sharp` (directa) | `<0.35.5` (high) | `0.35.5` | ✅ | CVE-2026-96889 (librsvg) |
| `undici` | `7.0.0 – 7.29.0` | `7.29.1` | ✅ | transitiva de `jsdom`/`shadcn` (dev) |
| `ip-address` | `≤10.7.0` | `10.7.4` | ✅ | transitiva de `express-rate-limit` (dev) |
| `hono` | `4.12.4 – 4.13.10` | `4.13.13` | ✅ | transitiva de `@modelcontextprotocol/sdk` (dev) |
| `@modelcontextprotocol/sdk` | `<1.32.0` | `1.32.1` | ✅ | GHSA-6qxp-vccf-f47h |
| `proxy-addr` | `1.1.0 – 2.0.7` (**critical**) | `2.0.8` | ✅ | `shadcn → @modelcontextprotocol/sdk → express → proxy-addr` |
| `vite` | `8.3.0 – 8.3.2` (high) | `8.3.4` | ✅ | `vitest → vite` |
| `source-map-js` | `1.0.0 – 1.2.1` (high) | `1.2.2` | ✅ | `@tailwindcss/postcss` y `jsdom → css-tree` |
| `postcss-selector-parser` | `<7.1.6` | `7.1.7` | ✅ | el override de `postcss` **no** lo cubría: necesita el suyo |
| `brace-expansion` | `<1.1.21` y `4.0.0 – 5.0.11` | `1.1.21` / `5.0.12` (**dos overrides scoped**) | ✅ | ver nota scoped |
| `fast-uri` | — (fuera de rango) | `3.1.8` | ✅ | transitiva, parche same-major |
| `dompurify` | — (fuera de rango) | `3.4.16` | ✅ | transitiva, parche same-major |
| `js-yaml` | — (fuera de rango) | `4.3.2` | ✅ | transitiva de `shadcn` (dev) |
| `postcss` | — (fuera de rango) | `8.5.28` | ✅ | transitiva de `@tailwindcss/postcss` |
| `@hono/node-server` | — (no vulnerable en sí) | `2.1.1` | ✅ | requerido por SDK MCP |
| `baseline-browser-mapping` | — (fuera de rango) | `2.11.0` | ✅ | transitiva de `browserslist` |
| `browserslist` | — (fuera de rango) | `4.28.7` | ✅ | transitiva dev |
| `qs` | — (fuera de rango) | `6.16.0` | ✅ | transitiva dev |
| `fflate@>=0.6.0 <0.6.11` | `<0.6.11` | `0.6.11` | ✅ | override *scoped por rango* |
| `mermaid` | — (el audit ya no lo reporta) | `11.16.1` | ➖ | se mantiene **sin tocar**: `12.x` es un salto mayor sobre `@streamdown/mermaid` y no hay advisory que lo justifique |
| `braces` | `≤3.0.3` (high) | `3.0.3` | ❌ **imposible** | `3.0.3` es la **última versión publicada**: no existe parche. Dev-only (`shadcn → fast-glob → micromatch`) |
| `katex` | `0.11.0 – 0.18.2` (low) | `0.16.47` | ❌ **sin fix en rango** | runtime vía `streamdown`; `low`, no bloquea el gate |

> **Nota `brace-expansion`:** un override global rompe `minimatch@3` (que espera
> la API 1.x). Por eso hay **dos overrides scoped**:
> `brace-expansion@<2.0.0 → 1.1.21` y `brace-expansion@>=4.0.0 → 5.0.12`.
> Verificado con `npm run lint` y la suite completa.

> ✅ **Estado real (octubre 2026):** `npm audit --omit=dev --audit-level=moderate`
> sale con **código 0** (solo 8 avisos `low` en la cadena `streamdown`/`katex`).
> `npm audit --audit-level=critical` también sale con **código 0** en el árbol
> completo. Total: **37 → 16 avisos**, y los 8 `high` restantes son **un único
> advisory** (`braces`) replicado en 8 nodos.

#### Gate de CI en dos capas

El job `validate` ya no ejecuta un único `npm audit --audit-level=moderate`,
porque eso mezclaba la superficie de producción con deuda de tooling **sin
parche posible**:

| Capa | Comando | Efecto |
| --- | --- | --- |
| Producción | `npm audit --omit=dev --audit-level=moderate` | **bloqueante** — es lo que se despliega |
| Crítico global | `npm audit --audit-level=critical` | **bloqueante** — un crítico bloquea aunque sea dev |
| Resto | `npm audit --audit-level=moderate` | **`::warning::`** — visible en el log, no frena el deploy |

No es una relajación: `braces@3.0.3` **no tiene parche publicado**, así que
bloquear el deploy por él equivale a no poder desplegar nunca sin un downgrade de
`eslint-config-next` a `14.2.35`, incompatible con Next 16.

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
- **Cerrado (P0, octubre 2026)**: el gate de seguridad vuelve a verde con dos
  capas (`--omit=dev` bloqueante + `critical` global bloqueante). Queda un
  advisory `high` **dev-only sin parche publicado** (`braces@3.0.3`) y un `low`
  de runtime (`katex`), ambos documentados en "Deuda abierta".

## Risks

- **Riesgo residual**: `undici@7.29.1` es parche de la línea 7.x (la 8.x es un
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
npm audit --omit=dev --audit-level=moderate → 8 low, 0 moderate/high/critical  ← EXIT 0
npm audit --audit-level=critical            → sin críticos en todo el árbol      ← EXIT 0
npm audit (árbol completo)                  → 16 (8 low, 8 high: solo `braces`) ← EXIT 1 (advisory)
npm run lint                                → exit 0 (3 warnings)
npm run typecheck                           → exit 0
npm run test                                → 539 passed (50 files)
npm run build                               → OK, 17 routes
npx playwright test                         → 38 tests declarados (9 specs)
```

> **Estado actualizado (octubre 2026):** la suite creció con los seams de
> arquitectura cerrados posteriormente (RAG unificado, corpus proyectado,
> rate-limit, prompt builder, model pool, memoria client-side, idioma, tema,
> stats/panel y biblioteca). Hoy: `npm test` → **539 passed (50 files)**,
> `npx playwright test --list` → **38 tests (9 specs)** contra el build de
> producción (`E2E_PROD_SERVER=1`).
> Los overrides de npm, la CSP y el contrato `getClientId` (última IP de XFF)
> siguen vigentes según lo decidido en este ADR. La cláusula de `/api/chat`
> evolucionó con la remediación H2 (ver supersession arriba).
>
> ✅ La línea de `npm audit` **ya no rompe el pipeline**: el gate bloqueante es
> `--omit=dev --audit-level=moderate` (exit 0) más `--audit-level=critical` en el
> árbol completo (exit 0). El `npm audit` completo sigue saliendo con código 1 por
> `braces@3.0.3`, que **no tiene versión parcheada publicada** — el CI lo emite
> como `::warning::` y no bloquea `lighthouse` / `e2e` / `deploy`.

### Deuda abierta (octubre 2026)

| Ítem | Estado |
|---|---|
| Gate de producción (`--omit=dev --audit-level=moderate`) | ✅ Exit 0 — 8 avisos `low` no bloqueantes |
| Críticos en todo el árbol (`--audit-level=critical`) | ✅ Exit 0 — el `proxy-addr` critical quedó cerrado con el override `2.0.8` |
| Overrides que fijaban versiones dentro del rango afectado | ✅ Los 5 realineados: `undici 7.29.1`, `ip-address 10.7.4`, `hono 4.13.13`, `@modelcontextprotocol/sdk 1.32.1`; `mermaid` ya no lo reporta el audit |
| Override *scoped* de `brace-expansion` | ✅ Restaurado en dos tramos (`@<2.0.0 → 1.1.21`, `@>=4.0.0 → 5.0.12`) |
| `next` (era `16.3.6`, rango `16.0.0–16.3.7`) | ✅ `16.4.2` |
| `sharp` (era `0.35.4`, rango `<0.35.5`) | ✅ `0.35.5` |
| `proxy-addr@2.0.7` (critical), `vite@8.3.0`, `source-map-js@1.2.1`, `postcss-selector-parser@7.1.4`, `ts-morph` | ✅ Cerrados por overrides |
| `braces@3.0.3` (high, dev-only) | ❌ **Sin parche publicado** — `3.0.3` es la última versión. Reportado como warning; `npm audit fix` solo lo "resuelve" bajando `eslint-config-next` a `14.2.35` |
| `katex@0.16.47` (low, runtime vía `streamdown`) | ❌ Sin fix dentro del rango del advisory; no bloquea |
| Cadena del AI SDK (`ai`, `@ai-sdk/*`) | ✅ Ya no aparece en el audit: la cerró el bump de lockfile de `22e0223` (esta fila del ADR estaba desactualizada) |
| Braces/`fast-glob` en `shadcn` (dev) | ⚠️ Solo dev/build, pero `high` — mantiene el `::warning::` |
| Warnings `act(...)` de React | ⚠️ 6 en la suite actual (2 en `src/features/portfolio/accessibility.test.tsx` + 4 en `src/features/ask-ai/components/ask-ai/AskAISuggestionBar.test.tsx`); el ADR los daba por resueltos |
| **P1** — IP del registro de descargas vs rate limit | ❌ Abierto: `/api/track/download` guarda el **primer** hop de `x-forwarded-for` mientras el rate limit usa el **último** (`getClientId`) — métricas manipulables |

## Traceability

| Requerimiento | Decisión | Artefacto |
| --- | --- | --- |
| Eliminar vulns Next | Upgrade a `^16.4.2` (instalado 16.4.2) | `package.json` |
| Gate de seguridad por exposición | `--omit=dev` bloqueante + `critical` global bloqueante | `.github/workflows/ci.yml` |
| CSP sin unpkg | Editar CSP | `next.config.ts` |
| Anti-spoofing rate limit | Última IP + reenvío verbatim del header del edge | `src/lib/rate-limit.ts`, `src/app/api/chat/route.ts` |
| Tests sin warnings | Helper compartido | `src/test-utils/framer-motion.tsx`, 8 tests |
| LCP más ligero | quality 75 | `src/features/portfolio/Hero.tsx`, `Perfil.tsx` |
| Documentar | Este ADR | `docs/adr/ADR-001-production-hardening.md` |

---

## Addendum (22 de octubre de 2026): `img-src` sin host remoto

La decisión original quitó `unpkg.com` de `script-src` y `connect-src`, pero dejó
`img-src 'self' data: https:`. Ese `https:` no lo necesitaba ninguna imagen del sitio:
la única imagen remota en runtime era la del mapa 3D, que pedía sus texturas a
`unpkg.com/three-globe@2.45.6/example/img/…` — es decir, **la decisión estaba a medias**:
había una dependencia de CDN en runtime mientras la CSP seguía abierta a cualquier host.

Se cierra:

| | Antes | Ahora |
|---|---|---|
| Texturas del globo | `unpkg.com/three-globe@2.45.6/example/img/…` | `/textures/…` servidas por la app (`public/textures/`) |
| `img-src` | `'self' data: https:` | `'self' data:` |
| Peso de las texturas | 2,2 MB (4096×2048 + 2 PNG) | 368 KB (recodificadas con `sharp`, misma proyección 2:1) |
| Privacidad | cada visita contactaba con un CDN externo | ninguna petición remota |

Las texturas se sirven desde `public/textures/` con su procedencia y licencia en
`public/textures/NOTICE.md` (three-globe MIT; las imágenes son de la NASA, dominio
público). `src/lib/csp.test.ts` fija la directiva para que reabrirla exija una
revisión explícita.
