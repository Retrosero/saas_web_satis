// OpenTelemetry ve Sentry başlatma — main.ts'den ÖNCE import edilmeli
import * as Sentry from '@sentry/node';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';

let otelStarted = false;
let sentryStarted = false;

export function initObservability() {
  // 1) OpenTelemetry (her zaman aktif)
  if (!otelStarted && process.env.OTEL_ENABLED !== 'false') {
    try {
      const otlpUrl = process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? 'http://localhost:4318/v1/traces';
      const sdk = new NodeSDK({
        traceExporter: new OTLPTraceExporter({ url: otlpUrl }),
        instrumentations: [getNodeAutoInstrumentations({
          '@opentelemetry/instrumentation-fs': { enabled: false },
        })],
      });
      sdk.start();
      otelStarted = true;
      console.log(`[OTEL] Started, exporting to ${otlpUrl}`);
      process.on('SIGTERM', () => { sdk.shutdown().catch(() => undefined); });
    } catch (e: any) {
      console.warn(`[OTEL] başlatılamadı: ${e.message}`);
    }
  }

  // 2) Sentry (DSN varsa)
  if (!sentryStarted && process.env.SENTRY_DSN) {
    try {
      Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV ?? 'development',
        release: process.env.APP_VERSION ?? 'dev',
        tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
        profilesSampleRate: 0.1,
        beforeSend(event) { return event; },
      });
      sentryStarted = true;
      console.log('[Sentry] Initialized');
    } catch (e: any) {
      console.warn(`[Sentry] başlatılamadı: ${e.message}`);
    }
  }
}

export { Sentry };
