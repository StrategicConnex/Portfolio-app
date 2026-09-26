/**
 * Unified retrieval seam for the Ask Juan AI copilot.
 *
 * One public entry point — `retrieve()` — fuses keyword scoring and TF-IDF
 * semantic similarity into a single ranked result list. `buildRagContext()`
 * consumes `retrieve()` so the context injected into the system prompt and
 * the "available sources" list always come from the same retrieval (they can
 * never diverge, and the corpus is only scanned once per request).
 *
 * `retrieveRelevant` / `retrieveSemantic` are the internal components,
 * exported only for tests.
 */
import { ALL_SOURCES, type KnowledgeSource } from './sources';
import { tokenize } from './tokenizer';

// ─── Fusion weights ─────────────────────────────────────────────────────────
// Tunable in one place: how much keyword vs semantic similarity weighs in the
// final ranking. Both component scores are normalized to 0–100 before fusion,
// so the weights mean what they say.
export const RAG_WEIGHTS = { keyword: 0.6, semantic: 0.4 } as const;

const round1 = (n: number): number => Math.round(n * 10) / 10;

// ─── Keyword scoring ────────────────────────────────────────────────────────

function computeKeywordScore(queryTokens: string[], source: KnowledgeSource): number {
  const contentText = `${source.title} ${source.content} ${source.tags.join(' ')}`;
  const contentTokens = new Set(tokenize(contentText));
  const tagSet = new Set(source.tags.map((t) => t.toLowerCase().replace(/\s+/g, '')));

  let score = 0;

  for (const qt of queryTokens) {
    const qtClean = qt.replace(/\s+/g, '');

    // Direct tag match (highest weight)
    if (tagSet.has(qtClean)) {
      score += 10;
      continue;
    }

    // Partial tag match
    for (const tag of tagSet) {
      if (tag.includes(qtClean) || qtClean.includes(tag)) {
        score += 5;
        break;
      }
    }

    // Content token match
    if (contentTokens.has(qt)) {
      score += 3;
      continue;
    }

    // Substring match in content
    if (contentText.toLowerCase().includes(qt)) {
      score += 1;
    }
  }

  // Boost for exact phrase matches in content
  const queryLower = queryTokens.join(' ');
  if (
    source.content.toLowerCase().includes(queryLower) ||
    source.title.toLowerCase().includes(queryLower)
  ) {
    score += 8;
  }

  return score;
}

/**
 * Keyword-only retrieval (tag boosting + phrase matching), filtered by locale.
 * Component of the unified seam; exported for tests.
 */
export function retrieveRelevant(
  query: string,
  locale: 'es' | 'en' = 'es',
  topK: number = 5,
): { source: KnowledgeSource; score: number }[] {
  const queryTokens = tokenize(query);

  if (queryTokens.length === 0) {
    return [];
  }

  const scored: { source: KnowledgeSource; score: number }[] = [];

  for (const source of ALL_SOURCES) {
    // Filter by locale: 'both' matches any locale
    if (source.locale !== 'both' && source.locale !== locale) {
      continue;
    }

    const score = computeKeywordScore(queryTokens, source);

    if (score > 0) {
      scored.push({ source, score });
    }
  }

  // Sort by score, take top K
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK);
}

// ─── Semantic (TF-IDF) scoring ──────────────────────────────────────────────

interface VectorEntry {
  source: KnowledgeSource;
  vector: Map<string, number>;
  magnitude: number;
}

let cachedVectors: VectorEntry[] | null = null;

/**
 * Compute TF (term frequency) vector for a text.
 */
function computeTF(text: string): Map<string, number> {
  const tokens = tokenize(text);
  const tf = new Map<string, number>();
  for (const token of tokens) {
    tf.set(token, (tf.get(token) || 0) + 1);
  }
  // Normalize by token count
  const total = tokens.length || 1;
  for (const [key, val] of tf) {
    tf.set(key, val / total);
  }
  return tf;
}

/**
 * Compute magnitude of a vector.
 */
function magnitude(vec: Map<string, number>): number {
  let sum = 0;
  for (const val of vec.values()) {
    sum += val * val;
  }
  return Math.sqrt(sum);
}

/**
 * Compute cosine similarity between two TF vectors.
 */
function cosineSimilarity(a: Map<string, number>, b: Map<string, number>): number {
  let dotProduct = 0;
  for (const [key, valA] of a) {
    const valB = b.get(key);
    if (valB !== undefined) {
      dotProduct += valA * valB;
    }
  }
  const magA = magnitude(a);
  const magB = magnitude(b);
  if (magA === 0 || magB === 0) return 0;
  return dotProduct / (magA * magB);
}

/**
 * Build TF-IDF vectors for all knowledge sources.
 * Uses TF (term frequency) without IDF since our corpus is small.
 */
