# CONTEXT.md — Domain Glossary

Terms that name good seams in this codebase. Architecture reviews should use
these names instead of inventing new ones, and should not re-suggest seams
that are already recorded here.

## Layout convention

Domain code lives in **feature modules**, not in the shared roots:

- `src/features/ask-ai/` — the copilot: `ask-ai-store.ts` (Zustand), `lib/`
  (rag, prompt, model-pool, memory, tools, telemetry), `components/ask-ai/`
  (panel UI + tool cards) and `components/ai-elements/`.
- `src/features/stats/` — download metrics: `download-stats.ts`,
  `panel-auth.ts` (HMAC cookie), `upstash-rest.ts`.
- `src/features/recursos/` — the downloadable library UI (`Recursos.tsx`) and
  `recursos-volumes.ts`.
- `src/features/portfolio/` — all portfolio sections (Hero, Perfil,
  Arquitectura, Experiencia, SIEMDashboard, AuditHub, SCAudit, Blog, Stack,
  Certificaciones, Proyecto, Contacto) plus global chrome (Navbar, Footer,
  HtmlLangUpdater) and 3D/canvas visuals. The cyber-attack map lives here too:
  `CyberAttackMap3D.tsx` (the WebGL scene), `ArcTooltipPanel.tsx` +
  `arcTooltip.ts` (arc detail), `attackArc.ts` (arc geometry),
  `globeRotation.ts` (frame-rate independent rotation).
- `src/lib/` — **shared seams only** (language, rate-limit, server-i18n,
  theme, next-cache, observability, utils, constants): code used by more than
  one feature. Do not grow feature logic here.
- `src/components/` — shared kernel only: `ui/` (shadcn primitives +
  SectionHeader/FadeIn/Icon) and `observability/`. Feature components do not
  live here.
- `src/app/` — routes only; pages/route handlers compose features and must
  not hold domain logic. `src/data/` — content (consumed by features and by
  the ask-ai corpus projection).
- `src/context/` — React context providers and the i18n/theme dictionaries:
  `LanguageContext.tsx`, `ThemeContext.tsx` and `translations/` (23
  dictionaries, one per section). Providers consume the seams; they never
  re-derive the rules.

## i18n

- **Language detection seam** (`src/lib/language.ts`): the single module that
  owns the portfolio's language rule — *cookie → Accept-Language header →
  default* on the server (`detectLanguageServer`) and *cookie →
  navigator → default* on the client (`detectLanguageClient`), both converging
  on `LANGUAGE_COOKIE`. The cookie is the agreement channel between both
  sides: `src/proxy.ts` (Next 16 proxy) guarantees it on every page response
  (the layout cannot set cookies during Server Component rendering), so the
  client always reads the same value SSR painted and the first paint never
  flips. localStorage is the **deferred** preference channel:
  `resolveHydrationLanguage` keeps the SSR first paint when a stored choice
  diverges and re-establishes the cookie for the next request — never render
  a stored preference over the SSR paint. `layout.tsx` (SSR first paint),
  `proxy.ts` and `LanguageContext.tsx` (post-hydration state) consume this
  seam and must never re-derive the rule themselves. Do not re-suggest
  extracting, duplicating or moving cookie-writing into the layout.

## SEO metadata

- **SEO seam** (`src/lib/seo.ts` + `src/lib/i18n-server.ts`):
  `buildPageMetadata(page)` is the single source of `title`, `description`,
  canonical, hreflang, Open Graph and Twitter metadata per page **and
  locale**. `getServerLocale()` resolves the locale server-side with the same
  rule as the language seam (*cookie → Accept-Language → es*);
  `src/proxy.ts` forwards `?lang=es|en` as a **request cookie** so the
  hreflang URLs render in the advertised language on the first byte, even for
  crawlers that do not keep cookies. Pages export
  `generateMetadata = () => buildPageMetadata(key)` — never hardcode metadata
  per page and never add a second `<link rel="canonical">` (the layout
  intentionally renders none; `metadata.alternates` owns canonical/hreflang).
  JSON-LD (`Person`, `ProfessionalService`, `WebSite`, `BreadcrumbList`,
  `FAQPage`) lives in `layout.tsx`, and `sitemap.ts` derives its
  `alternates.languages` from the same localized URLs.
