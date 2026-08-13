/**
 * Bounded mid-stream fallback for the Ask AI Copilot orchestration seam.
 *
 * Decided in ADR-005 (supersedes the ADR-004 deferral of gap 6): model
 * selection moves INSIDE the stream, so a provider that fails mid-stream
 * (429/5xx/network on the shared free pool) can fall back to the next attempt
 * within the same budget used for pre-stream failures.
 *
 * Contract:
 *  - The `streamText(...)` CALL stays byte-identical; only the response
 *    assembly changes (`createUIMessageStreamResponse` over this wrapper).
 *  - The UI `start` chunk is emitted LAZILY, exactly once, when a model
 *    confirms real content — a model that dies before content is invisible
 *    to the client.
 *  - Pre-content failure  → fall back to the next attempt (transient retry
 *    rules + total budget shared with `iterateAttempts`).
 *  - Post-content failure → emit an `error` chunk and end. No restart: it
 *    would duplicate/concatenate partial output (bounded frontier, ADR-005).
 *  - Cancellation (client stop) propagates to the active model reader.
 */

import { toUIMessageChunk, type TextStreamPart, type ToolSet, type UIMessageChunk } from 'ai';
import { isTransientError, iterateAttempts, type FallbackReason, type RoutingAttemptLog } from './freeFirst';

export interface MidStreamFallbackOptions {
  /** Ordered model ids — typically `router.routePlan()`. */
  plan: string[];
  /** Retries per model on transient errors. Default: 1 (shared with ADR-004). */
  maxRetriesPerModel?: number;
  /** Hard cap on total attempts across the whole request. Default: 6 (shared). */
  maxTotalAttempts?: number;
  /** Creates the model's `TextStreamPart` stream (`streamText(...).stream`). */
  makeStream: (modelId: string) => ReadableStream<TextStreamPart<ToolSet>>;
  /** Telemetry sink — same contract as `FreeFirstRouter.log`. */
  onAttempt?: (entry: RoutingAttemptLog) => void;
  /** Maps a fatal error to client-safe text. Default: SDK default. */
  onError?: (error: unknown) => string;
}

interface ActiveAttempt {
  step: { modelId: string; attempt: number; isRetry: boolean; transient?: boolean };
  reader: ReadableStreamDefaultReader<TextStreamPart<ToolSet>>;
  modelId: string;
  attempt: number;
  isRetry: boolean;
  startedAt: number;
  committed: boolean;
}

const DEFAULT_MAX_RETRIES = 1;
const DEFAULT_MAX_TOTAL = 6;
const SDK_DEFAULT_ERROR_TEXT = () => 'An error occurred.';

function reasonFor(transient: boolean, isRetry: boolean): FallbackReason {
  return transient ? (isRetry ? 'transient-retry-exhausted' : 'transient') : 'permanent-error';
}

/**
 * Build a UI-message-chunk stream that runs the attempt loop and falls back
 * between models WITHOUT leaking failed models to the client.
 */
