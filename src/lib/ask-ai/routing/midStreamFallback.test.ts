import { describe, expect, it, vi } from 'vitest';
import { type TextStreamPart, type ToolSet, type UIMessageChunk } from 'ai';
import { withMidStreamFallback, type MidStreamFallbackOptions } from './midStreamFallback';
import type { RoutingAttemptLog } from './freeFirst';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fromParts = (parts: TextStreamPart<ToolSet>[]): ReadableStream<TextStreamPart<ToolSet>> =>
  new ReadableStream<TextStreamPart<ToolSet>>({
    start(c) {
      for (const p of parts) c.enqueue(p);
      c.close();
    },
  });

const streamThatErrors = (error: unknown): ReadableStream<TextStreamPart<ToolSet>> =>
  new ReadableStream<TextStreamPart<ToolSet>>({
    start(c) {
      c.enqueue({ type: 'start' });
    },
    pull(c) {
      c.error(error);
    },
  });

const okPart = (text: string): TextStreamPart<ToolSet> => ({ type: 'text-delta', id: 't1', text });

const finishPart: TextStreamPart<ToolSet> = {
  type: 'finish',
  finishReason: 'stop',
  rawFinishReason: undefined,
  totalUsage: {
    inputTokens: 1,
    outputTokens: 1,
    totalTokens: 2,
    inputTokenDetails: { noCacheTokens: 1, cacheReadTokens: 0, cacheWriteTokens: 0 },
    outputTokenDetails: { textTokens: 2, reasoningTokens: 0 },
  },
};

async function collect(stream: ReadableStream<UIMessageChunk>): Promise<UIMessageChunk[]> {
  const chunks: UIMessageChunk[] = [];
  const reader = stream.getReader();
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return chunks;
}

function run(opts: Omit<MidStreamFallbackOptions, 'plan'> & { plan?: string[] }) {
  return withMidStreamFallback({ plan: ['a', 'b', 'paid'], ...opts });
}

function logSpy() {
  const logs: RoutingAttemptLog[] = [];
  const spy = vi.fn((entry: RoutingAttemptLog) => {
    logs.push(entry);
  });
  return { logs, spy };
}

const TRANSIENT_429 = Object.assign(new Error('Rate limit exceeded'), { status: 429 });
const PERMANENT_400 = Object.assign(new Error('Bad request'), { status: 400 });

// ─── Happy path ──────────────────────────────────────────────────────────────

describe('withMidStreamFallback — happy path', () => {
  it('emits [start, text-delta…, finish] from the single model and logs ok once', async () => {
    const { logs, spy } = logSpy();
    const stream = run({
      makeStream: () => fromParts([{ type: 'start' }, okPart('Hello'), finishPart]),
      onAttempt: spy,
    });
    const chunks = await collect(stream);

    expect(chunks.map((c) => c.type)).toEqual(['start', 'text-delta', 'finish']);
    expect(chunks[0]).toEqual({ type: 'start' });
    expect((chunks[1] as { delta: string }).delta).toBe('Hello');
    expect((chunks[2] as { finishReason?: string }).finishReason).toBe('stop');

    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({ model: 'a', attempt: 1, isRetry: false, ok: true, reason: 'none' });
  });
});

// ─── Pre-content fallback ────────────────────────────────────────────────────