- **Social-card seam** (`scripts/generate-og.mjs` → `public/og/`):
  `npm run og:generate` renders one deterministic **1200×630** JPEG per page and
  locale (Playwright + sharp, brand fonts, no hand-made assets). `seo.ts`
  points `og:image`/`twitter:image` at `/og/${page}-${locale}.jpg`; the layout
  uses `/og/home-es.jpg` as the default for routes without page metadata.
  Re-run the script when a page title/description in `seo.ts` changes — never
  ship an OG image that declares dimensions different from the real file.

## Consent & analytics

- **Consent seam** (`src/lib/consent.ts`): the single source of truth for the
  analytics decision (`portfolio_consent` cookie: `granted` | `denied` |
  `unknown`). **`unknown` is treated as denied**: PostHog and the SCAudit RUM
  script must not load before an explicit choice. `writeConsent()` persists and
  broadcasts; `subscribeConsent()` lets trackers start without a reload;
  `openConsentPreferences()` re-opens the banner from the footer.
- **Banner** (`src/components/consent/ConsentBanner.tsx`): rendered only after
  hydration (no flash for returning visitors), non-modal bottom-left region
  with both options always visible. Do not turn it into a blocking modal or
  pre-check consent.
- **Gated loaders**: `ObservabilityProvider` initializes Sentry always
  (essential error reporting) but `initPosthog()` only on `granted`; RUM goes
  through `RumScript` (`src/components/observability/RumScript.tsx`), which
  renders nothing before consent and injects `next/script` with **SRI**
  (`sha384`, from `SITE.scaudit.integrity`) once granted. If the remote
  `vitals.js` changes, recompute the hash (command in `constants.ts`); a stale
  hash fails closed — telemetry stops, the site keeps working. Never load the
  RUM script directly from the layout again.
- **RUM proxy seam** (`src/app/api/rum/route.ts`): `RumScript` gets
  `data-api-url="/api/rum"` (`SITE.scaudit.proxyUrl`), so the browser never
  posts to `scaudit.vercel.app`. The route validates the real `vitals.js` v2
  envelope (the `projectId` is pinned to `SITE.scaudit.projectId`), rejects
  bodies over 32 KB and rate-limits 60 req/min per trusted edge IP. It then
  forwards the validated payload server-side with `Origin: SITE.url`; SCAudit
  validates it against its `ALLOWED_TELEMETRY_ORIGINS` allowlist, where the
  portfolio origin is registered. Responses: 204 success; 400/413/415/429
  rejected locally; 502/503/504 upstream failure. This is why `connect-src` no longer lists
  `scaudit.vercel.app` (only `script-src` needs it, for the SRI-hashed script).
  Tests: `src/app/api/rum/route.test.ts`, `e2e/rum-proxy.spec.ts` and the CSP
  guard in `src/lib/csp.test.ts`.
- Tests: `src/lib/consent.test.ts`, `ConsentBanner.test.tsx`,
  `ObservabilityProvider.test.tsx` and `e2e/consent.spec.ts` pin the gate.

## Theme

- **Theme seam** (`src/lib/theme.ts`): the single module that owns the
  portfolio's light/dark rule, mirroring the language seam. Three sides must
  never drift apart — the server (`layout.tsx` + `src/proxy.ts`), the client
  (`src/context/ThemeContext.tsx`) and the inline no-flash script in `<head>` —
  and all three
  call the same pure functions in this file: `resolveTheme()`,
  `detectThemeServer()` (cookie → default `'system'`), `detectThemeClient()`
  (cookie → localStorage → default) and `resolveHydrationTheme()` (the
  flash-free hydration decision, same contract as `resolveHydrationLanguage`).
  The cookie (`portfolio_theme`, 1 year) is the agreement channel: the proxy
  guarantees it on every page response, so the inline script resolves the
  `light`/`dark` class **before first paint**. The resolved class is always
  either `light` or `dark` — never absent. `THEME_INIT_SCRIPT` is a
  self-contained string so the layout can inline it synchronously.
  Do not re-suggest extracting the theme rule into a component, duplicating
  the `matchMedia` check, or moving cookie-writing into the layout.

