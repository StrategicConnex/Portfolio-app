/**
 * FREE-first model routing for the Ask AI Copilot orchestration seam.
 *
 * Port of the SC Platform Universal AI policy (`orchestrator/router.py` +
 * `docs/ROUTING_POLICY.md`) to pure TypeScript. Decided in ADR-004.
 *
 * Policy implemented here (1, 2, 3, 5):
 *   1. Try highest-ranked FREE candidate first.
 *   2. Retry transient failures within a total attempt budget.
 *   3. Move through FREE candidates in score order.
 *   4. (paid) — appended after free candidates.
 *   5. Record model, latency, success and fallback reason per attempt.
 *
 * NOT implemented (deferred in ADR-004): quality threshold (4) and mid-stream
 * fallback (6) — both touch the sacred streaming contract.
 *
 * The pool format is backwards compatible: entries are comma-separated model
 * ids; an optional NUMERIC score suffix (`model:free:9` or `model:9`) is
 * parsed as score — `:free` (non-numeric) never collides.
 */

export interface Candidate {
  provider: string;
  model: string;
  score: number;
}

export interface RoutingConfig {
  /** Comma-separated free model pool (existing `OPENROUTER_MODEL_POOL` format). */
  freePool?: string;
  /** Paid fallback model id (only used after free candidates are exhausted). */
  paidModel?: string;
  /** Retries per model on transient errors. Default: 1. */
  maxRetriesPerModel?: number;
  /** Hard cap on total streamText attempts across the whole request. Default: 6. */
  maxTotalAttempts?: number;
  /** Telemetry sink. Default: structured console logging. */
  logger?: RoutingLogger;
}

export type FallbackReason =
  | 'none'
  | 'transient'
  | 'transient-retry-exhausted'
  | 'permanent-error'
  | 'pool-exhausted';

export interface AttemptStep {
  modelId: string;
  attempt: number;
  isRetry: boolean;
  /** Set by the caller after the attempt: `true` → transient failure (retry allowed). */
  transient?: boolean;
}

export interface RoutingAttemptLog {
  model: string;
  attempt: number;
  isRetry: boolean;
  ok: boolean;
  latencyMs: number;
  reason: FallbackReason;
}

export type RoutingLogger = (entry: RoutingAttemptLog) => void;

// ─── Parsing ────────────────────────────────────────────────────────────────

const SCORE_SUFFIX = /^(.+):(\d+(?:\.\d+)?)$/;

/**
 * Parse a comma-separated model pool. Backwards compatible with the existing
 * `OPENROUTER_MODEL_POOL` format (`:free` suffix stays part of the model id).
 * A numeric trailing segment (`model:free:9` or `model:9`) is a score.
 */
export function parsePool(rawPool: string | undefined): Candidate[] {
  if (!rawPool) return [];
  return rawPool
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((entry) => {
      const m = SCORE_SUFFIX.exec(entry);
      if (m) {
        return { provider: m[1], model: m[1], score: Number(m[2]) };
      }
      return { provider: entry, model: entry, score: 0 };
    });
}

// ─── Planning ───────────────────────────────────────────────────────────────

/**
 * Plan = free candidates sorted by score (desc) + paid fallback last.
 * Exact TS mirror of `FreeFirstRouter.route_plan()` in the SC skill.
 */
export function routePlan(
  free: Candidate[],
  paidModel: string | undefined,
): string[] {
  const paid = paidModel ? [paidModel] : [];
  return [
    ...[...free].sort((a, b) => b.score - a.score).map((c) => c.model),
    ...paid,
  ];
}

// ─── Transient error classification ─────────────────────────────────────────

const TRANSIENT_RE =
  /(rate.?limit|too many requests|quota|429|timeout|timed out|etimedout|econnreset|econnrefused|socket hang up|fetch failed|network error|undici|502|503|504|\b5\d{2}\b|abort)/i;

/**
 * Classify an error as transient (worth a retry within budget) vs permanent.
 * Matches: 5xx HTTP, network errors, timeouts, aborts, rate limits (free-tier
 * capacity is shared → a single budget-bound retry is safe).
 */
export function isTransientError(err: unknown): boolean {
  // Structural check (name/message/status) — environment-agnostic: a DOMException
  // or provider error object is not always an `instanceof Error`.
  if (!err || typeof err !== 'object') return false;
  const name = String((err as { name?: unknown }).name ?? '').toLowerCase();
  const message = String((err as { message?: unknown }).message ?? '');
  if (name === 'aborterror' || name === 'timeouterror') return true;
  if (TRANSIENT_RE.test(`${name}: ${message}`)) return true;
  const status = (err as { status?: unknown }).status;
  if (typeof status === 'number' && (status === 429 || (status >= 500 && status < 600))) {
    return true;
  }
  return false;
}

// ─── Attempt sequencing (retry within budget) ───────────────────────────────

export interface AttemptOptions {
  maxRetriesPerModel?: number;
  maxTotalAttempts?: number;
}

/**
 * Yield attempt steps across the plan, honoring:
 *  - 1 retry per model ONLY when the caller marks the failure `transient`;
 *  - a hard cap on total attempts (budget, default 6).
 *
 * Contract: after each yielded step the caller either returns (success) or
 * sets `step.transient` based on the failure and lets the loop continue.
 * A permanent failure skips the model's remaining retries and moves on.
 */
export function* iterateAttempts(
  plan: string[],
  opts: AttemptOptions = {},
): Generator<AttemptStep> {
  const maxRetries = opts.maxRetriesPerModel ?? 1;
  const maxTotal = opts.maxTotalAttempts ?? 6;
  let used = 0;

  outer: for (const modelId of plan) {
    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      if (used >= maxTotal) break outer;
      used++;
      const step: AttemptStep = { modelId, attempt, isRetry: attempt > 1 };
      yield step;
      if (step.transient !== true) continue outer; // permanent → next model
    }
  }
}

// ─── Telemetry ──────────────────────────────────────────────────────────────

/** Structured console telemetry (one JSON line per attempt). */
export function consoleRoutingLogger(entry: RoutingAttemptLog): void {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    ...entry,
  });
  if (entry.ok) {
    console.info(`[AskAI][Routing] ${line}`);
  } else {
    console.warn(`[AskAI][Routing] ${line}`);
  }
}

// ─── Router facade (consumed by the route seam) ─────────────────────────────

export class FreeFirstRouter {
  private readonly cfg: Required<Pick<RoutingConfig, 'maxRetriesPerModel' | 'maxTotalAttempts'>> &
    RoutingConfig;

  constructor(cfg: RoutingConfig = {}) {
    this.cfg = {
      maxRetriesPerModel: 1,
      maxTotalAttempts: 6,
      logger: consoleRoutingLogger,
      ...cfg,
    };
  }

  /** Ordered model ids: free by score desc + paid last. */
  routePlan(): string[] {
    return routePlan(parsePool(this.cfg.freePool), this.cfg.paidModel);
  }

  /** Iterate the plan with retry-on-transient within the attempt budget. */
  iterate(): Generator<AttemptStep> {
    return iterateAttempts(this.routePlan(), {
      maxRetriesPerModel: this.cfg.maxRetriesPerModel,
      maxTotalAttempts: this.cfg.maxTotalAttempts,
    });
  }

  /** Record an attempt; never throws (telemetry must not break routing). */
  log(entry: RoutingAttemptLog): void {
    try {
      this.cfg.logger?.(entry);
    } catch {
      // telemetry is best-effort
    }
  }
}
