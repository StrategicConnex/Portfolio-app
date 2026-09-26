/**
 * Model pool with a real fallback (candidate C5), FREE-ONLY.
 *
 * The old route looped over models wrapping `streamText(...)` in try/catch —
 * but `streamText()` does not throw at call time: provider errors (auth,
 * model unavailable, upstream 5xx) surface only once the stream starts, so
 * the loop always returned the first model's stream and the fallback was
 * illusory. This module reads the FIRST chunk of the UI-message stream
 * before committing: if the read rejects, the stream ends empty, or the
 * first event is an SSE `{"type":"error",...}` (how the `ai` SDK reports a
 * startup failure), the model counts as failed and the pool moves on.
 * Errors mid-stream (after the first chunk) are not retried server-side —
 * that would require buffering; the client auto-retries with `skipModels`.
 *
 * Rate limits: OpenRouter free endpoints are throttled (20 req/min account
 * tier, tighter per-model caps), so a 429 at stream start is expected under
 * load. A rate-limited model is NOT skipped straight away: it is queued for
 * retry with exponential backoff (±50% jitter) before the pool advances,
 * bounded by a global budget so the whole pool stays well inside the
 * route's `maxDuration`. Only after the retries are exhausted does the
 * pool move to the next model.
 *
 * "Always free" is a code invariant, not a convention: `buildFreeModelPool()`
 * drops every entry that is not a `:free` OpenRouter endpoint (or the
 * `openrouter/free` router), so a misconfigured env var can never spend
 * money. If the sanitized pool is empty, it throws `ModelPoolError` — the
 * route answers 503 instead of falling back to a paid model.
 */

import { streamText, type ModelMessage, type ToolSet } from 'ai';

// ─── Free-only pool configuration ───────────────────────────────────────────

/**
 * Curated, chat-capable `:free` endpoints, ordered by fit for the copilot.
 * NOTE: the free catalog churns — a delisted model answers 404 and burns a
 * pool slot until it is removed, so re-verify this list against the live
 * OpenRouter free collection when editing the default.
 */
export const DEFAULT_FREE_MODEL_POOL = [
  'nvidia/nemotron-3-super-120b-a12b:free', // general + agent
  'openai/gpt-oss-20b:free', // reasoning
  'cohere/north-mini-code:free', // code + tool use
  'google/gemma-4-31b-it:free', // multimodal general
  'google/gemma-4-26b-a4b-it:free', // multimodal general
  'openrouter/free', // router safety net (last resort)
].join(',');

/**
 * Keep only free endpoints: `:free`-suffixed ids and the `openrouter/free`
 * router. Anything else is dropped with a warning — this is the guarantee
 * that the copilot never pays for inference.
 */
export function sanitizeFreePool(models: string[]): string[] {
  const kept: string[] = [];
  for (const id of models) {
    if (id === 'openrouter/free' || id.endsWith(':free')) {
      if (!kept.includes(id)) kept.push(id);
    } else {
      console.warn(`[AskAI] Dropping non-free model from pool: ${id} (free-only policy)`);
    }
  }
  return kept;
}

export interface BuildFreeModelPoolOptions {
  /**
   * Model ids to exclude from the pool — the client sends the ids that
   * failed mid-stream so an auto-retry lands on a different model.
   */
  skip?: string[];
}

/**
 * Parse the configured pool (comma-separated) and enforce the free-only
 * invariant, optionally excluding models that already failed this session.
 * Throws `ModelPoolError` when nothing survives.
 */
export function buildFreeModelPool(
  configured?: string,
  options: BuildFreeModelPoolOptions = {},
): string[] {
  const raw = (configured || DEFAULT_FREE_MODEL_POOL)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  let pool = sanitizeFreePool(raw);

  const skip = new Set(options.skip ?? []);
  if (skip.size > 0) {
    pool = pool.filter((id) => !skip.has(id));
  }

  if (pool.length === 0) {
    throw new ModelPoolError(
      'Configured pool has no :free models — refusing to fall back to paid models',
    );
  }
  return pool;
}

