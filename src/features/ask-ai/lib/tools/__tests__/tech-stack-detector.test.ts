import { describe, it, expect } from 'vitest';
import { techStackSchema } from '../tech-stack-detector';

describe('techStackDetector', () => {
  it('should validate URL schema', () => {
    const result = techStackSchema.parse({ url: 'https://example.com' });
    expect(result.url).toBe('https://example.com');
  });

  it('should reject empty URL', () => {
    expect(() => techStackSchema.parse({ url: '' })).toThrow();
  });

  it('should reject overly long URL', () => {
    expect(() => techStackSchema.parse({ url: 'x'.repeat(2049) })).toThrow();
  });
});
