# Docker Servisleri

## docker-compose.yml İçeriği

```yaml
services:
  postgres:       # Ana veritabanı
  redis:          # Cache + Queue
  meilisearch:    # Full-text search (FAZ 56)
  minio:          # S3 alternatifi (lokal geliştirme)
```

## Servis Detayları

### PostgreSQL 16
- **Image**: `postgres:16-alpine`
- **Port**: 55432 (lokal), 5432 (container içi)
- **Volume**: `postgres-data`
- **Credentials**: saas / saas / saas_dev
- **Healthcheck**: `pg_isready`
- **Production**: Neon / Supabase / RDS

### Redis 7
- **Image**: `redis:7-alpine`
- **Port**: 6379
- **Volume**: `redis-data`
- **Healthcheck**: `redis-cli ping`
- **Kullanım**:
  - Cache (FAZ 53)
  - BullMQ Queue (FAZ 54)
  - Throttler storage (FAZ 58)
  - Idempotency keys (FAZ 58)
- **Production**: Upstash / ElastiCache / Redis Cloud

### Meilisearch v1.10
- **Image**: `getmeili/meilisearch:v1.10`
- **Port**: 7700
- **Volume**: `meili-data`
- **Master Key**: `masterKey` (lokal)
- **Healthcheck**: `wget /health`
- **Production**: Meilisearch Cloud veya self-hosted

### MinIO
- **Image**: `minio/minio`
- **Port**: 9000 (API), 9001 (Console)
- **Volume**: `minio-data`
- **Credentials**: minioadmin / minioadmin
- **Kullanım**: R2 alternatifi (lokal development)
- **Production**: Cloudflare R2 / AWS S3

## Komutlar

```bash
# Tüm servisleri başlat
docker-compose up -d

# Servisleri durdur
docker-compose down

# Loglar
docker-compose logs -f postgres

# Sadece postgres + redis (minimum)
docker-compose up -d postgres redis

# Tüm verileri sil (DİKKAT!)
docker-compose down -v
```

## Production Setup

### Environment Variables
```bash
# Backend
DATABASE_URL=postgresql://user:pass@host:5432/db
REDIS_HOST=redis.example.com
REDIS_PORT=6379
MEILISEARCH_HOST=https://meili.example.com
MEILISEARCH_API_KEY=xxx
R2_ACCOUNT_ID=xxx
R2_ACCESS_KEY=xxx
R2_SECRET_KEY=xxx
R2_BUCKET=saas-uploads
JWT_SECRET=xxx-secret
SENTRY_DSN=https://xxx@sentry.io/xxx
OTEL_EXPORTER_OTLP_ENDPOINT=https://otel.example.com

# Frontend
VITE_API_BASE_URL=https://api.example.com/api/v1
VITE_WS_URL=wss://api.example.com
VITE_SENTRY_DSN=https://xxx@sentry.io/xxx
VITE_APP_VERSION=1.0.0
```

### Reverse Proxy (nginx)
```nginx
# API + WebSocket
location /api/ {
  proxy_pass http://nestjs:3000;
}
location /socket.io/ {
  proxy_pass http://nestjs:3000;
  proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection "upgrade";
}

# Frontend (static)
location / {
  root /var/www/saas-web/dist;
  try_files $uri /index.html;
}
```

## Monitoring

### Health Check Endpoint
```bash
curl http://localhost:3000/api/v1/health
```

### Her servisin healthcheck
- Postgres: `pg_isready`
- Redis: `redis-cli ping`
- Meilisearch: `wget /health`
- MinIO: `/minio/health/live`

## Sık Sorulan Sorular

**S: "Production'da docker-compose kullanılır mı?"**
C: Hayır, production'da managed servisler (Neon, Upstash, Cloudflare R2) önerilir. Docker-compose sadece lokal.

**S: "Redis kalıcı mı?"**
C: Volume ile persist edilir. `docker-compose down` korur, `down -v` siler.

**S: "Meilisearch olmadan çalışır mı?"**
C: Evet, Prisma fallback. Performans düşer ama fonksiyonel çalışır.

**S: "MinIO gerekli mi?"**
C: Lokal'de R2 alternatifi. Production'da gerekmez (gerçek R2 kullanılır).

**S: "Postgres volume'ü silince?"**
C: TÜM veri silinir. Yedek almadan ASLA `down -v` yapma.

**S: "Production log'ları?"**
C: Pino logger → Sentry + OTEL → Datadog/Honeycomb. Local'de console.

**S: "Scaling?"**
C: NestJS stateless → multiple instance. Redis adapter ile WebSocket horizontal scale. Postgres read replica. CDN (CloudFlare) static assets.