describe('withMidStreamFallback — pre-content fallback', () => {
  it('falls back when the model emits an error part before content (429)', async () => {
    const { logs, spy } = logSpy();
    const stream = run({
      makeStream: (id) =>
        id === 'a' ? fromParts([{ type: 'start' }, { type: 'error', error: TRANSIENT_429 }]) : fromParts([{ type: 'start' }, okPart('ok'), finishPart]),
      onAttempt: spy,
    });
    const chunks = await collect(stream);

    // The client only ever sees the successful model — exactly one `start`.
    expect(chunks.map((c) => c.type)).toEqual(['start', 'text-delta', 'finish']);
    expect(chunks.filter((c) => c.type === 'start')).toHaveLength(1);

    // Attempts consumed: a(1) transient → retry a(2) fails again → b success.
    expect(logs.map((l) => l.model)).toEqual(['a', 'a', 'b']);
    expect(logs[0]).toMatchObject({ attempt: 1, isRetry: false, ok: false, reason: 'transient' });
    expect(logs[1]).toMatchObject({ attempt: 2, isRetry: true, ok: false, reason: 'transient-retry-exhausted' });
    expect(logs[2]).toMatchObject({ attempt: 1, isRetry: false, ok: true, reason: 'none' });
    // Failed attempts carry a diagnostic errorText for telemetry.
    expect(logs[0].errorText).toContain('Rate limit exceeded');
    expect(logs[2].errorText).toBeUndefined();
  });

  it('falls back on a thrown read error (network) before content', async () => {
    const { logs, spy } = logSpy();
    const stream = run({
      makeStream: (id) => (id === 'a' ? streamThatErrors(new Error('fetch failed')) : fromParts([okPart('ok')])),
      onAttempt: spy,
    });
    const chunks = await collect(stream);
    expect(chunks.map((c) => c.type)).toEqual(['start', 'text-delta']);
    // Transient read error → retry a once, then fall back to b.
    expect(logs.map((l) => l.model)).toEqual(['a', 'a', 'b']);
    expect(logs[0]).toMatchObject({ model: 'a', attempt: 1, isRetry: false, reason: 'transient' });
    expect(logs[1]).toMatchObject({ model: 'a', attempt: 2, isRetry: true, reason: 'transient-retry-exhausted' });
    expect(logs[2]).toMatchObject({ model: 'b', attempt: 1, ok: true });
  });

  it('skips the retry on a permanent pre-content error and moves to the next model', async () => {
    const { logs, spy } = logSpy();
    const stream = run({
      makeStream: (id) =>
        id === 'a' ? fromParts([{ type: 'error', error: PERMANENT_400 }]) : fromParts([{ type: 'start' }, okPart('ok')]),
      onAttempt: spy,
    });
    const chunks = await collect(stream);
    expect(chunks.map((c) => c.type)).toEqual(['start', 'text-delta']);
    // No retry for a (permanent) — straight to b.
    expect(logs.map((l) => l.model)).toEqual(['a', 'b']);
    expect(logs[0]).toMatchObject({ isRetry: false, reason: 'permanent-error' });
  });

  it('emits a single error chunk when the whole budget is exhausted', async () => {
    const { logs, spy } = logSpy();
    const errorText = vi.fn(() => 'No quedan modelos');
    const stream = run({
      makeStream: () => streamThatErrors(TRANSIENT_429),
      onAttempt: spy,
      onError: errorText,
    });
    const chunks = await collect(stream);

    expect(chunks.map((c) => c.type)).toEqual(['error']);
    expect((chunks[0] as { errorText: string }).errorText).toBe('No quedan modelos');
    expect(errorText).toHaveBeenCalledWith(TRANSIENT_429);
    // Budget: 3 models × (1 + 1 retry) capped at 6 attempts.
    expect(logs).toHaveLength(6);
    expect(logs.every((l) => l.ok === false)).toBe(true);
  });

  it('respects a custom attempt budget', async () => {
    const { logs, spy } = logSpy();
    const stream = run({
      plan: ['a', 'b'],
      maxTotalAttempts: 2,
      maxRetriesPerModel: 1,
      makeStream: () => streamThatErrors(TRANSIENT_429),
      onAttempt: spy,
    });
    await collect(stream);
    expect(logs).toHaveLength(2);
  });
});

// ─── Post-content frontier ───────────────────────────────────────────────────

