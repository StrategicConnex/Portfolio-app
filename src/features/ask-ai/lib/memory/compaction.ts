/**
 * History compaction for the Ask Juan AI copilot (client seam).
 *
 * Long conversations blow the request size and the model's context window.
 * Once the visible thread grows past 15 messages beyond what is already
 * folded, the panel asks the server (`POST /api/ask-ai/compact`) for a model
 * summary of the oldest turns, keeps the last 6 messages verbatim, and sends
 * only `messages.slice(coveredCount)` plus the summary on later requests. The
 * panel still *shows* the whole conversation; only the payload shrinks.
 *
 * "Do not lose the cited sources": the summary prompt asks the model to keep
 * source names verbatim, and the client also carries them deterministically
 * from each folded assistant message's `metadata.sources` (the same list the
 * sources sidebar renders). Those titles travel to the route and are injected
 * into the prompt as sources that remain valid to cite by name.
 */

const COMPACTION_STORAGE_KEY = 'ask-ai-compaction';

/** Fold the oldest turns once this many unfolded messages accumulate. */
export const COMPACTION_THRESHOLD_MESSAGES = 15;

/** Messages kept verbatim on every request after a compaction. */
export const KEEP_RECENT_MESSAGES = 6;

/** Server and storage both cap the summary at this size. */
export const MAX_COMPACTED_SUMMARY_CHARS = 2000;

/** Max distinct source titles carried by the compacted context. */
export const MAX_COMPACTED_SOURCES = 20;

export interface CitedSource {
  title: string;
}

/** The compacted prefix of the visible conversation. */
export interface HistoryCompaction {
  /** Model-written summary of every message before `coveredCount`. */
  summary: string;
  /** Sources cited in the folded messages (deduplicated by title). */
  sources: CitedSource[];
  /** Number of leading visible messages folded into `summary`. */
  coveredCount: number;
  updatedAt: string;
}

/** Minimal structural view of a chat message. */
export interface CompactableMessage {
  role: string;
  parts: readonly { type: string; text?: string }[];
  metadata?: unknown;
}

/** What the compaction endpoint receives — role + text/tool parts only. */
export interface CompactRequestMessage {
  role: string;
  parts: { type: string; text?: string }[];
}

/** True when the unfolded tail reached the compaction threshold. */
export function shouldCompact(messageCount: number, coveredCount: number): boolean {
  return messageCount - coveredCount >= COMPACTION_THRESHOLD_MESSAGES;
}

export interface FoldableSlice<T extends CompactableMessage> {
  /** Messages to fold into the summary (may be empty). */
  foldable: T[];
  /** New `coveredCount` — the index of the first message kept verbatim. */
  coveredCount: number;
}

/**
 * Slice the messages to fold. The kept window starts at the last user turn at
 * or before `length - KEEP_RECENT_MESSAGES`, so it always keeps at least six
 * messages and the trimmed request begins with a user message (some providers
 * reject an assistant-first history after a fold). It never moves back into
 * an already-covered prefix.
 */
export function foldableMessages<T extends CompactableMessage>(
  messages: readonly T[],
  coveredCount: number,
): FoldableSlice<T> {
  const start = clampCoveredCount(coveredCount, messages.length);
  let keepFrom = Math.max(start, messages.length - KEEP_RECENT_MESSAGES);
  while (keepFrom > start && messages[keepFrom].role !== 'user') {
    keepFrom -= 1;
  }

  return {
    foldable: messages.slice(start, keepFrom),
    coveredCount: keepFrom,
  };
}

/** Clamp a stored `coveredCount` to a usable index for `messageCount`. */
export function clampCoveredCount(coveredCount: number, messageCount: number): number {
  if (!Number.isFinite(coveredCount) || coveredCount <= 0) return 0;
  return Math.min(Math.floor(coveredCount), messageCount);
}

/**
 * Drop a compaction whose `coveredCount` no longer matches the visible thread
 * (e.g. the user cleared the chat or localStorage restored different
 * messages). A stale offset would trim the live turns, so it fails closed.
 */