export function withMidStreamFallback(opts: MidStreamFallbackOptions): ReadableStream<UIMessageChunk> {
  const {
    plan,
    makeStream,
    maxRetriesPerModel = DEFAULT_MAX_RETRIES,
    maxTotalAttempts = DEFAULT_MAX_TOTAL,
    onAttempt,
    onError = SDK_DEFAULT_ERROR_TEXT,
  } = opts;

  const attempts = iterateAttempts(plan, { maxRetriesPerModel, maxTotalAttempts });
  let active: ActiveAttempt | null = null;
  let lastError: unknown = null;
  let cancelled = false;

  const safeEnqueue = (controller: ReadableStreamDefaultController<UIMessageChunk>, chunk: UIMessageChunk) => {
    if (!cancelled) controller.enqueue(chunk);
  };

  const log = (entry: RoutingAttemptLog) => {
    try {
      onAttempt?.(entry);
    } catch {
      // telemetry is best-effort
    }
  };

  const finishActive = (a: ActiveAttempt, ok: boolean, reason: FallbackReason, errorText?: string) => {
    active = null;
    log({
      model: a.modelId,
      attempt: a.attempt,
      isRetry: a.isRetry,
      ok,
      latencyMs: Date.now() - a.startedAt,
      reason,
      ...(errorText != null ? { errorText } : {}),
    });
  };

  /** Short error description for telemetry (ops diagnosis, never sent to the client). */
  const describeError = (err: unknown): string => {
    const text = err instanceof Error ? err.message : String(err);
    return text.length > 300 ? `${text.slice(0, 297)}…` : text;
  };

  return new ReadableStream<UIMessageChunk>({
    async pull(controller) {
      while (true) {
        if (cancelled) return;

        // ─── Start the next attempt (or exhaust the budget) ────────────────────
        if (active == null) {
          const next = attempts.next();
          if (next.done) {
            // Budget exhausted with no committed model → error chunk, then end.
            const errorText = onError(lastError ?? new Error('No model available'));
            safeEnqueue(controller, { type: 'error', errorText });
            controller.close();
            return;
          }
          const s = next.value;
          const startedAt = Date.now();
          try {
            const stream = makeStream(s.modelId);
            active = {
              step: s,
              reader: stream.getReader(),
              modelId: s.modelId,
              attempt: s.attempt,
              isRetry: s.isRetry,
              startedAt,
              committed: false,
            };
          } catch (error) {
            // Synchronous create failure (the SDK is lazy, so this is rare).
            lastError = error;
            const transient = isTransientError(error);
            s.transient = transient;
            log({
              model: s.modelId,
              attempt: s.attempt,
              isRetry: s.isRetry,
              ok: false,
              latencyMs: Date.now() - startedAt,
              reason: reasonFor(transient, s.isRetry),
              errorText: describeError(error),
            });
            continue;
          }
        }

        const a = active;

        // ─── Read one part from the active model ────────────────────────────────
        let part!: TextStreamPart<ToolSet>;
        let readError: unknown = null;
        try {
          const read = await a.reader.read();
          if (read.done) {
            // Clean end: the model completed (or was aborted). Commit if it never
            // produced content so the client still gets a message, then finish.
            if (!a.committed && !cancelled) {
              a.committed = true;
              safeEnqueue(controller, { type: 'start' });
            }
            finishActive(a, true, 'none');
            controller.close();
            return;
          }
          part = read.value;
        } catch (error) {
          readError = error;
        }

        if (readError != null) {
          if (cancelled) return;
          const transient = isTransientError(readError);
          a.step.transient = transient;
          if (a.committed) {
            // Post-content failure → bounded frontier: error chunk + end.
            lastError = readError;
            safeEnqueue(controller, { type: 'error', errorText: onError(readError) });
            finishActive(a, false, 'mid-stream-error', describeError(readError));
            console.warn('[AskAI][MidStream] post-content failure:', readError);
            controller.close();
            return;
          }
          // Pre-content failure → fall back to the next attempt.
          lastError = readError;
          finishActive(a, false, reasonFor(transient, a.isRetry), describeError(readError));
          try {
            await a.reader.cancel();
          } catch {
            // already closed/errored — best effort
          }
          continue;
        }

        // ─── Part-level handling ────────────────────────────────────────────────
        if (part.type === 'start') {
          // SDK scaffolding emitted before the fetch; NOT content. Skip it and
          // keep waiting — a 429 lands right after this as an error part/throw.
          continue;
        }

        if (part.type === 'error') {
          const err = part.error;
          if (cancelled) return;
          const transient = isTransientError(err);
          a.step.transient = transient;
          if (a.committed) {
            lastError = err;
            safeEnqueue(controller, { type: 'error', errorText: onError(err) });
            finishActive(a, false, 'mid-stream-error', describeError(err));
            console.warn('[AskAI][MidStream] post-content error part:', err);
            controller.close();
            return;
          }
          // Pre-content error part → fall back (the stream closes right after).
          lastError = err;
          finishActive(a, false, reasonFor(transient, a.isRetry), describeError(err));
          continue;
        }

        if (!a.committed) {
          // First real content from this model → commit: emit the single `start`.
          a.committed = true;
          safeEnqueue(controller, { type: 'start' });
        }

        const chunk = toUIMessageChunk(part, { sendStart: false, onError });
        if (chunk != null) safeEnqueue(controller, chunk);
        return; // backpressure: one part per pull
      }
    },
    cancel(reason) {
      cancelled = true;
      const a = active;
      active = null;
      return a?.reader.cancel(reason) ?? Promise.resolve();
    },
  });
}
