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
  HtmlLangUpdater) and 3D/canvas visuals.
- `src/lib/` — **shared seams only** (language, rate-limit, server-i18n,
  theme, observability, utils, constants): code used by more than one
  feature. Do not grow feature logic here.
- `src/components/` — shared kernel only: `ui/` (shadcn primitives +
  SectionHeader/FadeIn/Icon) and `observability/`. Feature components do not
  live here.
- `src/app/` — routes only; pages/route handlers compose features and must
  not hold domain logic. `src/data/` — content (consumed by features and by
  the ask-ai corpus projection).
- `src/context/` — React context providers and the i18n/theme dictionaries:
  `LanguageContext.tsx`, `ThemeContext.tsx` and `translations/` (22
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
  ⚠️ **Estado actual**: el paso `npm audit --audit-level=moderate` de
  `validate` sale con código 1 (37 avisos: 1 critical, 15 high, 13 moderate,
  8 low), por lo que `lighthouse`, `e2e` y `deploy` quedan **skipped** y el
  deploy está bloqueado. Varios overrides de `package.json` fijan versiones
  **dentro** del rango afectado. Ver `README.md` → "Deuda técnica conocida" y
  `docs/adr/ADR-001-production-hardening.md`.
  Do not re-suggest GitHub Pages: la app necesita un runtime Node (API routes
  del copilot, chat y contacto); el deploy pasa por un host con runtime
  (Vercel).

