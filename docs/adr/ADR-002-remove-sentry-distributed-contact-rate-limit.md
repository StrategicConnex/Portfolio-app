# ADR-002: Remove Broken Sentry Integration, Distributed Contact Rate Limit, Drop /api/chat

**Status:** Accepted
**Date:** 2026-08-05
**Branch:** `remediation/portfolio-production-hardening`

---

## Context

Tras el análisis de alineación con COMMON ENGINE / FRONTEND SPECIALIST (Fase 1)
se detectaron tres hallazgos:

1. **Integración de Sentry rota**: `@sentry/nextjs` estaba instalado pero no
   había `instrumentation.ts`, ni `sentry.client.config.ts` /
   `sentry.server.config.ts`, ni `withSentryConfig` en `next.config.ts`. La
   inicialización se hacía con `require('@sentry/nextjs')` dinámico dentro de un
   componente cliente, sin el setup oficial del SDK de Next.js. El runtime del
   servidor (donde ocurren los errores reales de API) nunca quedaba
   instrumentado, y `require()` en bundle cliente es frágil con Turbopack.
   Además no existen credenciales de proyecto (`SENTRY_ORG`, `SENTRY_PROJECT`,
   `SENTRY_AUTH_TOKEN`) en CI ni documentadas en `.env.example`.
2. **Rate limiting in-memory en `/api/contact`**: usaba `checkRateLimit`
   (Map en memoria, por instancia), mientras `/api/ask-ai` ya usaba
   `checkRateLimitDistributed` (Upstash Redis). En Vercel serverless cada
   instancia tiene su propio Map, por lo que el límite de 5 req/min era
   burlable — y el endpoint dispara emails reales con costo (Resend).
3. **`/api/chat` como código muerto**: era una capa de compatibilidad de una
   migración anterior que hacía proxy a `/api/ask-ai`. No hay ninguna
   referencia en `src/` ni `e2e/` (verificado con búsqueda global).

## Decision

### 1. Eliminar Sentry por completo (decisión del usuario)
- Desinstalar `@sentry/nextjs` (elimina 107 paquetes transitivos).
- Eliminar `src/lib/observability/sentry.ts` y simplificar
  `ObservabilityProvider` a solo PostHog (incluido el listener de
  `unhandledrejection`, que solo alimentaba a Sentry).
- Quitar `SENTRY_DSN` de `.env.example` y `https://*.sentry.io` del CSP en
  `next.config.ts`.
- Actualizar `README.md` (stack de observabilidad y tabla de env vars).
- Si en el futuro se requiere error tracking, reintroducirlo con el setup
  oficial del SDK (`withSentryConfig` + `instrumentation.ts`) y credenciales
  reales. Hasta entonces, no existe falsa sensación de seguridad.

### 2. Rate limiting distribuido en `/api/contact`
- Reemplazar `checkRateLimit` (in-memory) por `checkRateLimitDistributed`
  (Upstash Redis con fallback in-memory) con el mismo límite: 5 req/min.
- Eliminar la función `checkRateLimit` de `src/lib/rate-limit.ts` (quedó sin
  consumidores; es el mismo anti-patrón que estamos removiendo).
- Actualizar `route.integration.test.ts` para resetear el limiter distribuido.

### 3. Eliminar `/api/chat`
- Borrar `src/app/api/chat/route.ts`. El frontend apunta directamente a
  `/api/ask-ai` (verificado en `AskAIPanel.tsx`).

## Alternatives

- **Setup oficial de Sentry**: descartado por el usuario — sin credenciales
  reales ni uso activo, un setup a medias mantendría complejidad sin valor.
  Dejarlo preparado sin DSN real no aporta observabilidad.
- **Mantener `checkRateLimit` en `rate-limit.ts`**: descartado — es el
  anti-patrón (memoria por instancia) y no tiene consumidores tras el cambio.

## Consequences

- **Positivas**: sin dependencia pesada de Sentry (~100+ paquetes menos);
  rate limiting de contacto resistente al escalado de instancias; menos
  superficie de API (un endpoint menos); CSP más restringida; `npm audit`
  sigue en 0 vulnerabilidades.
- **Negativas**: se pierde el (no funcional) error tracking server-side. Los
  errores de cliente siguen visibles en consola; si se necesita captura, ver
  el plan de reintroducción.

## Risks

- **Riesgo residual**: el fallback in-memory de `checkRateLimitDistributed`
  sigue siendo por instancia si Upstash no está configurado. Para producción
  con múltiples instancias es **requerido** configurar
  `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN` (documentado en
  `.env.example`).

## Migration / Rollback

- **Rollback**: `git revert` del commit; re-instalar con `npm install`
  (restaura `@sentry/nextjs` y el archivo `sentry.ts`).
- Sin migración de datos ni de esquema.

## Validation

```text
npm run lint         → exit 0
npm run typecheck    → exit 0
npm run test         → suite completa en verde
npm audit            → found 0 vulnerabilities
grep /api/chat       → 0 resultados en src/ y e2e/
grep sentry          → 0 resultados en src/ y config
```

---

## Traceability

| Requerimiento | Decisión | Artefacto |
| --- | --- | --- |
| Eliminar Sentry roto | Desinstalar + simplificar provider | `package.json`, `ObservabilityProvider.tsx`, `next.config.ts`, `.env.example`, `README.md` |
| Rate limit distribuido en contacto | `checkRateLimitDistributed` | `src/app/api/contact/route.ts`, `src/lib/rate-limit.ts`, `route.integration.test.ts` |
| Eliminar /api/chat muerto | Borrar ruta | `src/app/api/chat/route.ts` (eliminado) |
| Documentar | Este ADR | `docs/adr/ADR-002-remove-sentry-distributed-contact-rate-limit.md` |