## Design tokens / accessibility

- **Design-token audit** (`src/lib/design-tokens.contrast.test.ts`): the
  permanent guard for the three CSS scopes — `:root` (light), `.dark` and
  `.console` (deliberately dark in both themes). It parses `src/app/globals.css`
  live (so it cannot desynchronize from the CSS), composes the real
  translucent surfaces (fill → glass → bg2) and fails if a text tier drops
  below 4.5:1 (WCAG AA) or an interactive border below 3:1 (WCAG 1.4.11) in
  any scope. The rules it enforces are the migration rules: no hardcoded
  `text-slate-*` / `bg-slate-*`, no inline hex colors, `.console-bg` for
  fixed dark panels and `.console` for dark-in-both-themes scopes.

## RAG / Ask Juan AI

- **Retrieval seam** (`src/features/ask-ai/lib/rag/retriever.ts`): the single module
  that owns retrieval for the copilot (candidate C1, now closed). One public
  entry point `retrieve()` fuses keyword scoring and TF-IDF semantic
  similarity — keyword scores are min-max normalized to 0–100 and weighted
  by `RAG_WEIGHTS` (0.6 keyword / 0.4 semantic) — into a ranked list, and
  `buildRagContext()` consumes it so the system-prompt context and the
  "available sources" list always come from the same retrieval (the corpus
  is scanned once per request). `retrieveRelevant` / `retrieveSemantic` are
  internal components exported only for tests. The corpus lives in
  `sources.ts`. Do not re-suggest splitting the seam or re-duplicating its
  components.
- **Tokenizer primitive** (`src/features/ask-ai/lib/rag/tokenizer.ts`): single home
  for `tokenize()` and `STOP_WORDS` — the shared language rule for all
  retrieval scoring. The accented-question-word gap (`qué` matching
  `neuquén` by substring) is fixed — question words are stop words. Known
  remaining limitation (pre-existing): TF-without-IDF prefers short
  documents; a future ranking pass may address it, but it is not a seam
  defect.
- **Knowledge corpus projection** (`src/features/ask-ai/lib/rag/sources.ts`): the
  corpus is *derived*, not duplicated (candidate C2, now closed). Profile,
  experience, SIEM, compliance, blog and case-study entries are projected
  from the live content modules (`src/data/*`) and the translation
  dictionaries, so editing the page updates the copilot by construction;
  contact, stack, certifications and services live in the explicit MANUAL
  registry (their data has no page source). The corpus is fully per-locale:
  every entry is `es` or `en` (no `both` with Spanish content for English
  users) and every `es` entry has an `-en` sibling. Do not re-suggest a
  hand-maintained mirror or merging locales back into `both`.

## Downloads & private panel

- **Download metrics seam** (`src/features/stats/download-stats.ts`): the
  single home for recording and aggregating download events. `recordDownload()`
  writes through one of two backends — Upstash Redis REST (durable across
  Vercel instances) or a local NDJSON file (`.data/descargas.ndjson`,
  overridable with `DOWNLOAD_STATS_FILE`) — and never throws: a failed log
  must not break the download. `readRecent()` + `countByDay()` /
  `countByFile()` / `countByVolume()` / `countByCountry()` are the only
  aggregation surface; the log is capped at the last 10.000 events.
  `isTrackableFile()` is the guard that only accepts saneable paths under
  `/recursos/`. Do not re-suggest a second storage backend or per-route
  aggregation logic.
