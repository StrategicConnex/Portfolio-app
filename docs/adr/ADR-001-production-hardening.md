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
- **`/api/chat`**: dejar de reenviar headers de IP de cliente al endpoint primario
  (elimina spoofing del rate limit).
- **`getClientId`**: usar la **última** IP de `x-forwarded-for` (la añadida por la
  plataforma), no la primera (spoofeable por el cliente).

### Dependencias (P0)
Overrides npm para resolver el audit completo a **0 vulnerabilidades**:

| Paquete | Vulnerable | Fijado | Racional |
| --- | --- | --- | --- |
| `fast-uri` | <3.1.5 | 3.1.5 | transitiva, parche same-major |
| `dompurify` | <3.4.12 | 3.4.12 | transitiva, parche same-major |
| `brace-expansion` | 1.1.15 | 1.1.18 | scoped a `eslint-plugin-import → minimatch@3.1.5` (dev-only) |
| `js-yaml` | 4.0.0–4.2.0 | 4.3.1 | transitiva de `shadcn` (dev) |
| `undici` | 7.0.0–7.28.0 | 7.29.0 | transitiva de `jsdom`/`shadcn` (dev) |
| `ip-address` | ≤10.3.0 | 10.4.0 | transitiva de `shadcn` (dev) |
| `postcss` | ≤8.5.22 | 8.5.25 | transitiva de `@tailwindcss/postcss` |
| `hono` | <4.12.34 | 4.12.34 | transitiva de `@modelcontextprotocol/sdk` (dev) |
| `@modelcontextprotocol/sdk` | ≤1.29.0 | 1.30.0 | fix upstream de `@hono/node-server` |
| `@hono/node-server` | <2.0.5 | 2.0.12 | requerido por SDK MCP 1.30.0 |

> **Nota**: `eslint-plugin-import → minimatch` requiere override **scoped por
> versión** (`minimatch@3.1.5`) para no afectar a `minimatch@10.2.5` (hoisted por
> ESLint), que necesita la API de `brace-expansion` 2.x/5.x.

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

- **Positivas**: 0 vulnerabilidades en `npm audit` completo; rate limiting
  resistente a spoofing de IP; suite de tests limpia (250/250, sin warnings de
  React); LCP más ligero; CSP alineada con el plan RUM.
- **Negativas**: los overrides de npm deben mantenerse documentados; el override
  de `brace-expansion` es scoped por versión y requiere cuidado al actualizar
  `eslint-plugin-import`.

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
npm audit            → found 0 vulnerabilities (full tree)
npm run lint         → exit 0
npm run typecheck    → exit 0
npm run test         → 250 passed (25 files)
npm run build        → OK, 7 routes
npx playwright test  → 17 passed
```

---

## Traceability

| Requerimiento | Decisión | Artefacto |
| --- | --- | --- |
| Eliminar vulns Next | Upgrade 16.3.0 | `package.json` |
| CSP sin unpkg | Editar CSP | `next.config.ts` |
| Anti-spoofing rate limit | Última IP + no reenviar IP | `rate-limit.ts`, `chat/route.ts` |
| Tests sin warnings | Helper compartido | `src/test-utils/framer-motion.tsx`, 8 tests |
| LCP más ligero | quality 75 | `Hero.tsx`, `Perfil.tsx` |
| Documentar | Este ADR | `docs/adr/ADR-001-production-hardening.md` |
