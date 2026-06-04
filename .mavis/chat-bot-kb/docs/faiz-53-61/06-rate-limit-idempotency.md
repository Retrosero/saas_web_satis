# FAZ 58 — Rate Limiting + Idempotency

## Rate Limiting

### @nestjs/throttler v6
3 katmanlı limit (global):
- `short`: 10 req/sec
- `medium`: 100 req/min
- `long`: 1000 req/hour

APP_GUARD olarak global aktif.

### Plan Bazlı Override
```ts
PLAN_LIMITS = {
  starter:     { perMinute: 60,   perHour: 500 },
  pro:         { perMinute: 300,  perHour: 5000 },
  enterprise:  { perMinute: 1000, perHour: 20000 },
  super_admin: { perMinute: 5000, perHour: 100000 }
}
```

`@Throttle({ default: { limit: 60, ttl: 60000 } })` ile özelleştirilebilir.

## Idempotency

### IdempotencyKey Tablosu
```prisma
model IdempotencyKey {
  key         String    @unique  // {tenantId}:{key}
  tenantId    String
  fingerprint String    // SHA-256(method + url + body)
  method      String
  url         String
  status      String    // PROCESSING | COMPLETED | FAILED
  statusCode  Int?
  response    Json?
  createdAt   DateTime
  completedAt DateTime?
  expiresAt   DateTime?  // 24h TTL
}
```

### Middleware Akışı

1. POST/PUT/DELETE/PATCH + `Idempotency-Key` header varsa
2. Key 8-128 karakter olmalı
3. SHA-256 fingerprint oluştur (method + url + body)
4. DB'den key'i ara
   - **Yok**: PROCESSING olarak kaydet, response'u intercept et
   - **COMPLETED + aynı fingerprint**: cached response'u dön (`Idempotent-Replay: true`)
   - **COMPLETED + farklı fingerprint**: 400 BadRequest (çakışma)
   - **PROCESSING**: 409 Conflict (Retry-After: 2)
5. Handler çalışınca status COMPLETED + response kaydet

### Örnek Kullanım
```ts
// Frontend
const response = await apiClient.post('/payments', data, {
  headers: { 'Idempotency-Key': `${userId}-${orderId}-${Date.now()}` }
});
// Aynı key ile tekrar istek → aynı response (server'da işlem tekrarı yok)
```

### Endpoint'ler (3)
- `GET /idempotency-admin/stats` → total/processing/completed/expired
- `GET /idempotency-admin/keys?limit=` → son N key
- `DELETE /idempotency-admin/cleanup` → süresi dolmuşları sil

## Frontend
- Plan bazlı UI gösterimi (TODO)
- 429 Too Many Requests toast
- 409 Conflict retry mekanizması

## Sık Sorulan Sorular

**S: "Rate limit nerede uygulanıyor?"**
C: Global APP_GUARD. Tüm endpoint'ler etkilenir.

**S: "Plan değişince limit değişir mi?"**
C: Şu an default 100/min. Plan override TODO (FAZ 32 plan modülü ile entegre edilebilir).

**S: "Idempotency key formatı?"**
C: 8-128 karakter, herhangi bir string. Best practice: UUID v4.

**S: "Idempotency response ne zaman saklanır?"**
C: Handler başarılı (2xx) veya başarısız (4xx/5xx) olduğunda. 24 saat boyunca.

**S: "Çift ödeme nasıl önlenir?"**
C: Frontend'de `Idempotency-Key: orderId` gönder, server'da aynı key varsa cached response.

**S: "Per-tenant rate limit?"**
C: Şu an global (IP bazlı). Per-tenant override TODO.

**S: "Failed job expired mi?"**
C: Süresi dolmuş kayıtlar 7 gün sonra otomatik silinebilir (cleanup endpoint).