- **Panel auth seam** (`src/features/stats/panel-auth.ts`): the single home
  for the private panel's session. The signing key **is**
  `DOWNLOAD_STATS_TOKEN` (the same secret used to log in) — there is no
  separate session secret. `createPanelCookieValue()` emits an HMAC-SHA256
  `panel_auth` cookie (httpOnly, 30 days) and verification compares in
  constant time. With no `DOWNLOAD_STATS_TOKEN` configured, the panel page,
  the login page and the session route answer **404** rather than 401, so the
  surface is invisible by default.
  Do not re-suggest a second token, a session store, or a non-constant-time
  comparison.
- **Tracking route** (`src/app/api/track/download/route.ts`): records the
  event and redirects (307) to the static file. Its rate limit (30/min) is
  **fail-open** — if Redis is down the download still works. Note the known
  inconsistency: the limit keys on `getClientId()` (the **last**
  `x-forwarded-for` entry) while the recorded event stores the **first**
  entry; the latter is client-spoofable and is tracked as P1 debt in
  `README.md` → "Deuda técnica conocida".

## Resources library

- **Library seam** (`src/data/recursos.ts` + `src/features/recursos/`):
  `RECURSO_FILES` is the single metadata registry (61 documents, 7
  categories: 5 book volumes with detail pages at `/recursos/[volumen]` plus
  the `standards` and `project` collections). `recursos-volumes.ts` holds the
  per-volume bilingual copy. The extracted text
  (`src/data/recursos-text.json`, produced by
  `scripts/extract-recursos-text.mjs`) and the chapter/search index
  (`src/data/recursos-outline.json`) are what the copilot corpus projects, so
  the copilot describes documents from their real content. Do not re-suggest
  a parallel document list or re-scanning the corpus per request.

## Threat map / cyber attack map

- **Threat-intel seam** (`src/app/api/threat-intel/route.ts`): the single home
  for live threat intelligence. It aggregates **DShield (SANS ISC)**
  (`topips` + `ip/<ip>`) and **CISA KEV** into one response, with
  `ipwho.is` as the HTTPS-capable geolocation fallback (ip-api.com only
  allows HTTP on its free tier and fails server-side). The route publishes
  the **real state of each source** (`sourceStatus`: `live` / `degraded` /
  `unavailable`) plus the applied `cacheTtlSeconds` — a dead feed is
  declared, never replaced with invented data. `coalesce()` collapses
  concurrent bursts into a single upstream query per source. Do not
  re-suggest a per-component feed fetch or a second aggregation point.
### Seam: SIEM Feed en Tiempo Real (`src/lib/siem-feed.ts`)

**Propósito**: agregación de inteligencia de amenazas reales para el dashboard SIEM
(`src/app/api/siem-feed/route.ts` es solo transporte) y el copilot (`querySiem`).

**Fuentes**:

- Abuse.ch Feodo Tracker — IPs C2 en vivo (IP, puerto, status, malware, país)
- DShield (SANS ISC) — `topports`/`topips` (escaneos de puertos; `topports` llega como
  objeto indexado y se publica como `SANS ISC (aggregate)`, sin IP de origen inventada)

**Reglas estrictas**:

1. **CERO datos simulados**: si las fuentes externas fallan, el endpoint
   `/api/siem-feed` debe devolver un estado `degraded()` honesto. Nunca generar IPs,
   puertos o alertas con `Math.random()`. Cada proveedor se degrada por separado y la
   respuesta declara `feedsStatus`/`cacheTtlSeconds`.
2. **Consistencia**: tanto `SIEMDashboard.tsx` como la herramienta del copilot
   `querySiem` consumen exclusivamente `getSiemFeedData()` — panel, API y chatbot
   reportan siempre los mismos datos.
3. **Transparencia**: el UI muestra el badge "FEED GLOBAL · DATOS REALES" y aclara que
   son amenazas globales observadas, no logs de una red privada específica. Las
   entradas de `mitigation` son recomendaciones derivadas, nunca acciones ejecutadas.
4. No re-sugerir un segundo punto de agregación ni ataques simulados/de ejemplo en el
   panel (y ni siquiera sugerir `Math.random()` para rellenar huecos).
