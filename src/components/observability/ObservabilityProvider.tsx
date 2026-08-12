'use client';

import { useEffect, type ReactNode } from 'react';
import { initPosthog } from '@/lib/observability/posthog';

interface ObservabilityProviderProps {
  children: ReactNode;
}

export function ObservabilityProvider({ children }: ObservabilityProviderProps) {
  useEffect(() => {
    initPosthog();
  }, []);
  return <>{children}</>;
}
