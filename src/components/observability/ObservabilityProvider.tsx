'use client';

import { useEffect, type ReactNode } from 'react';
import { initPosthog } from '@/lib/observability/posthog';
import { initSentry, captureError } from '@/lib/observability/sentry';
import {
  readConsent,
  subscribeConsent,
  type ConsentState,
} from '@/lib/consent';

interface ObservabilityProviderProps {
  children: ReactNode;
}

export function ObservabilityProvider({ children }: ObservabilityProviderProps) {
  useEffect(() => {
    // Error reporting is essential (not analytics) and always on; the SDK is
    // a no-op unless a DSN is configured.
    initSentry();

    // PostHog is non-essential analytics: it must not load before an explicit
    // consent decision (`unknown` counts as denied). Accepting from the banner
    // starts it without a reload.
    let posthogStarted = false;
    const maybeStartPosthog = (state: ConsentState) => {
      if (state !== 'granted' || posthogStarted) return;
      posthogStarted = true;
      initPosthog();
    };
    maybeStartPosthog(readConsent());
    const unsubscribe = subscribeConsent(maybeStartPosthog);

    const handleError = (event: PromiseRejectionEvent) => {
      captureError(
        event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
        { type: 'unhandledRejection' },
      );
    };
    window.addEventListener('unhandledrejection', handleError);
    return () => {
      unsubscribe();
      window.removeEventListener('unhandledrejection', handleError);
    };
  }, []);

  return <>{children}</>;
}
