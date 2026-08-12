import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { validateUrl, extractDomain, safeFetch } from '../safe-fetch';

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

  describe('safeFetch redirects', () => {
    const originalFetch = global.fetch;

    beforeEach(() => {
      global.fetch = vi.fn();
    });

    afterEach(() => {
      global.fetch = originalFetch;
      vi.clearAllMocks();
    });

    it('should follow a single redirect to the final URL', async () => {
      const mockFetch = vi.mocked(global.fetch);
      mockFetch.mockResolvedValueOnce(
        new Response(null, { status: 301, headers: { location: 'https://example.com/final' } }) as Response,
      );
      mockFetch.mockResolvedValueOnce(
        new Response('final content', { status: 200 }) as Response,
      );

      const response = await safeFetch('https://example.com/redirect');
      expect(response.status).toBe(200);
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockFetch).toHaveBeenNthCalledWith(1, 'https://example.com/redirect', expect.any(Object));
      expect(mockFetch).toHaveBeenNthCalledWith(2, 'https://example.com/final', expect.any(Object));
    });

    it('should follow multiple redirects up to the limit', async () => {
      const mockFetch = vi.mocked(global.fetch);
      mockFetch.mockResolvedValueOnce(
        new Response(null, { status: 302, headers: { location: 'https://example.com/step2' } }) as Response,
      );
      mockFetch.mockResolvedValueOnce(
        new Response(null, { status: 302, headers: { location: 'https://example.com/step3' } }) as Response,
      );
      mockFetch.mockResolvedValueOnce(
        new Response('final', { status: 200 }) as Response,
      );

      const response = await safeFetch('https://example.com/step1');
      expect(response.status).toBe(200);
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('should throw when redirect limit is exceeded', async () => {
      const mockFetch = vi.mocked(global.fetch);
      mockFetch.mockResolvedValue(
        new Response(null, { status: 302, headers: { location: 'https://example.com/loop' } }) as Response,
      );

      await expect(safeFetch('https://example.com/start', { maxRedirects: 3 })).rejects.toThrow(
        'Maximum redirects (3) exceeded',
      );
      expect(mockFetch).toHaveBeenCalledTimes(4);
    });

    it('should resolve relative redirect URLs', async () => {
      const mockFetch = vi.mocked(global.fetch);
      mockFetch.mockResolvedValueOnce(
        new Response(null, { status: 301, headers: { location: '/final-path' } }) as Response,
      );
      mockFetch.mockResolvedValueOnce(
        new Response('ok', { status: 200 }) as Response,
      );

      const response = await safeFetch('https://example.com/start');
      expect(response.status).toBe(200);
      expect(mockFetch).toHaveBeenNthCalledWith(2, 'https://example.com/final-path', expect.any(Object));
    });

    it('should block redirects to private IPs', async () => {
      const mockFetch = vi.mocked(global.fetch);
      mockFetch.mockResolvedValueOnce(
        new Response(null, { status: 302, headers: { location: 'http://192.168.1.1/evil' } }) as Response,
      );

      await expect(safeFetch('https://example.com/start')).rejects.toThrow('Redirect blocked');
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should return non-redirect responses directly', async () => {
      const mockFetch = vi.mocked(global.fetch);
      mockFetch.mockResolvedValueOnce(
        new Response('content', { status: 200 }) as Response,
      );

      const response = await safeFetch('https://example.com/page');
      expect(response.status).toBe(200);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should return 4xx responses without following', async () => {
      const mockFetch = vi.mocked(global.fetch);
      mockFetch.mockResolvedValueOnce(
        new Response('not found', { status: 404 }) as Response,
      );

      const response = await safeFetch('https://example.com/missing');
      expect(response.status).toBe(404);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should validate the initial URL before fetching', async () => {
      await expect(safeFetch('http://localhost:3000')).rejects.toThrow('Blocked');
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });
});
