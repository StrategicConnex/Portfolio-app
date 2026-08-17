# CONTEXT.md — Domain Glossary

Terms that name good seams in this codebase. Architecture reviews should use
these names instead of inventing new ones, and should not re-suggest seams
that are already recorded here.

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

## RAG / Ask Juan AI

- **Retrieval seam** (`src/lib/ask-ai/rag/retriever.ts`): the single module
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
- **Tokenizer primitive** (`src/lib/ask-ai/rag/tokenizer.ts`): single home
  for `tokenize()` and `STOP_WORDS` — the shared language rule for all
  retrieval scoring. The accented-question-word gap (`qué` matching
  `neuquén` by substring) is fixed — question words are stop words. Known
  remaining limitation (pre-existing): TF-without-IDF prefers short
  documents; a future ranking pass may address it, but it is not a seam
  defect.
- **Knowledge corpus projection** (`src/lib/ask-ai/rag/sources.ts`): the
  corpus is *derived*, not duplicated (candidate C2, now closed). Profile,
  experience, SIEM, compliance, blog and case-study entries are projected
  from the live content modules (`src/data/*`) and the translation
  dictionaries, so editing the page updates the copilot by construction;
  contact, stack, certifications and services live in the explicit MANUAL
  registry (their data has no page source). The corpus is fully per-locale:
  every entry is `es` or `en` (no `both` with Spanish content for English
  users) and every `es` entry has an `-en` sibling. Do not re-suggest a
  hand-maintained mirror or merging locales back into `both`.

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

- **Prompt builder** (`src/lib/ask-ai/prompt/system-prompt.ts`): the single
  home for the copilot system-prompt assembly. `buildSystemPrompt()` composes
  the language/mode headers, the RAG context block (from the retrieval seam),
  the behavior rules and the passive-analysis tool guide;
  `buildToolDescriptions()` renders the six-tool guide per locale. The route
  must not inline prompt templates anymore.
- **Model pool** (`src/lib/ask-ai/model-pool.ts`): the only place that
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
  (`src/lib/ask-ai/pool-health.ts`, localStorage key `ask-ai-failed-models`,
  24h TTL): failed models start skipped on the next visit and the list
  self-heals as entries expire. Do not re-suggest inlining model selection
  in the route, and do not re-suggest adding a paid fallback.
- **Conversation memory** (connected to the client seam): the server-side
  summarization call (`generateConversationSummary` / `shouldSummarize`) was
  **deleted** in C5 — it ran in the ask-ai route and its result was
  discarded. Memory lives client-side: `src/lib/ask-ai/memory/` holds the
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

