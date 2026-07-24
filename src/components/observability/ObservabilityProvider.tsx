'use client';

import { useEffect, type ReactNode } from 'react';
import { initPosthog } from '@/lib/observability/posthog';
import { initSentry, captureError } from '@/lib/observability/sentry';

interface ObservabilityProviderProps {
  children: ReactNode;
}

export function ObservabilityProvider({ children }: ObservabilityProviderProps) {
  useEffect(() => {
    initPosthog();
    initSentry();
    const handleError = (event: PromiseRejectionEvent) => {
      captureError(
        event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
        { type: 'unhandledRejection' },
      );
    };
    window.addEventListener('unhandledrejection', handleError);
    return () => window.removeEventListener('unhandledrejection', handleError);
  }, []);
  return <>{children}</>;
}