5. **Horario**: todas las horas del proyecto (reloj del panel, event stream,
   KPIs, horas que reporta `querySiem`) se muestran en Argentina (UTC-3) vía
   `toArgentinaTime()` (`src/lib/utils.ts`) — nunca la hora local del
   visitante ni UTC puro.
- **Data-cache seam** (`src/lib/next-cache.ts`): `cachedData()` wraps
  `unstable_cache` and degrades to a direct call when there is no Next
  request context (vitest, scripts, utilities), where `unstable_cache`
  throws `Invariant: incrementalCache missing`. The invariant is checked
  *before* invoking the wrapped function, so the expensive work is never
  repeated. Do not re-suggest calling `unstable_cache` directly outside a
  route handler.
- **Arc-geometry seam** (`src/features/portfolio/attackArc.ts`): the single
  home for turning a threat event into a drawable arc. `attackTypeFor()`
  maps the provider's free text to one of six attack types by keyword
  (never a false positive — it falls back); `pickDestination()` applies the
  fixed weights (5% Neuquén · 20% Argentina · 75% global illustrative) with
  the random source injected so the weights are testable; `buildAttackArc()`
  returns the `illustrative` and `destinationKind` flags that separate
  provider data from the map's own choice. Do not re-suggest picking
  destinations in the component.
- **Geocoding seam** (`src/data/countryCoords.ts`): `COUNTRY_COORDS` and
  `COUNTRY_BY_ISO` are the only source of positions and country names for
  the map. Countries are resolved **by ISO code** so `originCountry` is
  always a key the map can place, never free text.
- **Globe-rotation seam** (`src/features/portfolio/globeRotation.ts`):
  `advanceEarthRotation()` applies a **rad/s** speed with the real frame
  delta (clamped to 100 ms), never `rotation.y += k`. The globe, the country
  labels, the protected pin, the arcs and the bursts all live inside the
  single `RotatingEarth` group that rotates — the globe mesh must not
  rotate on its own, or the markers drift off their countries.
  `cyberAttackMap3D.guard.test.ts` pins that invariant over the JSX tree
  (the scene cannot be mounted in jsdom).
- **Static-asset seam** (`public/textures/` + `public/fonts/`): the globe textures and the 3D label font are served by the app itself, never from a CDN at runtime. ADR-001 removed `unpkg.com` from the CSP precisely to avoid that dependency; `img-src` is therefore `'self' data:` and `font-src` is `'self' data:`. `src/lib/csp.test.ts` pins both directives, and `public/textures/NOTICE.md` records the provenance (three-globe MIT; NASA images, public domain). Do not re-suggest pointing `useTexture` at a remote host — that silently reopens both the CSP and a third-party request per visitor.
- **Arc-tooltip seam** (`src/features/portfolio/arcTooltip.ts` +
  `ArcTooltipPanel.tsx`): the tooltip *logic* is a pure function with no
  React dependency; the *labels* are injected as `TooltipLabels` so the
  panel can read them from the dictionary. A field the provider did not
  publish is rendered as «—», never as a zero or an invented value, and
  illustrative arcs carry an explicit notice. Do not re-suggest inlining
  the tooltip logic in the 3D component.
- **Map copy seam** (`src/context/translations/threatmap.ts`): the map is
  drawn in a WebGL canvas, so there is no DOM to translate — **all** of its
  visible text comes from this dictionary (ES + EN). The guard test fails
  if a literal string is reintroduced in the component. Provider text
  (DShield attack types, ASN names) and technical nomenclature (DDoS, Botnet
  C2, SQL Injection, APT) stay untranslated on purpose.
- **Lazy-loading seam** (`LazyCyberAttackMap.tsx` +
  `CyberAttackMap3D.loader.tsx`): the **only** supported way to mount the 3D
  scene. three.js + `@react-three/fiber` + `drei` (~914 KB) live in a dynamic
  chunk requested by an `IntersectionObserver` (`rootMargin: 200px`) on the
  home, or immediately on `/cyber-attack-map`. `ssr: false` must live inside
  this Client Component — a Server Component cannot use it (Next 16 ignores or
  rejects it) — and the loader is the accessible placeholder shown while the
  chunk downloads. Never re-import `CyberAttackMap3D` statically from a section
  or page: that puts three.js back into the home's initial JS (verified
  regression: +914 KB).

