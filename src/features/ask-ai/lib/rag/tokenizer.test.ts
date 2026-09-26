import { describe, expect, it } from 'vitest';
import { STOP_WORDS, tokenize } from './tokenizer';

describe('tokenize', () => {
  it('lowercases and splits on punctuation and whitespace', () => {
    // '¿' is not a delimiter (existing behavior, preserved) — it stays attached
    expect(tokenize('Hola, mundo! ¿Qué tal?')).toEqual(['hola', 'mundo', '¿qué', 'tal']);
  });

  it('drops stop words', () => {
    expect(tokenize('el la y de en un')).toEqual([]);
  });

  it('drops accented Spanish and English question words', () => {
    expect(tokenize('qué cómo dónde cuándo cuál quién cuánto')).toEqual([]);
    expect(tokenize('why where when who which')).toEqual([]);
  });

  it('drops single-character tokens', () => {
    expect(tokenize('a b c pm')).toEqual(['pm']);
  });

  it('splits on hyphens and quotes but keeps slashes', () => {
    // '/' is not a delimiter (existing behavior, preserved): 'IT/OT' stays whole
    expect(tokenize('IT/OT "security" 62443-4-2')).toEqual(['it/ot', 'security', '62443']);
  });

  it('exposes the stop word list as a Set', () => {
    expect(STOP_WORDS).toBeInstanceOf(Set);
    expect(STOP_WORDS.has('el')).toBe(true);
    expect(STOP_WORDS.has('the')).toBe(true);
  });
});
