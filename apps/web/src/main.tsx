import { StrictMode } from 'react';
import { initSentry } from './lib/sentry';
import { ErrorBoundary } from './components/error/ErrorBoundary';;
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/globals.css';
import { registerSW } from 'virtual:pwa-register';

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element not found');

createRoot(rootEl).render(
  <StrictMode>
    <ErrorBoundary><App /></ErrorBoundary>
  </StrictMode>,
);

// PWA service worker
if (import.meta.env.PROD) {
  registerSW({ immediate: true });
}