## Rate limiting

- **Rate-limit seam** (`src/lib/rate-limit.ts`): the single module that owns
  request throttling (candidate C3, now closed). One entry point
  `checkRateLimit()` — async — selects the Upstash Redis adapter when
  configured and falls back to the shared in-memory `Map` otherwise (single
  copy of the window logic; the former `rate-limit-upstash.ts` duplicate is
  deleted). `getClientId()` keeps the ADR-001 contract: it reads the LAST
  `x-forwarded-for` entry (trusted edge), never the first (client-spoofable).
  The legacy fallback `/api/chat` propagates the edge-delivered
  `x-forwarded-for`/`x-real-ip` verbatim to `/api/ask-ai` (H2), so the fallback
  path is rate-limited per client too instead of collapsing into the global
  `internal` bucket — the ADR-001 "do not forward" clause was superseded by the
  last-entry contract (see the supersession note in ADR-001).
  Both API routes (`/api/contact` with 5 req/min, `/api/ask-ai` with 10
  req/min) call this seam and must not re-derive their own counters. Do not
  re-suggest splitting the local and distributed paths.

## Ask Juan AI — orchestration (candidate C5, closed)

- **Prompt builder** (`src/features/ask-ai/lib/prompt/system-prompt.ts`): the single
  home for the copilot system-prompt assembly. `buildSystemPrompt()` composes
  the language/mode headers, the RAG context block (from the retrieval seam),
  the behavior rules and the passive-analysis tool guide;
  `buildToolDescriptions()` renders the six-tool guide per locale. The route
  must not inline prompt templates anymore.