export function reconcileCompaction(
  compaction: HistoryCompaction | null,
  messageCount: number,
): HistoryCompaction | null {
  if (!compaction) return null;
  if (compaction.coveredCount <= 0 || compaction.coveredCount > messageCount) return null;
  if (!compaction.summary.trim()) return null;
  return compaction;
}

/** Merge a new summary + covered offset into the previous compaction. */
export function mergeCompaction(
  previous: HistoryCompaction | null,
  summary: string,
  coveredCount: number,
  sources: readonly CitedSource[] = [],
  now: Date = new Date(),
): HistoryCompaction {
  return {
    summary: summary.trim().slice(0, MAX_COMPACTED_SUMMARY_CHARS),
    sources: mergeSources(previous?.sources ?? [], sources),
    coveredCount,
    updatedAt: now.toISOString(),
  };
}

/** Union of source titles, case-insensitive, capped. */
export function mergeSources(
  a: readonly CitedSource[],
  b: readonly CitedSource[],
): CitedSource[] {
  const seen = new Set<string>();
  const merged: CitedSource[] = [];
  for (const source of [...a, ...b]) {
    const title = source.title.trim().slice(0, 200);
    if (!title) continue;
    const key = title.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push({ title });
    if (merged.length >= MAX_COMPACTED_SOURCES) break;
  }
  return merged;
}

/**
 * Source titles cited by assistant messages (`metadata.sources`, as streamed
 * by the route for the sources sidebar). Tool results are not sources: only
 * this list is what the UI cites.
 */
export function collectCitedSources(messages: readonly CompactableMessage[]): CitedSource[] {
  const found: CitedSource[] = [];
  for (const message of messages) {
    if (message.role !== 'assistant') continue;
    const metadata = message.metadata;
    if (!metadata || typeof metadata !== 'object') continue;
    const sources = (metadata as { sources?: unknown }).sources;
    if (!Array.isArray(sources)) continue;
    for (const source of sources) {
      if (!source || typeof source !== 'object') continue;
      const title = (source as { title?: unknown }).title;
      if (typeof title === 'string') found.push({ title });
    }
  }
  return mergeSources([], found);
}

/**
 * Build the messages + compacted-context fields a chat request should carry.
 * When there is nothing folded yet (or the offset no longer fits the visible
 * thread) the full history is sent unchanged.
 */
export interface CompactedRequest<T> {
  messages: readonly T[];
  historySummary?: string;
  historySources?: CitedSource[];
}

export function compactRequest<T extends { role: string }>(
  messages: readonly T[],
  compaction: HistoryCompaction | null,
): CompactedRequest<T> {
  if (!compaction) return { messages };
  const covered = clampCoveredCount(compaction.coveredCount, messages.length);
  if (covered <= 0 || covered >= messages.length) return { messages };
  return {
    messages: messages.slice(covered),
    historySummary: compaction.summary,
    historySources: compaction.sources,
  };
}

/** Strip a message down to what the compaction endpoint needs. */
export function toCompactRequestMessage(message: CompactableMessage): CompactRequestMessage {
  return {
    role: message.role,
    parts: message.parts
      .filter((part) => part.type === 'text' || part.type.startsWith('tool-'))
      .slice(0, 40)
      .map((part) =>
        part.type === 'text'
          ? { type: 'text', text: (part.text ?? '').slice(0, 4000) }
          : { type: part.type },
      ),
  };
}

// ─── Persistence ────────────────────────────────────────────────────────────

export function loadCompaction(): HistoryCompaction | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(COMPACTION_STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as Partial<HistoryCompaction>;
    if (typeof parsed?.summary !== 'string' || typeof parsed?.coveredCount !== 'number') {
      return null;
    }
    return {
      summary: parsed.summary.slice(0, MAX_COMPACTED_SUMMARY_CHARS),
      sources: Array.isArray(parsed.sources)
        ? mergeSources([], parsed.sources.filter((s): s is CitedSource => typeof s?.title === 'string'))
        : [],
      coveredCount: parsed.coveredCount,
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function saveCompaction(compaction: HistoryCompaction): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(COMPACTION_STORAGE_KEY, JSON.stringify(compaction));
  } catch {
    // Ignore localStorage errors
  }
}

export function clearCompaction(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(COMPACTION_STORAGE_KEY);
  } catch {
    // Ignore localStorage errors
  }
}