describe('withMidStreamFallback — post-content frontier (bounded)', () => {
  it('does NOT restart after content was already emitted: error chunk + end', async () => {
    const { logs, spy } = logSpy();
    const makeStream = vi.fn((id: string) =>
      id === 'a'
        ? fromParts([{ type: 'start' }, okPart('Partial'), { type: 'error', error: TRANSIENT_429 }])
        : fromParts([okPart('should not run')]),
    );
    const stream = run({ makeStream, onAttempt: spy });
    const chunks = await collect(stream);

    // Partial content reached the client, then error — no restart, no 'b'.
    expect(chunks.map((c) => c.type)).toEqual(['start', 'text-delta', 'error']);
    expect((chunks[1] as { delta: string }).delta).toBe('Partial');
    expect(makeStream).toHaveBeenCalledTimes(1);

    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({ model: 'a', ok: false, reason: 'mid-stream-error' });
  });

  it('handles a post-content thrown error the same way (no restart)', async () => {
    const makeStream = vi.fn((id: string) => {
      if (id === 'a') {
        return new ReadableStream<TextStreamPart<ToolSet>>({
          start(c) {
            c.enqueue({ type: 'start' });
            c.enqueue(okPart('Partial'));
          },
          pull(c) {
            c.error(new Error('socket hang up'));
          },
        });
      }
      return fromParts([okPart('should not run')]);
    });
    const stream = run({ makeStream });
    const chunks = await collect(stream);
    expect(chunks.map((c) => c.type)).toEqual(['start', 'text-delta', 'error']);
    expect(makeStream).toHaveBeenCalledTimes(1);
  });
});

// ─── Edge cases ──────────────────────────────────────────────────────────────

describe('withMidStreamFallback — edges', () => {
  it('closes cleanly with just a start chunk when the stream ends with no content', async () => {
    const { logs, spy } = logSpy();
    const stream = run({
      makeStream: () => fromParts([{ type: 'start' }]),
      onAttempt: spy,
    });
    const chunks = await collect(stream);
    expect(chunks.map((c) => c.type)).toEqual(['start']);
    expect(logs[0]).toMatchObject({ model: 'a', ok: true, reason: 'none' });
  });

  it('maps the error text through onError (client-safe, no leak)', async () => {
    const stream = run({
      plan: ['a'],
      makeStream: () => fromParts([{ type: 'error', error: Object.assign(new Error('secret api detail'), { status: 429 }) }]),
      onError: () => 'An error occurred.',
    });
    const chunks = await collect(stream);
    expect((chunks[chunks.length - 1] as { errorText: string }).errorText).toBe('An error occurred.');
  });

  it('propagates consumer cancellation to the active model reader', async () => {
    let cancelled = false;
    const stream = run({
      plan: ['a'],
      makeStream: () =>
        new ReadableStream<TextStreamPart<ToolSet>>({
          start(c) {
            c.enqueue(okPart('x')); // commit immediately so the attempt is active
          },
          pull() {
            return new Promise(() => {}); // then stay open
          },
          cancel() {
            cancelled = true;
          },
        }),
    });
    const reader = stream.getReader();
    const first = await reader.read();
    expect(first.done).toBe(false);
    expect(first.value).toEqual({ type: 'start' }); // attempt committed
    await reader.cancel('user stopped');
    expect(cancelled).toBe(true);
    const { done } = await reader.read();
    expect(done).toBe(true);
  });

  it('never enqueues after cancellation', async () => {
    let cancelled = false;
    const stream = run({
      plan: ['a'],
      makeStream: () =>
        new ReadableStream<TextStreamPart<ToolSet>>({
          start(c) {
            c.enqueue(okPart('x'));
          },
          pull() {
            return new Promise(() => {});
          },
          cancel() {
            cancelled = true;
          },
        }),
    });
    const reader = stream.getReader();
    await reader.read(); // start the attempt + commit
    await reader.cancel('stop');
    expect(cancelled).toBe(true);
    const { done } = await reader.read();
    expect(done).toBe(true);
  });
});
