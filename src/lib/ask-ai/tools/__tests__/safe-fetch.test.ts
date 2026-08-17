import { describe, it, expect } from 'vitest';
import { validateUrl, validateUrlResolved, extractDomain } from '../safe-fetch';

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

    it('should reject CGNAT range (100.64.0.0/10)', () => {
      const result = validateUrl('http://100.64.0.1');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Private IP');
    });

    it('should reject benchmark range (198.18.0.0/15)', () => {
      const result = validateUrl('http://198.18.0.1');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Private IP');
    });

    it('should reject bracketed IPv6 loopback', () => {
      const result = validateUrl('http://[::1]');
      expect(result.valid).toBe(false);
    });

    it('should reject bracketed IPv6 link-local', () => {
      const result = validateUrl('http://[fe80::1]');
      expect(result.valid).toBe(false);
    });

    it('should reject IPv4-mapped IPv6 loopback', () => {
      const result = validateUrl('http://[::ffff:127.0.0.1]');
      expect(result.valid).toBe(false);
    });
  });

  describe('validateUrlResolved', () => {
    const resolveTo = (addresses: string[]) => async () => addresses;

    it('should reject localhost.localdomain (blocked hostname + DNS loopback)', async () => {
      const result = await validateUrlResolved(
        'http://localhost.localdomain',
        resolveTo(['127.0.0.1']),
      );
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Blocked');
    });

    it('should reject a DNS-rebinding hostname that resolves to loopback (nip.io)', async () => {
      const result = await validateUrlResolved(
        'http://127.0.0.1.nip.io',
        resolveTo(['127.0.0.1']),
      );
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Resolved IP');
    });

    it('should reject a hostname resolving to a private IPv6 address', async () => {
      const result = await validateUrlResolved(
        'http://internal.example.test',
        resolveTo(['fe80::1']),
      );
      expect(result.valid).toBe(false);
    });

    it('should allow a hostname resolving to a public IP', async () => {
      const result = await validateUrlResolved(
        'https://example.com',
        resolveTo(['93.184.216.34']),
      );
      expect(result.valid).toBe(true);
    });

    it('should allow a hostname resolving to a public IPv6 address', async () => {
      const result = await validateUrlResolved(
        'https://example.com',
        resolveTo(['2606:2800:220:1:248:1893:25c8:1946']),
      );
      expect(result.valid).toBe(true);
    });

    it('should block when any resolved address is private', async () => {
      const result = await validateUrlResolved(
        'https://split-horizon.example.test',
        resolveTo(['93.184.216.34', '10.0.0.5']),
      );
      expect(result.valid).toBe(false);
    });

    it('should fail closed when DNS resolution throws', async () => {
      const result = await validateUrlResolved('https://no-such-domain.test', async () => {
        throw new Error('ENOTFOUND');
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('DNS resolution failed');
    });

    it('should fail closed when DNS returns no addresses', async () => {
      const result = await validateUrlResolved('https://empty.test', resolveTo([]));
      expect(result.valid).toBe(false);
    });

    it('should allow a literal public IP without resolving', async () => {
      const resolve = async () => {
        throw new Error('must not be called');
      };
      const result = await validateUrlResolved('http://8.8.8.8', resolve);
      expect(result.valid).toBe(true);
    });

    it('should allow IPv4-mapped IPv6 of a public IP', async () => {
      const result = await validateUrlResolved('http://[::ffff:8.8.8.8]');
      expect(result.valid).toBe(true);
    });

    it('should reject CGNAT URL even without DNS (syntactic layer)', async () => {
      const result = await validateUrlResolved('http://100.64.0.1');
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