export interface StreamWithFallbackOptions {
  /** Returns a model instance for the given model id. */
  model: (modelId: string) => Parameters<typeof streamText>[0]['model'];
  /** Model messages — call `convertToModelMessages()` before pooling. */
  messages: ModelMessage[];
  tools: ToolSet;
  maxOutputTokens: number;
  system: string;
  /**
   * Called with the winning model id and its 1-based index in the pool
   * (1 = the first model answered, no fallback); the returned object is
   * sent to the client as UI-message-stream metadata (powers the model
   * badge in the panel). Omit to send no metadata.
   */
  messageMetadata?: (
    modelId: string,
    attemptIndex: number,
  ) => Record<string, unknown> | undefined;
  /**
   * Called when the committed stream finishes (all steps complete), with the
   * usage/finish data only the stream can observe. Forwards the ai SDK's
   * `onFinish` event — the pool itself stays side-effect free (telemetry is
   * emitted by the caller).
   */
  onFinish?: (info: PoolStreamFinishInfo) => void;
}

/** Data handed to the `onFinish` hook once the committed stream ends. */
export interface PoolStreamFinishInfo {
  modelId: string;
  /** 1-based position of the winning model in the pool. */
  attemptIndex: number;
  usage: { promptTokens?: number; completionTokens?: number; totalTokens?: number } | undefined;
  finishReason: string | undefined;
  /** Milliseconds from the `streamText` call to the stream end. */
  totalMs: number;
}

export interface StreamWithFallbackResult {
  /** The streamed response, committed to the first model that started cleanly. */
  response: Response;
  /** The model id that won the pool — exposed for observability and the client badge. */
  modelId: string;
  /** 1-based position of the winning model in the pool (1 = no fallback). */
  attemptIndex: number;
}

/** Thrown when every model in the pool failed to start its stream. */
export class ModelPoolError extends Error {
  override readonly cause: unknown;

  constructor(
    cause: unknown,
    message = 'All models in the pool failed to start their stream',
  ) {
    super(message);
    this.name = 'ModelPoolError';
    this.cause = cause;
  }
}

/** The ai SDK serializes stream errors as SSE events with this marker. */
const SSE_ERROR_MARKER = '"type":"error"';

/**
 * UI-stream events the SDK emits SYNCHRONOUSLY when the stream is created,
 * before the upstream provider has answered at all. They prove nothing about
 * the model — the provider's answer (or its 404/429/5xx failure) arrives in
 * later events.
 */
const SYNTHETIC_START_TYPES = new Set([
  'start',
  'start-step',
  'text-start',
  'reasoning-start',
]);

/**
 * True once the accumulated SSE text contains an event beyond the synthetic
 * start sequence — a text delta, tool call, finish, error, ... — i.e. the
 * upstream provider actually responded.
 */
function hasRealEvent(accumulated: string): boolean {
  const types = [...accumulated.matchAll(/"type":"([a-z-]+)"/g)].map((m) => m[1]);
  return types.some((type) => !SYNTHETIC_START_TYPES.has(type));
}

// ─── Rate-limit retry queue ─────────────────────────────────────────────────
// A 429 at stream start queues the model for retry with exponential backoff
// instead of jumping straight to the next one. The global budget caps the
// total waiting time across the pool so the request stays within the route's
// `maxDuration` (30s).

const RATE_LIMIT_RETRY = {
  /** Extra attempts per rate-limited model (1 initial + these). */
  maxRetries: 2,
  /** First backoff delay, doubled per retry with ±50% jitter. */
  baseDelayMs: 600,
  /** Global cap on total backoff time across the whole pool. */
  maxTotalDelayMs: 5000,
};

