/**
 * Telemetry seam for the Ask Juan AI copilot (Fase 5 — enterprise hardening).
 *
 * The single home for the copilot's telemetry event vocabulary (section 14 of
 * the enterprise plan). One entry point — `emitAskAiEvent()` — routes events
 * to an injectable transport (tests) or to the default transport: a structured
 * JSON line on stdout (serverless-native, zero dependencies, drains into the
 * host's log pipeline) plus a Sentry capture for `ask_ai_error` events when a
 * DSN is configured.
 *
 * Emission points live at the orchestration boundary (the `/api/ask-ai`
 * route), never inside the pure seams: the retriever, the model pool and the
 * tools stay side-effect-free. The pool only *forwards* an `onFinish` hook
 * with the data only it can observe (winning model, usage, finish reason).
 */
import type { ToolSet } from 'ai';
import { captureError } from '@/lib/observability/sentry';

// ─── Event vocabulary ───────────────────────────────────────────────────────

export type AskAiEventName =
  | 'ask_ai_stream_started'
  | 'ask_ai_stream_completed'
  | 'ask_ai_tool_called'
  | 'ask_ai_rag_retrieved'
  | 'ask_ai_error';

export interface AskAiEventProps {
  [key: string]: unknown;
}

// ─── Transport ──────────────────────────────────────────────────────────────

export interface AskAiTelemetryTransport {
  emit(name: AskAiEventName, props: AskAiEventProps): void;
}

let transport: AskAiTelemetryTransport | null = null;

/**
 * Inject a transport for tests (or `null` to restore the default).
 * The route never sets this — production always uses the default transport.
 */
export function setTelemetryTransport(next: AskAiTelemetryTransport | null): void {
  transport = next;
}

/** Human-readable error message regardless of the thrown shape. */
export function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function defaultEmit(name: AskAiEventName, props: AskAiEventProps): void {
  // Structured JSON line to stdout — the serverless-native sink. The host
  // (Vercel) drains it into the project's log pipeline.
  console.log(JSON.stringify({ event: name, ts: Date.now(), ...props }));

  // Errors also reach Sentry when a DSN is configured (the observability
  // seam no-ops without it).
  if (name === 'ask_ai_error') {
    captureError(
      new Error(messageOf(props.error ?? props.providerError ?? props.status ?? name)),
      {
        stage: props.stage,
        status: props.status,
        modelId: props.modelId,
        providerError: props.providerError,
      },
    );
  }
}

/** Emit a copilot telemetry event through the active transport. */
export function emitAskAiEvent(name: AskAiEventName, props: AskAiEventProps): void {
  if (transport) {
    try {
      transport.emit(name, props);
      return;
    } catch {
      // A broken test transport must not break the request — fall through.
    }
  }
  defaultEmit(name, props);
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Stable short hash of the retrieval query — lets analytics correlate
 * `ask_ai_rag_retrieved` events without logging raw user text.
 */
export function hashQuery(query: string): string {
  let hash = 0x811c9dc5; // FNV-1a 32-bit offset basis
  const text = query.trim().toLowerCase();
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16);
}

/** The registry's tools never throw — failures come back as `{ error }`. */
function hasToolError(output: unknown): boolean {
  return (
    typeof output === 'object' &&
    output !== null &&
    'error' in output &&
    Boolean((output as { error?: unknown }).error)
  );
}

/**
 * Wrap the tool registry so every execution emits `ask_ai_tool_called` with
 * the tool name, its latency and its status (an `{ error }`-shaped result
 * counts as a failure, matching how the registry reports tool errors).
 * The wrapped set keeps the same descriptions/schemas — only `execute` is
 * instrumented.
 */
export function withToolTelemetry(tools: ToolSet): ToolSet {
  const wrapped: Record<string, unknown> = {};
  for (const [name, tool] of Object.entries(tools)) {
    const anyTool = tool as unknown as {
      description?: string;
      inputSchema?: unknown;
      execute: (input: unknown, options?: unknown) => Promise<unknown>;
    };
    wrapped[name] = {
      description: anyTool.description,
      inputSchema: anyTool.inputSchema,
      execute: async (input: unknown, options?: unknown) => {
        const startedAt = Date.now();
        try {
          const output = await anyTool.execute(input, options);
          const failed = hasToolError(output);
          emitAskAiEvent('ask_ai_tool_called', {
            toolName: name,
            status: failed ? 'error' : 'ok',
            latencyMs: Date.now() - startedAt,
            errorCode: failed
              ? messageOf((output as { error?: unknown }).error).slice(0, 120)
              : undefined,
          });
          return output;
        } catch (error) {
          emitAskAiEvent('ask_ai_tool_called', {
            toolName: name,
            status: 'error',
            latencyMs: Date.now() - startedAt,
            errorCode: messageOf(error).slice(0, 120),
          });
          throw error;
        }
      },
    };
  }
  return wrapped as unknown as ToolSet;
}