function buildVectors(): VectorEntry[] {
  if (cachedVectors) return cachedVectors;

  const vectors: VectorEntry[] = [];
  for (const source of ALL_SOURCES) {
    const content = `${source.title} ${source.content} ${source.tags.join(' ')}`;
    const vector = computeTF(content);
    vectors.push({
      source,
      vector,
      magnitude: magnitude(vector),
    });
  }

  cachedVectors = vectors;
  return vectors;
}

/**
 * Semantic-only retrieval (TF-IDF cosine similarity), filtered by locale.
 * Component of the unified seam; exported for tests.
 */
export function retrieveSemantic(
  query: string,
  locale: 'es' | 'en' = 'es',
  topK: number = 5,
): { source: KnowledgeSource; score: number }[] {
  const queryVec = computeTF(query);
  const vectors = buildVectors();

  const scored: { source: KnowledgeSource; score: number }[] = [];

  for (const entry of vectors) {
    // Filter by locale
    if (entry.source.locale !== 'both' && entry.source.locale !== locale) {
      continue;
    }

    const sim = cosineSimilarity(queryVec, entry.vector);
    if (sim > 0.05) {
      scored.push({ source: entry.source, score: Math.round(sim * 100) });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK);
}

// ─── Unified retrieval ──────────────────────────────────────────────────────

export interface RetrievalResult {
  source: KnowledgeSource;
  /** Fused 0–100 score (keyword + semantic, weighted by RAG_WEIGHTS). */
  score: number;
  /** Keyword component, min-max normalized to 0–100 across candidates. */
  keywordScore: number;
  /** Semantic component, 0–100 cosine similarity. */
  semanticScore: number;
}

/**
 * Retrieve the most relevant knowledge sources for a query.
 *
 * Fuses keyword scoring and TF-IDF semantic similarity: keyword scores are
 * min-max normalized to 0–100 (raw scores are ~0–30 while semantic is
 * already 0–100) so `RAG_WEIGHTS` weighs components on a shared scale.
 * Results are deduplicated by source id, ranked by fused score and filtered
 * by locale.
 */
export function retrieve(
  query: string,
  locale: 'es' | 'en' = 'es',
  topK: number = 5,
): RetrievalResult[] {
  const keywordCandidates = retrieveRelevant(query, locale, 10);
  const semanticCandidates = retrieveSemantic(query, locale, 10);

  if (keywordCandidates.length === 0 && semanticCandidates.length === 0) {
    return [];
  }

  // Min-max normalize keyword scores to 0–100 over the retrieved candidates.
  const keywordScores = keywordCandidates.map((r) => r.score);
  const kwMin = Math.min(...keywordScores);
  const kwMax = Math.max(...keywordScores);
  const kwRange = kwMax - kwMin;
  const normalizeKw = (raw: number): number =>
    kwRange === 0 ? (raw > 0 ? 100 : 0) : ((raw - kwMin) / kwRange) * 100;

  const combined = new Map<string, {
    source: KnowledgeSource;
    keywordScore: number;
    semanticScore: number;
  }>();

  for (const r of keywordCandidates) {
    combined.set(r.source.id, {
      source: r.source,
      keywordScore: normalizeKw(r.score),
      semanticScore: 0,
    });
  }

  for (const r of semanticCandidates) {
    const existing = combined.get(r.source.id);
    if (existing) {
      existing.semanticScore = r.score;
    } else {
      combined.set(r.source.id, {
        source: r.source,
        keywordScore: 0,
        semanticScore: r.score,
      });
    }
  }

  const results: RetrievalResult[] = [...combined.values()].map((r) => {
    const keywordScore = round1(r.keywordScore);
    const semanticScore = r.semanticScore;
    return {
      source: r.source,
      keywordScore,
      semanticScore,
      score: round1(keywordScore * RAG_WEIGHTS.keyword + semanticScore * RAG_WEIGHTS.semantic),
    };
  });

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, topK);
}

/**
 * Build a context string from retrieved sources for injection into the system
 * prompt. Consumes `retrieve()` so the context and the listed sources always
 * come from the same retrieval.
 */
export function buildRagContext(
  query: string,
  locale: 'es' | 'en' = 'es',
  topK: number = 5,
): {
  context: string;
  sources: { title: string; id: string }[];
  /** Distinct source types among the retrieved entries (for telemetry). */
  sourceTypes: string[];
} {
  const results = retrieve(query, locale, topK);

  if (results.length === 0) {
    return { context: '', sources: [], sourceTypes: [] };
  }

  const contextParts: string[] = [];
  const sources: { title: string; id: string }[] = [];
  const sourceTypes = [...new Set(results.map((r) => r.source.type))];

  for (const result of results) {
    contextParts.push(
      `[FUENTE: ${result.source.title}]\n${result.source.content.trim()}\n`,
    );
    sources.push({ title: result.source.title, id: result.source.id });
  }

  return {
    context: contextParts.join('\n'),
    sources,
    sourceTypes,
  };
}
