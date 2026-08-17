import { describe, expect, it } from 'vitest';
import { RAG_WEIGHTS, buildRagContext, retrieve, retrieveRelevant, retrieveSemantic } from './retriever';

describe('retrieve — unified seam', () => {
  it('ranks the IEC 62443 compliance source first for a Spanish compliance query', () => {
    const results = retrieve('IEC 62443 seguridad industrial', 'es', 5);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].source.id).toBe('compliance-iec62443');
  });

  it('keeps the standard source in the top 2 for a natural "what is" question', () => {
    // Remaining known limitation (not a seam defect): TF-without-IDF prefers
    // the short blog document over the standard's source by a point, so the
    // blog edges ahead on the semantic component. The standard's source must
    // still sit at #2. (The old 'qué' substring artifact is fixed — see the
    // regression test below.)
    const results = retrieve('¿Qué es IEC 62443?', 'es', 5);
    const topIds = results.slice(0, 2).map((r) => r.source.id);
    expect(topIds).toContain('compliance-iec62443');
  });

  it('keeps the standard source in the top 2 for a plain-¿"qué" query (regression)', () => {
    // The 'qué' ⊂ 'neuquén' substring artifact is structurally dead ('qué' is
    // a stop word, so it is never a query token). With the projected corpus
    // (C2) the blog and the compliance source tie on keyword for this query
    // and TF-without-IDF gives the blog a point on the semantic component —
    // both are legitimately about IEC 62443, the standard's source is #2.
    const results = retrieve('Qué cubre IEC 62443', 'es', 5);
    const topIds = results.slice(0, 2).map((r) => r.source.id);
    expect(topIds).toContain('compliance-iec62443');
  });

  it('ranks the English certifications entry first for an English certification query', () => {
    // Per-locale corpus (C2): the EN query resolves to the EN entry.
    const results = retrieve('PMP certification', 'en', 5);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].source.id).toBe('certs-main-en');
  });

  it('never returns sources from another locale', () => {
    const esResults = retrieve('perfil profesional', 'es', 20);
    expect(esResults.every((r) => r.source.locale !== 'en')).toBe(true);

    const enResults = retrieve('professional profile', 'en', 20);
    expect(enResults.every((r) => r.source.locale !== 'es')).toBe(true);
  });

  it('returns an empty list for empty or stop-word-only queries', () => {
    expect(retrieve('', 'es', 5)).toEqual([]);
    expect(retrieve('el la y de', 'es', 5)).toEqual([]);
  });

  it('returns results ranked by descending fused score', () => {
    const results = retrieve('seguridad industrial scada', 'es', 10);
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score);
    }
  });

  it('fused score is the weighted sum of the normalized components', () => {
    const results = retrieve('seguridad industrial scada', 'es', 10);
    expect(results.length).toBeGreaterThan(0);
    for (const r of results) {
      const expected =
        r.keywordScore * RAG_WEIGHTS.keyword + r.semanticScore * RAG_WEIGHTS.semantic;
      expect(r.score).toBeCloseTo(expected, 1);
    }
  });

  it('normalizes keyword scores to 0–100 and caps fused scores at 100', () => {
    const results = retrieve('siem', 'es', 10);
    expect(results.length).toBeGreaterThan(0);
    for (const r of results) {
      expect(r.keywordScore).toBeGreaterThanOrEqual(0);
      expect(r.keywordScore).toBeLessThanOrEqual(100);
      expect(r.score).toBeLessThanOrEqual(100);
    }
    // The top keyword hit (a tag match on "siem") must be at the scale ceiling
    expect(Math.max(...results.map((r) => r.keywordScore))).toBe(100);
  });

  it('fuses results that only the semantic component found', () => {
    const results = retrieve('gobernanza y gestión de riesgos', 'es', 10);
    const withSemanticOnly = results.find((r) => r.keywordScore === 0 && r.semanticScore > 0);
    // The fusion must admit sources the keyword component misses: min-max maps
    // their raw keyword score (the candidate minimum) to 0 and they enter via
    // TF-IDF similarity alone. The exact first match shifts with the corpus —
    // today certs-main ties iso27001 at sem=8 and precedes it in ALL_SOURCES.
    expect(withSemanticOnly).toBeDefined();
    expect(withSemanticOnly?.source.id).toBe('certs-main');
  });
});

describe('retrieveRelevant / retrieveSemantic — components', () => {
  it('keyword component filters by locale', () => {
    const results = retrieveRelevant('profile', 'en', 10);
    expect(results.every((r) => r.source.locale !== 'es')).toBe(true);
    expect(results.some((r) => r.source.id === 'profile-summary-en')).toBe(true);
  });

  it('semantic component filters by locale and caps at 100', () => {
    const results = retrieveSemantic('security onion siem', 'es', 10);
    expect(results.every((r) => r.source.locale !== 'en')).toBe(true);
    expect(results.every((r) => r.score <= 100)).toBe(true);
  });
});

describe('buildRagContext', () => {
  it('produces context and sources from the same retrieval', () => {
    const query = '¿Qué es IEC 62443?';
    const { context, sources } = buildRagContext(query, 'es', 5);
    const direct = retrieve(query, 'es', 5);

    expect(sources.map((s) => s.id)).toEqual(direct.map((r) => r.source.id));
    expect(context).toContain(direct[0].source.title);
    expect(context).toContain(direct[0].source.content.trim());
  });

  it('returns empty context and sources for an empty query', () => {
    expect(buildRagContext('', 'es')).toEqual({ context: '', sources: [], sourceTypes: [] });
  });
});
