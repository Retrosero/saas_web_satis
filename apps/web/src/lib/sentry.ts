import * as Sentry from '@sentry/react';
import { useEffect } from 'react';

export function initSentry() {
  const dsn = (import.meta.env.VITE_SENTRY_DSN as string) ?? '';
  if (!dsn) { console.log('[Sentry] DSN yok, devre dışı'); return; }
  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    release: import.meta.env.VITE_APP_VERSION ?? 'dev',
    tracesSampleRate: 0.1,
    integrations: [Sentry.browserTracingIntegration()],
  });
  console.log('[Sentry] Initialized');
}

export function captureError(err: Error, context?: Record<string, any>) { Sentry.captureException(err, { extra: context }); }
export function captureMessage(msg: string, level: 'info' | 'warning' | 'error' = 'info') { Sentry.captureMessage(msg, level); }

export const SentryErrorBoundary = Sentry.ErrorBoundary;

// Hook: user context set
export function useSentryUser(user: { id: string; email?: string; tenantId?: string } | null) {
  useEffect(() => {
    if (user) Sentry.setUser({ id: user.id, email: user.email, tenantId: user.tenantId });
    else Sentry.setUser(null);
  }, [user]);
}
