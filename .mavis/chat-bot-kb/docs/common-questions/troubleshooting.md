# Sık Karşılaşılan Sorunlar

## Build Hataları

### "Property 'X' does not exist on type 'Y'"
- Prisma schema'da field yok
- Çözüm: `npx prisma generate` çalıştır
- Veya: `npx prisma validate` ile schema kontrol et

### "Type 'X' is not assignable to type 'Y'"
- Prisma type casting gerekli (Decimal vs Number)
- Çözüm: `Number(field)` veya `field as any`

### "Object literal may only specify known properties"
- Prisma create/update input'a fazla alan eklenmiş
- Çözüm: alanı kaldır veya `as any` cast

### "Multi-line enum parse error"
- `enum X { A B C }` TEK SATIR — HATA
- Çözüm: multi-line yap
```prisma
enum X {
  A
  B
  C
}
```

### "TS18046: 'q' is of type 'unknown'"
- API response type belirtilmemiş
- Çözüm: generic ekle `useQuery<{ items: Quote[] }>(...)`

### "Module not found '@saas/shared'"
- packages/shared build edilmemiş
- Çözüm: `pnpm --filter @saas/shared build`

## Database Hataları

### "relation does not exist"
- Migration çalıştırılmamış
- Çözüm: `cd apps/api && npx prisma migrate deploy`

### "column 'X' does not exist"
- Prisma generate edilmemiş
- Çözüm: `npx prisma generate`

### "duplicate key value violates unique constraint"
- Unique constraint ihlal edildi
- Çözüm: kodu benzersiz yap veya farklı tenant kullan

### "Foreign key constraint violated"
- İlişkili kayıt var, silinemez
- Çözüm: soft delete kullan (default)

## Runtime Hataları

### "Redis connection refused"
- Redis çalışmıyor
- Çözüm: `docker-compose up -d redis`

### "Meilisearch connection refused"
- Meilisearch çalışmıyor
- Çözüm: `docker-compose up -d meilisearch`
- Fallback: Prisma ile çalışır (yavaş)

### "Sentry DSN yok"
- Sentry devre dışı (uyarı)
- Çözüm: env'e SENTRY_DSN ekle veya yok say

### "WebSocket cannot connect"
- Backend CORS ayarı yanlış
- Çözüm: WebSocketGateway cors: { origin: '*' }

### "Permission denied (403)"
- Kullanıcının permission'ı yok
- Çözüm: UserRole tablosuna role ekle veya permission ekle

## Frontend Hataları

### "Cannot find module '@/...'"
- tsconfig path alias yok
- Çözüm: tsconfig.json'da `paths: { "@/*": ["src/*"] }`

### "Hydration mismatch"
- Server/client render farkı
- Çözüm: dynamic import + useEffect kontrol

### "TypeError: Cannot read property 'X' of undefined"
- API response beklenen field yok
- Çözüm: optional chaining (`?.`) veya default değer

## Performance Sorunları

### "Dashboard yavaş"
- Cache eksik
- Çözüm: FAZ 53 — Redis cache ekle (5dk TTL)
- Slow query analizi: `/system/perf`

### "Arama yavaş (>500ms)"
- Prisma contains kullanılıyor
- Çözüm: FAZ 56 — Meilisearch kullan
- Index ekle: `@@index([tenantId, isDeleted, name])`

### "Toplu işlem timeout"
- 10K+ kayıt
- Çözüm: FAZ 54 — BullMQ queue kullan

### "Bakiye hesaplama yavaş"
- Movements tablosu büyümüş
- Çözüm: Redis cache + composite index

## Migration Sorunları

### "Migration failed at X"
- Veri uyumsuz (NOT NULL ama null var)
- Çözüm: Default değer ekle veya veri düzelt

### "Migration conflict"
- Birden fazla develop aynı migration'ı düzenledi
- Çözüm: Manuel birleştir veya squash

### "Schema out of sync with migration"
- Prisma generate edilmemiş
- Çözüm: `npx prisma generate` + restart IDE

## Test Sorunları

### "Redis açık handle warning (Jest)"
- Redis singleton olduğu için
- Çözüm: `--forceExit` veya önemsiz (test geçiyor)

### "Prisma generate edilmemiş"
- Test sırasında tip yok
- Çözüm: `npx prisma generate` önce

### "Test database bağlantısı yok"
- Test sırasında gerçek DB'ye bağlanmaya çalışıyor
- Çözüm: Prisma mock'la

## Production Sorunları

### "502 Bad Gateway"
- Backend çökmüş
- Çözüm: PM2/systemd ile restart, logları kontrol et

### "Out of memory"
- Memory leak
- Çözüm: `--max-old-space-size=4096` veya process restart

### "Slow first request"
- JIT compilation
- Çözüm: warmup request veya `--always-compile`

## Sık Yapılan Hatalar (Kod Seviyesi)

❌ **Yanlış**: `tenantId` body'den alınır
```ts
@Post() create(@Body() body) { return this.svc.create(body.tenantId, body); }
```
✅ **Doğru**: `req.user.tenantId` her zaman
```ts
@Post() create(@Req() req, @Body() body) { return this.svc.create(req.user.tenantId, body); }
```

❌ **Yanlış**: Float para birimi
```prisma
balance Float
```
✅ **Doğru**: Decimal
```prisma
balance Decimal
```

❌ **Yanlış**: Fiziksel silme
```ts
await prisma.customer.delete({ where: { id } });
```
✅ **Doğru**: Soft delete
```ts
await prisma.customer.update({ where: { id }, data: { isDeleted: true, deletedAt: new Date() } });
```

❌ **Yanlış**: Tek satır enum
```prisma
enum Status { DRAFT SENT ACCEPTED }
```
✅ **Doğru**: Multi-line
```prisma
enum Status {
  DRAFT
  SENT
  ACCEPTED
}
```

❌ **Yanlış**: Mevcut component'in yerine yeni yazmak
```tsx
<div className="bg-white border rounded p-4">...</div>
```
✅ **Doğru**: Reusable component kullan
```tsx
<EmptyState title="Veri yok" action={...} />
```

❌ **Yanlış**: N+1 sorgu
```ts
for (const id of ids) { await prisma.product.findUnique({ where: { id } }); }
```
✅ **Doğru**: include + findMany
```ts
const products = await prisma.product.findMany({ where: { id: { in: ids } }, include: { category: true } });
```

❌ **Yanlış**: Empty catch
```ts
try { ... } catch {}
```
✅ **Doğru**: Log + handle
```ts
try { ... } catch (e) { logger.error(e); throw new BadRequestException('İşlem başarısız'); }
```
