# FAZ 53 — Redis Cache Katmanı

## Amaç
Read-heavy endpoint'leri Redis cache ile hızlandır. Dashboard %70 hızlanma hedefi.

## Stack
- **ioredis** (Redis client)
- **@nestjs/cache-manager**
- **cache-manager-redis-store**

## Mimari

### AppCacheModule (Global)
```ts
NestCacheModule.registerAsync({
  isGlobal: true,
  useFactory: async () => ({
    store: await redisStore({
      socket: { host: 'localhost', port: 6379 },
      ttl: 60_000
    })
  })
})
```

### CacheService
- `get<T>(key)`, `set<T>(key, value, ttlSeconds)`
- `invalidateTenant(tenantId, module?)` → pattern scan ile sil
- `invalidatePattern(pattern)` → glob pattern
- `getMetrics()` → hits, misses, sets, deletes, hitRate
- `ping()` → Redis sağlık
- `resetMetrics()` → sayaç sıfırla

### Key Standardı
```
tenant:{tenantId}:{module}:{key}
```
Örnek: `tenant:abc:customers:list:status=ACTIVE`

### Decorator'lar
- `@Cacheable({ module: 'customers', ttl: 60, keyFn: (req) => req.url })` → GET'te cache
- `@CacheEvict({ module: 'customers', pattern: 'tenant:{tenantId}:customers:*' })` → write'da invalidate

### CacheInterceptor (Global uygulanabilir)
- GET: cache varsa dön, yoksa handler'ı çalıştır + cache'le
- POST/PUT/DELETE: handler'ı çalıştır + invalidate pattern

## Endpoint'ler (4)
- `GET /cache-admin/metrics` → `{ hits, misses, sets, deletes, hitRate, total }`
- `GET /cache-admin/ping` → `{ ok: true }`
- `DELETE /cache-admin/tenant?module=...` → modül bazlı temizle
- `DELETE /cache-admin/all` → tüm cache'i temizle (super admin)
- `DELETE /cache-admin/metrics` → metrikleri sıfırla

## Frontend
- `/system/cache` sayfası — KPI dashboard + 9 modül temizleme butonu + TÜM temizle

## İlk Hedef Endpoint'ler
- Dashboard (5dk cache)
- Permission list (1 saat)
- Lookups (cari/ürün, 5dk)

## Sık Sorulan Sorular

**S: "Cache nerede?"**
C: Redis. Lokal'de docker-compose ile, prod'da Upstash/ElastiCache.

**S: "Cache hit oranı ne olmalı?"**
C: %60-80 hedef. <%50 ise TTL çok kısa veya pattern yanlış.

**S: "Cache invalidate ne zaman?"**
C: Write işlem sonrası otomatik (decorator ile). Manuel admin panelinden.

**S: "Bir tenant'ın tüm cache'i nasıl silinir?"**
C: `cacheService.invalidateTenant(tenantId, module?)` veya admin paneli.

**S: "Pattern nasıl yazılır?"**
C: Redis glob: `tenant:abc:customers:*`, `tenant:*:quotes:*` (tüm tenant'lar).

**S: "TTL stratejisi?"**
C: Dashboard 5dk, lookups 5dk, permissions 1h, raporlar 1dk.
