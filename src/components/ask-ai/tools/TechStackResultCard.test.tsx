import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TechStackResultCard } from './TechStackResultCard';

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
      'tool.techstack.label': 'Technology Stack',
      'tool.techstack.detected': 'Detected Technologies',
      'tool.status.error': 'Error',
      'tool.copy': 'Copy',
      'tool.unknown': 'Unknown',
      'tool.techstack.server': 'Server',
      'tool.techstack.framework': 'Framework',
      'tool.techstack.cdn': 'CDN',
      'tool.techstack.analytics': 'Analytics',
    };
    return en[key] || key;
  }}),
}));

describe('TechStackResultCard', () => {
  const defaultResult = {
    url: 'https://example.com',
    server: 'cloudflare',
    framework: 'Next.js',
    cdn: 'Cloudflare',
    analytics: ['Google Analytics'],
    headers: [
      { name: 'Cloudflare', value: '...', hint: 'HTTP header: server' },
      { name: 'HSTS Enabled', value: '...', hint: 'HTTP header: strict-transport-security' },
    ],
  };

  it('should render the URL', () => {
    render(<TechStackResultCard result={defaultResult} />);
    expect(screen.getByText('https://example.com')).toBeDefined();
  });

  it('should render framework badge', () => {
    render(<TechStackResultCard result={defaultResult} />);
    expect(screen.getByText('Next.js')).toBeDefined();
  });

  it('should render server badge', () => {
    render(<TechStackResultCard result={defaultResult} />);
    expect(screen.getByText('cloudflare')).toBeDefined();
  });

  it('should render detected technologies count', () => {
    render(<TechStackResultCard result={defaultResult} />);
    expect(screen.getByText(/Detected Technologies \(2\)/)).toBeDefined();
  });

  it('should render error state', () => {
    const errorResult = { ...defaultResult, error: 'Connection failed', headers: [] };
    render(<TechStackResultCard result={errorResult} />);
    expect(screen.getByText('Connection failed')).toBeDefined();
  });

  it('should render "Technology Stack" label', () => {
    render(<TechStackResultCard result={defaultResult} />);
    expect(screen.getByText('Technology Stack')).toBeDefined();
  });
});
