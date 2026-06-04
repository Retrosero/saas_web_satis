# Teknoloji Stack'i

## Genel Mimari
Monorepo (pnpm workspace). 3 ana parça: Backend API, Frontend Web, Shared types.

```
apps/
  api/         — NestJS backend
  web/         — React frontend
packages/
  shared/      — Ortak types & enums
```

## Backend (`apps/api`)

### Framework
- **NestJS 10** — Modüler, dependency injection, decorator-based
- **Node.js 22+** — ESM, native fetch

### Database
- **PostgreSQL 16** — Ana veritabanı
- **Prisma 5** — ORM, type-safe queries, migration
- **Decimal** — Para birimi (Float ASLA)

### Cache & Queue
- **Redis 7** — Cache + Queue backend
- **ioredis** — Redis client
- **cache-manager** — NestJS cache abstraction
- **BullMQ** — Async job queue (mail, rapor, bulk)

### Search
- **Meilisearch v1.10** — Full-text search
- Sub-50ms response time
- Multi-tenant filter

### Storage
- **Cloudflare R2** — S3-uyumlu object storage (lokal'de MinIO)
- Signed URL'ler (güvenli, süreli)

### Real-time
- **Socket.io** — WebSocket gateway
- JWT auth middleware
- Multi-tenant rooms

### Auth
- **JWT** (jsonwebtoken) — access + refresh token
- **bcrypt** — Password hashing
- **@nestjs/throttler** — Rate limiting (FAZ 58)

### Observability
- **@sentry/node** — Error tracking
- **@opentelemetry/sdk-node** — Distributed tracing
- **OTLP HTTP exporter**

### Testing
- **Jest** — Backend unit/integration (35 test)
- **ts-jest** — TypeScript transform

### Validation
- **class-validator** — DTO validation
- **class-transformer** — Object transformation

### Documentation
- **@nestjs/swagger** — OpenAPI/Swagger
- **Swagger UI** — /api/docs

## Frontend (`apps/web`)

### Framework
- **React 18** — UI library
- **TypeScript 5** — Static typing
- **Vite 5** — Build tool, HMR

### Routing
- **react-router-dom 6** — Client-side routing
- Lazy loading + Suspense

### State Management
- **TanStack Query (React Query) 5** — Server state
- **Zustand** — Client state (auth, UI prefs)
- ❌ Redux kullanma

### Forms
- **react-hook-form 7** — Form state
- **zod** — Schema validation
- **@hookform/resolvers** — zod adapter

### HTTP
- **axios** — HTTP client
- Interceptors (auth, error, idempotency)

### UI
- **Tailwind CSS 3** — Utility-first styling
- **lucide-react** — Icon library
- **react-hot-toast** — Notifications

### Real-time
- **socket.io-client** — WebSocket client

### Charts
- **recharts** — Dashboard grafikleri (FAZ 31)

### Testing
- **Vitest 2** — Unit + component test (7 test)
- **@testing-library/react 16** — Component testing
- **@playwright/test** — E2E (4 test)

### PWA
- **vite-plugin-pwa** — Service worker, manifest
- **Workbox** — Caching strategy

### Build
- **@vitejs/plugin-react** — Fast Refresh
- Native ESM

## Shared (`packages/shared`)

### Types
- TypeScript types (interface, type)
- Tüm enum'lar (`QuoteStatus`, `CustomerRiskLevel`, etc.)
- Zod schema (validation)
- Tüm backend + frontend'de import

### Yapı
```
packages/shared/src/
  enums/
    ai.enum.ts
    bank.enum.ts
    customer.enum.ts
    faiz-44-52.enum.ts (ux-bulk)
    ...
  types/
    ai.ts
    bank.ts
    customer.ts
    ux-bulk.ts
    ...
  index.ts  (tüm export)
```

## Altyapı Servisleri (docker-compose)

| Servis | Port | Kullanım |
|--------|------|----------|
| postgres | 55432 | Ana DB |
| redis | 6379 | Cache + Queue |
| meilisearch | 7700 | Full-text search |
| minio | 9000/9001 | S3 alternatifi (lokal) |

## Paket Yönetimi
- **pnpm 9** — Monorepo workspace
- **Corepack** — pnpm sürüm yönetimi

## Build & Deploy
- TypeScript compiler (`tsc`)
- Vite (frontend)
- NestJS CLI (backend)
- GitHub Actions (CI/CD — test.yml)
