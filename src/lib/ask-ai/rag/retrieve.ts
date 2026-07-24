import { ALL_SOURCES, type KnowledgeSource } from './sources';

// ─── Scoring ────────────────────────────────────────────────────────────────

const STOP_WORDS = new Set([
  'el', 'la', 'los', 'las', 'un', 'una', 'y', 'e', 'o', 'a', 'de', 'del',
  'en', 'por', 'para', 'con', 'sin', 'es', 'son', 'se', 'su', 'que', 'como',
  'más', 'pero', 'lo', 'le', 'no', 'ni', 'al', 'este', 'esta', 'entre',
  'the', 'a', 'an', 'and', 'or', 'in', 'on', 'at', 'to', 'for', 'of',
  'with', 'by', 'from', 'is', 'are', 'it', 'its', 'their', 'what', 'how',
  'puedo', 'puedes', 'quiero', 'necesito', 'dime', 'cuéntame', 'explícame',
  'tell', 'explain', 'describe', 'show', 'give',
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[\s,.;:!?()\[\]{}"'-]+/)
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t));
}

function computeScore(queryTokens: string[], source: KnowledgeSource): number {
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

// ─── Retrieval ──────────────────────────────────────────────────────────────

export interface RetrievalResult {
  source: KnowledgeSource;
  score: number;
}

/**
 * Retrieve the most relevant knowledge sources for a given query.
 * Uses keyword-based scoring with tag boosting and phrase matching.
 * Results are filtered by locale and deduplicated by content similarity.
 */
export function retrieveRelevant(
  query: string,
  locale: 'es' | 'en' = 'es',
  topK: number = 5,
): RetrievalResult[] {
  const queryTokens = tokenize(query);

  if (queryTokens.length === 0) {
    return [];
  }

  const scored: RetrievalResult[] = [];

  for (const source of ALL_SOURCES) {
    // Filter by locale: 'both' matches any locale
    if (source.locale !== 'both' && source.locale !== locale) {
      continue;
    }

    const score = computeScore(queryTokens, source);

    if (score > 0) {
      scored.push({ source, score });
    }
  }

  // Sort by score, take top K
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK);
}

/**
 * Build a context string from retrieved sources for injection into system prompt.
 */
export function buildRagContext(
  query: string,
  locale: 'es' | 'en' = 'es',
  topK: number = 5,
): { context: string; sources: { title: string; id: string }[] } {
  const results = retrieveRelevant(query, locale, topK);

  if (results.length === 0) {
    return { context: '', sources: [] };
  }

  const contextParts: string[] = [];
  const sources: { title: string; id: string }[] = [];

  for (const result of results) {
    contextParts.push(
      `[FUENTE: ${result.source.title}]\n${result.source.content.trim()}\n`,
    );
    sources.push({ title: result.source.title, id: result.source.id });
  }

  return {
    context: contextParts.join('\n'),
    sources,
  };
}
