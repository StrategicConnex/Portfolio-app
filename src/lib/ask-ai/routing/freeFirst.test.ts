import { describe, expect, it, vi } from 'vitest';
import {
  FreeFirstRouter,
  consoleRoutingLogger,
  isTransientError,
  iterateAttempts,
  parsePool,
  routePlan,
  type Candidate,
  type RoutingAttemptLog,
} from './freeFirst';

const c = (model: string, score = 0): Candidate => ({ provider: model, model, score });

// ─── parsePool ───────────────────────────────────────────────────────────────

describe('parsePool', () => {
  it('parses the existing comma-separated format without scores (backwards compat)', () => {
    const pool = parsePool(
      'openrouter/free,google/gemma-4-31b-it:free,google/gemma-4-26b-a4b-it:free',
    );
    expect(pool.map((x) => x.model)).toEqual([
      'openrouter/free',
      'google/gemma-4-31b-it:free',
      'google/gemma-4-26b-a4b-it:free',
    ]);
    expect(pool.every((x) => x.score === 0)).toBe(true);
  });

  it('parses inline numeric score suffixes without colliding with :free', () => {
    const pool = parsePool('google/gemma-4-31b-it:free:9,google/gemma-4-26b-a4b-it:free:3');
    expect(pool[0]).toEqual({
      provider: 'google/gemma-4-31b-it:free',
      model: 'google/gemma-4-31b-it:free',
      score: 9,
    });
    expect(pool[1].score).toBe(3);
  });

  it('supports plain model:score entries', () => {
    expect(parsePool('alpha:2.5,beta:0')).toEqual([
      { provider: 'alpha', model: 'alpha', score: 2.5 },
      { provider: 'beta', model: 'beta', score: 0 },
    ]);
  });

  it('handles empty/undefined pools', () => {
    expect(parsePool(undefined)).toEqual([]);
    expect(parsePool('')).toEqual([]);
    expect(parsePool('  ,  ')).toEqual([]);
  });
});

// ─── routePlan (espejo de tests/test_router.py) ─────────────────────────────

describe('routePlan', () => {
  it('orders free candidates by score desc and appends paid last', () => {
    const plan = routePlan([c('a', 1), c('b', 3), c('c', 2)], 'paid-model');
    expect(plan).toEqual(['b', 'c', 'a', 'paid-model']);
  });

  it('puts free first, before paid (espejo test_router.py)', () => {
    const plan = routePlan([c('openrouter/free', 1)], 'deepseek/paid');
    expect(plan[0]).toBe('openrouter/free');
  });

  it('keeps insertion order for equal scores (stable)', () => {
    expect(routePlan([c('a', 0), c('b', 0), c('c', 0)], undefined)).toEqual(['a', 'b', 'c']);
  });

  it('omits paid when absent', () => {
    expect(routePlan([c('a', 1)], undefined)).toEqual(['a']);
  });
});

// ─── isTransientError ────────────────────────────────────────────────────────

describe('isTransientError', () => {
  it('classifies 5xx as transient', () => {
    expect(isTransientError(new Error('OpenRouter returned 503'))).toBe(true);
    expect(isTransientError(Object.assign(new Error('upstream'), { status: 502 }))).toBe(true);
  });

  it('classifies network/timeout/abort as transient', () => {
    expect(isTransientError(new Error('fetch failed'))).toBe(true);
    expect(isTransientError(new Error('socket hang up'))).toBe(true);
    expect(isTransientError(new Error('ETIMEDOUT'))).toBe(true);
    expect(isTransientError(new DOMException('aborted', 'AbortError'))).toBe(true);
  });

  it('classifies rate limits as transient (free-tier shared capacity)', () => {
    expect(isTransientError(new Error('429 Too Many Requests'))).toBe(true);
    expect(isTransientError(new Error('rate limit exceeded'))).toBe(true);
    expect(isTransientError(Object.assign(new Error('quota'), { status: 429 }))).toBe(true);
  });

  it('classifies the SDK internal-retry wrapper as transient', () => {
    // The AI SDK retries 429/5xx/network up to 3× internally and then wraps the
    // final failure without the original status — the wrapper itself is the
    // transient signal (permanent errors like 400 never trigger internal retries).
    expect(
      isTransientError(new Error('Failed after 3 attempts. Last error: AI_APICallError: Provider returned error')),
    ).toBe(true);
  });

  it('treats 4xx/validation errors as permanent', () => {
    expect(isTransientError(new Error('400 Bad Request'))).toBe(false);
    expect(isTransientError(Object.assign(new Error('auth'), { status: 401 }))).toBe(false);
    expect(isTransientError(Object.assign(new Error('model not found'), { status: 404 }))).toBe(false);
  });

  it('is safe with non-errors', () => {
    expect(isTransientError(null)).toBe(false);
    expect(isTransientError(undefined)).toBe(false);
    expect(isTransientError('oops')).toBe(false);
  });
});

