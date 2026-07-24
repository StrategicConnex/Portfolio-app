/**
 * Simple TF-IDF vector-based retrieval for semantic search.
 * Complements the keyword-based scoring in retrieve.ts.
 * No external API calls needed - pure math-based similarity.
 */
import { ALL_SOURCES, type KnowledgeSource } from './sources';
import { retrieveRelevant } from './retrieve';

const STOP_WORDS = new Set([
  'el', 'la', 'los', 'las', 'un', 'una', 'y', 'e', 'o', 'a', 'de', 'del',
  'en', 'por', 'para', 'con', 'sin', 'es', 'son', 'se', 'su', 'que', 'como',
  'más', 'pero', 'lo', 'le', 'no', 'ni', 'al', 'este', 'esta', 'entre',
  'the', 'a', 'an', 'and', 'or', 'in', 'on', 'at', 'to', 'for', 'of',
  'with', 'by', 'from', 'is', 'are', 'it', 'its', 'their', 'what', 'how',
  'puedo', 'puedes', 'quiero', 'necesito', 'dime', 'cuéntame', 'explícame',
  'tell', 'explain', 'describe', 'show', 'give',
]);

interface VectorEntry {
  source: KnowledgeSource;
  vector: Map<string, number>;
  magnitude: number;
}

let cachedVectors: VectorEntry[] | null = null;

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[\s,.;:!?()\[\]{}"'-]+/)
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t));
}

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
 * Retrieve sources using semantic (TF-IDF cosine similarity) matching.
 * Returns a list of sources with similarity scores.
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

/**
 * Combined retrieval: merges keyword scores + semantic scores.
 * Returns deduplicated results ranked by combined score.
 */
export function retrieveCombined(
  query: string,
  locale: 'es' | 'en' = 'es',
  topK: number = 5,
): { source: KnowledgeSource; score: number; keywordScore: number; semanticScore: number }[] {
  const keywordResults = retrieveRelevant(query, locale, 10);
  const semanticResults = retrieveSemantic(query, locale, 10);

  // Combine scores with normalization
  const combined = new Map<string, {
    source: KnowledgeSource;
    keywordScore: number;
    semanticScore: number;
  }>();

  for (const r of keywordResults) {
    combined.set(r.source.id, {
      source: r.source,
      keywordScore: r.score,
      semanticScore: 0,
    });
  }

  for (const r of semanticResults) {
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

  const results = [...combined.values()].map((r) => ({
    source: r.source,
    score: r.keywordScore * 0.6 + r.semanticScore * 0.4,
    keywordScore: r.keywordScore,
    semanticScore: r.semanticScore,
  }));

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, topK);
}