- **Model pool** (`src/features/ask-ai/lib/model-pool.ts`): the only place that
  decides which model serves a request — and it is **free-only by code
  invariant**: `buildFreeModelPool()` drops any configured entry that is not
  a `:free` endpoint (or the `openrouter/free` router) and throws
  `ModelPoolError` (→ 503) if nothing survives, so the copilot never pays
  for inference. `streamWithFallback()` tries the pool in order and returns
  `{ response, modelId }`, injecting the winning model as stream metadata
  for the panel badge; a model counts as failed  only when its stream errors before producing data (startup failure, SSE
  error first event, empty stream, or 429 rate limit), because `streamText()`
  itself does not throw at call time. `ensureStreamStarts` reads until the
  FIRST REAL event (the SDK emits `start`/`text-start` synchronously, so a
  delisted model's 404/429 arrives in a later event — reading one chunk
  would commit the pool to a dead model). All models failed →
  `ModelPoolError` → the route answers
  503. The client health-checks the pool: a mid-stream failure triggers an
  auto-retry (max 2 per exchange) that re-sends with `skipModels` (the
  failed ids, excluded via `buildFreeModelPool({ skip })`), and the header
  badge shows the winning model with its perceived latency, plus an amber
  fallback marker when the first pool model failed (the stream metadata
  carries the winning model's 1-based pool index). A 429 at
  stream start (free-tier limits: 20 req/min) queues the model for retry
  with exponential backoff (600ms→1200ms, ±50% jitter, max 2 retries,
  global 5s budget) before the pool advances — do not skip straight to
  the next model on a rate limit. The client persists the health-check
  (`src/features/ask-ai/lib/pool-health.ts`, localStorage key `ask-ai-failed-models`,
  24h TTL): failed models start skipped on the next visit and the list
  self-heals as entries expire. Do not re-suggest inlining model selection
  in the route, and do not re-suggest adding a paid fallback.
- **Conversation memory** (connected to the client seam): the server-side
  summarization call (`generateConversationSummary` / `shouldSummarize`) was
  **deleted** in C5 — it ran in the ask-ai route and its result was
  discarded. Memory lives client-side: `src/features/ask-ai/lib/memory/` holds the
  pure seam (`conversation-memory.ts`: `loadMemory` / `saveMemory` /
  `addSummary` / `updatePreferences` / `buildMemoryContext` /
  `summarizeConversation`) and the connector
  (`use-conversation-memory.ts`), which the Ask AI panel consumes — every
  request carries `buildMemoryContext()` in the request body (capped at 3000
  chars in the route) and `onFinish` persists a real summary per
  conversation via `summarizeConversation` + `addSummary`. The route embeds
  the pre-formatted block verbatim in the system prompt (`buildSystemPrompt`
  `memoryContext` option). Do not resurrect the server-side summarization
  call; memory is a client-seam feature.
- **Telemetry seam** (`src/features/ask-ai/lib/telemetry.ts`): the single home for the
  copilot telemetry event vocabulary (`ask_ai_*`, Fase 5 enterprise). One
  entry point `emitAskAiEvent()` with an injectable transport (tests) and a
  default serverless transport: structured JSON line to stdout + Sentry
  capture for `ask_ai_error` events. Events are emitted at the orchestration
  boundary — the route emits `ask_ai_rag_retrieved`, `ask_ai_stream_started`,
  `ask_ai_stream_completed`, `ask_ai_tool_called` (via the `withToolTelemetry`
  wrapper) and `ask_ai_error`; the pure seams (retriever, model pool, tools)
  stay side-effect-free — the pool only forwards an `onFinish` hook with the
  data only it can observe (winning model, usage, finishReason). Client events
  (`ask_ai_opened`, `ask_ai_message_sent`) go through `trackAiEvent` in
  `src/lib/observability/posthog.ts` from `AskAIPanel`. Do not re-suggest
  emitting telemetry from inside the seams or replacing the stdout transport
  with a vendor-specific one.
- **CI/CD pipeline** (`.github/workflows/ci.yml`): cuatro jobs —
  `validate` (lint, typecheck, test, **audit**, build) abre la rama; de ahí
  cuelgan en paralelo `lighthouse` (budgets de perf/a11y/best-practices/SEO
  sobre `/`, `/recursos` y `/estadisticas`) y `e2e` (Playwright contra el
  build de producción); `deploy` espera a `validate` + `e2e`. Corren en push a
  main/develop y PRs a main; `deploy` es
  **hard-fail** si el project ID de Vercel no es
  `prj_KmY2dJJgbui7LhuQyxZPKTU08T1h` (nunca desplegar a otro proyecto).
  Despliega a **producción en Vercel en cada push a main** usando el CLI
  (`vercel pull --environment=production` → `vercel build --prod` →
  `vercel deploy --prebuilt --prod`), con `--prebuilt` para no duplicar el
  build (compila en el runner, sube solo `.vercel/output`). El único secret
  requerido es `VERCEL_TOKEN`; las env vars de runtime se configuran en el
  dashboard de Vercel (Production) y `vercel pull` las baja al build. También
  disparable manualmente (`workflow_dispatch` sobre main).
  ⚠️ **Estado actual**: el gate de seguridad está **verde**. El audit se
  parte en dos capas: `npm audit --omit=dev --audit-level=moderate` (la
  superficie real de producción) **bloquea**, y en el árbol completo solo
  bloquea un advisory **crítico**; el resto se emite como `::warning::`.
  Inventario verificado (22 de octubre de 2026): **16 avisos en el árbol
  completo (8 low, 8 high, 0 moderate, 0 critical)** — los 8 high son un
  solo advisory (`braces`) replicado en 8 nodos, sin parche upstream
  publicado; en producción (`--omit=dev`): **8 low, 0 high, 0 moderate, 0
  critical**. Ver `README.md` → "Deuda técnica conocida" y
  `docs/adr/ADR-001-production-hardening.md`.
  Do not re-suggest GitHub Pages: la app necesita un runtime Node (API routes
  del copilot, chat y contacto); el deploy pasa por un host con runtime
  (Vercel).