// ─── iterateAttempts (retry + budget) ───────────────────────────────────────

/**
 * Drive the generator the same way the route does: after each step, mark the
 * failure type for that model (transient → retry allowed; permanent → skip).
 */
function drive(
  plan: string[],
  failures: Record<string, 'transient' | 'permanent'>,
  opts: { maxRetriesPerModel?: number; maxTotalAttempts?: number } = {},
): string[] {
  const out: string[] = [];
  for (const step of iterateAttempts(plan, opts)) {
    out.push(`${step.modelId}#${step.attempt}`);
    const f = failures[step.modelId];
    if (f === 'transient') step.transient = true;
  }
  return out;
}

describe('iterateAttempts', () => {
  it('retries once on transient failure, then moves to the next model', () => {
    expect(drive(['a', 'b'], { a: 'transient' })).toEqual(['a#1', 'a#2', 'b#1']);
  });

  it('skips the retry on permanent failure', () => {
    expect(drive(['a', 'b'], { a: 'permanent' })).toEqual(['a#1', 'b#1']);
  });

  it('honors maxRetriesPerModel = 0 (no retries)', () => {
    expect(drive(['a', 'b'], { a: 'transient' }, { maxRetriesPerModel: 0 })).toEqual([
      'a#1',
      'b#1',
    ]);
  });

  it('enforces the total attempt budget', () => {
    expect(
      drive(['a', 'b', 'c'], { a: 'transient', b: 'transient' }, { maxTotalAttempts: 3 }),
    ).toEqual(['a#1', 'a#2', 'b#1']);
  });

  it('budget default allows the full plan with 1 retry', () => {
    expect(drive(['a', 'b', 'c', 'd'], { a: 'transient', b: 'transient' })).toEqual([
      'a#1',
      'a#2',
      'b#1',
      'b#2',
      'c#1',
      'd#1',
    ]);
  });
});

// ─── FreeFirstRouter facade ──────────────────────────────────────────────────

describe('FreeFirstRouter', () => {
  it('builds a score-ordered plan from the env-style pool', () => {
    const router = new FreeFirstRouter({
      freePool: 'gemma-a:free:9,gemma-b:free:3,openrouter/free',
      paidModel: 'google/gemini-3.6-flash',
    });
    expect(router.routePlan()).toEqual([
      'gemma-a:free',
      'gemma-b:free',
      'openrouter/free',
      'google/gemini-3.6-flash',
    ]);
  });

  it('iterates with retry and records telemetry through the injected logger', () => {
    const entries: RoutingAttemptLog[] = [];
    const router = new FreeFirstRouter({
      freePool: 'a:5,b:2',
      paidModel: 'paid',
      logger: (e) => entries.push(e),
    });

    const attempts: string[] = [];
    for (const step of router.iterate()) {
      attempts.push(`${step.modelId}#${step.attempt}`);
      if (step.modelId === 'a') {
        step.transient = true; // first model fails transiently
        router.log({
          model: step.modelId,
          attempt: step.attempt,
          isRetry: step.isRetry,
          ok: false,
          latencyMs: 120,
          reason: step.isRetry ? 'transient-retry-exhausted' : 'transient',
        });
      }
    }

    expect(attempts).toEqual(['a#1', 'a#2', 'b#1', 'paid#1']);
    expect(entries.map((e) => `${e.model}#${e.attempt}`)).toEqual(['a#1', 'a#2']);
    expect(entries.every((e) => e.ok === false && e.latencyMs === 120)).toBe(true);
  });

  it('never throws when the logger throws', () => {
    const router = new FreeFirstRouter({
      freePool: 'a',
      logger: () => {
        throw new Error('boom');
      },
    });
    expect(() => router.log({ model: 'a', attempt: 1, isRetry: false, ok: false, latencyMs: 0, reason: 'transient' })).not.toThrow();
  });
});

describe('consoleRoutingLogger', () => {
  it('emits a structured JSON line (info on ok, warn on failure)', () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      consoleRoutingLogger({ model: 'a', attempt: 1, isRetry: false, ok: true, latencyMs: 5, reason: 'none' });
      consoleRoutingLogger({ model: 'a', attempt: 2, isRetry: true, ok: false, latencyMs: 5, reason: 'transient-retry-exhausted' });
      expect(info).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledTimes(1);
      const line = info.mock.calls[0][0] as string;
      expect(line).toContain('[AskAI][Routing]');
      const parsed = JSON.parse(line.replace('[AskAI][Routing] ', ''));
      expect(parsed).toMatchObject({ model: 'a', ok: true, latencyMs: 5, reason: 'none' });
    } finally {
      info.mockRestore();
      warn.mockRestore();
    }
  });
});
