/**
 * Shared text-tokenization primitive for the retrieval pipeline.
 *
 * Single home for `tokenize()` and `STOP_WORDS` — keyword scoring and
 * semantic (TF-IDF) retrieval must both import from here so the language
 * rule never drifts between modules.
 */

export const STOP_WORDS = new Set([
  'el', 'la', 'los', 'las', 'un', 'una', 'y', 'e', 'o', 'a', 'de', 'del',
  'en', 'por', 'para', 'con', 'sin', 'es', 'son', 'se', 'su', 'que', 'como',
  'más', 'pero', 'lo', 'le', 'no', 'ni', 'al', 'este', 'esta', 'entre',
  // Accented Spanish question words. Their unaccented twins ('que', 'como')
  // are already above — these slipped through and, as query tokens, matched
  // content by substring (e.g. 'qué' inside 'neuquén'), inflating sources
  // that happen to contain them. Question words carry no retrieval signal.
  'qué', 'cuál', 'cuáles', 'quién', 'quiénes', 'cuándo', 'dónde', 'cómo',
  'cuánto', 'cuántos', 'cuántas',
  'the', 'a', 'an', 'and', 'or', 'in', 'on', 'at', 'to', 'for', 'of',
  'with', 'by', 'from', 'is', 'are', 'it', 'its', 'their', 'what', 'how',
  'why', 'when', 'where', 'who', 'which',
  'puedo', 'puedes', 'quiero', 'necesito', 'dime', 'cuéntame', 'explícame',
  'tell', 'explain', 'describe', 'show', 'give',
]);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[\s,.;:!?()\[\]{}\"'-]+/)
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t));
}
