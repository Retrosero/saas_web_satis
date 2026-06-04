# FAZ 59 — Sentry + OpenTelemetry

## Amaç
Prod hata takibi + performans tracing. Sorunları saatler/günler içinde değil, dakikalar içinde gör.

## 2 Sistem

### 1) Sentry (Hata Takibi)
- `@sentry/node` (backend), `@sentry/react` (frontend)
- DSN env ile opsiyonel (yoksa pasif)
- 5xx otomatik capture, 4xx ignore
- User context: tenantId, userId, email
- Source map upload (sentry-cli)
- Session replay (sentry.io)

### 2) OpenTelemetry (Tracing)
- `@opentelemetry/sdk-node`
- `@opentelemetry/auto-instrumentations-node` (HTTP, Prisma, BullMQ otomatik)
- `@opentelemetry/exporter-trace-otlp-http`
- Default endpoint: `http://localhost:4318/v1/traces`
- OTEL_ENABLED=false ile kapatılabilir

## Mimari

### Backend (instrument.ts)
```ts
// main.ts'den ÖNCE import edilir
import './instrument';
import { initObservability } from './instrument';
initObservability();
```

### SentryInterceptor (APP_INTERCEPTOR)
```ts
intercept(context, next) {
  const span = tracer.startSpan(`${req.method} ${req.url}`, {
    attributes: { tenantId, userId }
  });
  return next.handle().pipe(
    catchError((err) => {
      span.recordException(err);
      if (5xx) Sentry.captureException(err);
      throw err;
    })
  );
}
```

## Endpoint'ler (2)
- `GET /observability/health` → `{ otel, sentry, env, version }`
- `POST /observability/test-error` → test (sentry/http/unhandled)

## Frontend
- `lib/sentry.ts`:
  - `initSentry()` — DSN env varsa başlat
  - `captureError`, `captureMessage` helpers
  - `useSentryUser(user)` — user context set
- `components/error/ErrorBoundary.tsx`:
  - Class component, fallback UI
  - captureError + reload button
- `main.tsx`:
  - `initSentry()`
  - `<ErrorBoundary><App/></ErrorBoundary>`

## /system/observability Sayfası
4 KPI kartı + 4 test butonu (backend sentry, backend 500, frontend sentry, frontend error)

## Ortam Değişkenleri
```bash
# Backend
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_TRACES_SAMPLE_RATE=0.1
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318/v1/traces
OTEL_ENABLED=true

# Frontend
VITE_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
VITE_APP_VERSION=1.0.0
```

## Sık Sorulan Sorular

**S: "Sentry zorunlu mu?"**
C: Hayır, DSN env yoksa pasif. Console'a "DSN yok" yazılır.

**S: "OpenTelemetry her zaman aktif mi?"**
C: Evet, OTEL_ENABLED=false ile kapatılabilir. Default açık.

**S: "Trace'ler nereye gidiyor?"**
C: OTLP HTTP endpoint. Default localhost:4318 (Jaeger/Zipkin/collector). Prod'da Datadog/Honeycomb.

**S: "Source map nereye?"**
C: sentry-cli ile build sonrası `sentry-cli sourcemaps upload`. CI'da.

**S: "4xx hatalar Sentry'ye gider mi?"**
C: Hayır, sadece 5xx. 4xx kullanıcı hatası, noisy.

**S: "PII (kişisel veri)?"**
C: Sentry beforeSend hook'u ile maskelenebilir. Şu an yok, TODO.

**S: "Session replay?"**
C: Sentry.io ücretli özellik. Free tier yok.

**S: "Sentry maliyeti?"**
C: 5K event/ay free, sonra ~$26/ay (Team plan). 100K event için ~$80/ay.
