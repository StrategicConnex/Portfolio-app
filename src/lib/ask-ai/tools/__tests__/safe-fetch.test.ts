import { describe, it, expect } from 'vitest';
import { validateUrl, extractDomain } from '../safe-fetch';

describe('safe-fetch', () => {
  describe('validateUrl', () => {
    it('should accept valid https URLs', () => {
      const result = validateUrl('https://example.com');
      expect(result.valid).toBe(true);
    });

    it('should accept valid http URLs', () => {
      const result = validateUrl('http://example.com');
      expect(result.valid).toBe(true);
    });

    it('should reject localhost', () => {
      const result = validateUrl('http://localhost:3000');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Blocked');
    });

    it('should reject private IPs (10.x.x.x)', () => {
      const result = validateUrl('http://10.0.0.1');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Private IP');
    });

    it('should reject private IPs (192.168.x.x)', () => {
      const result = validateUrl('http://192.168.1.1');
      expect(result.valid).toBe(false);
    });

    it('should reject cloud metadata IP', () => {
      const result = validateUrl('http://169.254.169.254');
      expect(result.valid).toBe(false);
    });

    it('should reject unsupported protocols', () => {
      const result = validateUrl('ftp://example.com');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Unsupported protocol');
    });

    it('should reject invalid URLs', () => {
      const result = validateUrl('not-a-url');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid URL format');
    });

    it('should reject 127.0.0.1', () => {
      const result = validateUrl('https://127.0.0.1');
      expect(result.valid).toBe(false);
    });
  });

  describe('extractDomain', () => {
    it('should extract domain from URL', () => {
      expect(extractDomain('https://example.com/path')).toBe('example.com');
    });

    it('should extract domain from bare hostname', () => {
      expect(extractDomain('example.com')).toBe('example.com');
    });

    it('should return null for invalid input', () => {
      expect(extractDomain('not_a_domain')).toBeNull();
    });

    it('should handle subdomains', () => {
      expect(extractDomain('sub.example.com.ar')).toBe('sub.example.com.ar');
    });

    it('should handle localhost', () => {
      expect(extractDomain('localhost')).toBeNull();
    });
  });
});
