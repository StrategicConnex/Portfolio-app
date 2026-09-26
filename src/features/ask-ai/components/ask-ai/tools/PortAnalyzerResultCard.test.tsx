import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PortAnalyzerResultCard } from './PortAnalyzerResultCard';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: Record<string, unknown>) =>
      React.createElement('div', props as React.HTMLAttributes<HTMLDivElement>, children as React.ReactNode),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children),
}));

vi.mock('@/context/LanguageContext', () => ({
  useLanguage: () => ({ language: 'en', t: (key: string) => {
    const en: Record<string, string> = {
      'tool.port.label': 'Port Security',
      'tool.port.port': 'port',
      'tool.port.ports': 'ports',
      'tool.status.error': 'Error',
      'tool.copy': 'Copy',
      'tool.service': 'Service',
    };
    return en[key] || key;
  }}),
}));

describe('PortAnalyzerResultCard', () => {
  const defaultResult = {
    service: 'SSH',
    ports: [
      {
        port: 22,
        protocol: 'TCP' as const,
        service: 'SSH',
        description: 'Secure Shell - remote administration access',
        risk: 'high' as const,
        recommendation: 'Disable password auth, use key-only access.',
      },
    ],
  };

  it('should render the service name', () => {
    render(<PortAnalyzerResultCard result={defaultResult} />);
    const sshElements = screen.getAllByText('SSH');
    expect(sshElements.length).toBeGreaterThan(0);
    expect(sshElements[0].textContent).toBe('SSH');
  });

  it('should render port number and protocol', () => {
    render(<PortAnalyzerResultCard result={defaultResult} />);
    expect(screen.getByText('22/TCP')).toBeDefined();
  });

  it('should render risk badge', () => {
    render(<PortAnalyzerResultCard result={defaultResult} />);
    expect(screen.getByText('HIGH')).toBeDefined();
  });

  it('should render port count badge', () => {
    render(<PortAnalyzerResultCard result={defaultResult} />);
    expect(screen.getByText('1 port')).toBeDefined();
  });

  it('should render error state', () => {
    const errorResult = { service: 'unknown', ports: [], error: 'Service not found' };
    render(<PortAnalyzerResultCard result={errorResult} />);
    expect(screen.getByText('Service not found')).toBeDefined();
  });

  it('should handle multiple ports', () => {
    const multiResult = {
      service: 'HTTP',
      ports: [
        { port: 80, protocol: 'TCP' as const, service: 'HTTP', description: 'Unencrypted web', risk: 'medium' as const, recommendation: 'Redirect to HTTPS' },
        { port: 443, protocol: 'TCP' as const, service: 'HTTPS', description: 'Encrypted web', risk: 'low' as const, recommendation: 'Keep TLS 1.2+' },
      ],
    };
    render(<PortAnalyzerResultCard result={multiResult} />);
    expect(screen.getByText('2 ports')).toBeDefined();
  });
});
