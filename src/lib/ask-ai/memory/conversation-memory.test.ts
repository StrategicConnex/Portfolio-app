import { describe, it, expect } from 'vitest';
import { generateConversationSummary, shouldSummarize } from './conversation-memory';

describe('conversation-memory', () => {
  describe('generateConversationSummary', () => {
    it('should return empty summary for no messages', () => {
      const result = generateConversationSummary([], 'es');
      expect(result.title).toBe('Conversación vacía');
    });

    it('should extract first user message as title', () => {
      const messages = [
        { role: 'user', content: '¿Qué experiencia tiene Juan en ciberseguridad?' },
        { role: 'assistant', content: 'Juan tiene 15+ años...' },
      ];
      const result = generateConversationSummary(messages, 'es');
      expect(result.title).toContain('¿Qué experiencia tiene Juan');
    });

    it('should detect IEC 62443 topic', () => {
      const messages = [
        { role: 'user', content: 'Explícame IEC 62443 para OT' },
        { role: 'assistant', content: 'IEC 62443 es un estándar...' },
      ];
      const result = generateConversationSummary(messages, 'es');
      expect(result.topics).toContain('iec 62443');
    });

    it('should detect Purdue topic', () => {
      const messages = [
        { role: 'user', content: 'Cómo funciona el modelo Purdue' },
        { role: 'assistant', content: 'El modelo Purdue segmenta...' },
      ];
      const result = generateConversationSummary(messages, 'es');
      expect(result.topics).toContain('purdue');
    });

    it('should generate English output when language is en', () => {
      const messages = [
        { role: 'user', content: 'Tell me about NIST CSF' },
        { role: 'assistant', content: 'NIST CSF is a framework...' },
      ];
      const result = generateConversationSummary(messages, 'en');
      expect(result.summary).toContain('Conversation about');
    });

    it('should count user and assistant messages', () => {
      const messages = [
        { role: 'user', content: 'Hola' },
        { role: 'assistant', content: 'Respuesta 1' },
        { role: 'user', content: 'Otra pregunta' },
        { role: 'assistant', content: 'Respuesta 2' },
      ];
      const result = generateConversationSummary(messages, 'es');
      expect(result.summary).toContain('2 mensajes de usuario');
      expect(result.summary).toContain('2 respuestas');
    });
  });

  describe('shouldSummarize', () => {
    it('should return false for few messages', () => {
      const messages = [{ role: 'user' }, { role: 'assistant' }];
      expect(shouldSummarize(messages)).toBe(false);
    });

    it('should return true when threshold is reached', () => {
      const messages = Array.from({ length: 16 }, (_, i) => ({
        role: i % 2 === 0 ? 'user' : 'assistant',
      }));
      expect(shouldSummarize(messages)).toBe(true);
    });
  });
});
