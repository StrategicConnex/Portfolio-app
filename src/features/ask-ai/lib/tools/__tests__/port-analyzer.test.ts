import { describe, it, expect } from 'vitest';
import { analyzePort, portAnalyzerSchema } from '../port-analyzer';

describe('portAnalyzer', () => {
  it('should validate schema', () => {
    const result = portAnalyzerSchema.parse({ service: 'SSH' });
    expect(result.service).toBe('SSH');
  });

  it('should reject empty service', () => {
    expect(() => portAnalyzerSchema.parse({ service: '' })).toThrow();
  });

  it('should return SSH port info', async () => {
    const result = await analyzePort({ service: 'SSH' });
    expect(result.service).toBe('SSH');
    expect(result.error).toBeUndefined();
    expect(result.ports.length).toBeGreaterThan(0);
    expect(result.ports[0].port).toBe(22);
    expect(result.ports[0].risk).toBe('high');
  });

  it('should return HTTP ports including 443', async () => {
    const result = await analyzePort({ service: 'HTTP' });
    expect(result.ports.some(p => p.port === 443)).toBe(true);
    expect(result.ports.some(p => p.port === 80)).toBe(true);
  });

  it('should return RDP with critical risk', async () => {
    const result = await analyzePort({ service: 'RDP' });
    expect(result.ports[0].risk).toBe('critical');
  });

  it('should handle service aliases', async () => {
    const webResult = await analyzePort({ service: 'web' });
    expect(webResult.ports.length).toBeGreaterThan(0);
  });

  it('should handle unknown services with fuzzy search', async () => {
    const result = await analyzePort({ service: 'unknown999' });
    expect(result.error).toBeDefined();
  });

  it('should return Modbus OT protocol', async () => {
    const result = await analyzePort({ service: 'Modbus' });
    expect(result.ports[0].port).toBe(502);
    expect(result.ports[0].risk).toBe('critical');
  });
});