function isRateLimitError(error: unknown): boolean {
  const detail = error instanceof Error ? error.message : String(error);
  return /429|rate\s*limit/i.test(detail);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Validate that a UI-message stream response actually started: read chunks
 * until the upstream provider responds with a REAL event (text delta, tool
 * call, finish, ...) or an error event, throwing on error/EOF so the pool
 * falls through. The first chunk only contains the SDK's synchronous
 * `start`/`text-start` events — a dead model (delisted 404, upstream 429)
 * fails in a LATER event, so reading just one chunk would commit the pool
 * to a model that never answers. All buffered chunks are re-emitted so the
 * caller still receives a standard `Response`.
 */
async function ensureStreamStarts(response: Response): Promise<Response> {
  const body = response.body;
  if (!body) {
    throw new Error('Model response has no body');
  }

  const reader = body.getReader();
  const buffered: Uint8Array[] = [];
  let accumulated = '';

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) {
        throw new Error('Model stream ended before producing any data');
      }
      buffered.push(value);
      accumulated += new TextDecoder().decode(value);

      if (accumulated.includes(SSE_ERROR_MARKER)) {
        throw new Error('Model stream started with an error event');
      }
      if (hasRealEvent(accumulated)) {
        break;
      }
    }
  } catch (error) {
    reader.releaseLock();
    throw error;
  }

  const rest = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of buffered) {
        controller.enqueue(chunk);
      }
      void (async () => {
        try {
          for (;;) {
            const { done, value } = await reader.read();
            if (done) {
              controller.close();
              break;
            }
            controller.enqueue(value);
          }
        } catch (error) {
          controller.error(error);
        }
      })();
    },
    cancel() {
      void reader.cancel();
    },
  });

  return new Response(rest, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}

/**
 * Try each model in order and return the first one whose stream starts
 * cleanly. A rate-limited model (429) is retried with backoff before the
 * pool advances; other failures move on immediately. Throws
 * `ModelPoolError` when all models fail.
 */
export async function streamWithFallback(
  models: string[],
  options: StreamWithFallbackOptions,
): Promise<StreamWithFallbackResult> {
  let lastError: unknown;
  let backoffBudget = RATE_LIMIT_RETRY.maxTotalDelayMs;
  let attemptIndex = 0;

  for (const modelId of models) {
    attemptIndex += 1;
    const currentAttempt = attemptIndex;
    let attempts = 0;
    let backoffMs = RATE_LIMIT_RETRY.baseDelayMs;

    while (attempts <= RATE_LIMIT_RETRY.maxRetries) {
      attempts += 1;
      try {
        const startedAt = Date.now();
        const result = streamText({
          model: options.model(modelId),
          messages: options.messages,
          tools: options.tools,
          maxOutputTokens: options.maxOutputTokens,
          system: options.system,
          onFinish: (event) => {
            options.onFinish?.({
              modelId,
              attemptIndex: currentAttempt,
              usage: event.usage,
              finishReason: event.finishReason,
              totalMs: Date.now() - startedAt,
            });
          },
        });
        const response = await ensureStreamStarts(
          result.toUIMessageStreamResponse({
            messageMetadata: () => options.messageMetadata?.(modelId, currentAttempt),
          }),
        );
        return { response, modelId, attemptIndex: currentAttempt };
      } catch (error) {
        lastError = error;
        const detail = error instanceof Error ? error.message : String(error);
        const rateLimited = isRateLimitError(error);

        if (!rateLimited || attempts > RATE_LIMIT_RETRY.maxRetries || backoffBudget <= 0) {
          console.warn(
            attempts > 1
              ? `[AskAI] Model ${modelId} failed after ${attempts} attempts: ${detail}`
              : rateLimited
                ? `[AskAI] Model ${modelId} rate-limited, backoff budget exhausted: ${detail}`
                : `[AskAI] Model ${modelId} failed: ${detail}`,
          );
          break; // next model in the pool
        }

        // Rate-limited: queue the model for retry with backoff (±50% jitter).
        const jittered = Math.round(backoffMs * (0.5 + Math.random() * 0.5));
        const delay = Math.min(jittered, backoffBudget);
        backoffBudget -= delay;
        console.warn(
          `[AskAI] Model ${modelId} rate-limited, retrying in ${delay}ms (attempt ${attempts}/${RATE_LIMIT_RETRY.maxRetries + 1})`,
        );
        await sleep(delay);
        backoffMs *= 2;
      }
    }
  }

  throw new ModelPoolError(lastError);
}
