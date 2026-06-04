# FAZ 55 — DB Index Optimizasyonu

## Amaç
125 tabloda eksik index'leri ekle. Liste sayfaları 3-10x hızlansın.

## Migration
`apps/api/prisma/migrations/20260624000000_perf_indexes/migration.sql`

## 68 Yeni Index

### Composite Index'ler (tenantId + diğer)
- 29 indeksi olmayan tenantId'li model için
- Format: `CREATE INDEX IF NOT EXISTS "{Table}_{tenantId}_{...}_idx" ON "{Table}"("tenantId", "...")`

### Partial Index'ler (WHERE isDeleted = false)
```sql
Sale:    (tenantId, saleDate DESC), (tenantId, status), (tenantId, customerId)
Order:   (tenantId, status, orderDate DESC)
Collection: (tenantId, collectionDate DESC)
BankTransaction: (tenantId, transactionDate DESC)
Customer: (tenantId, isActive), (tenantId, name)
Product: (tenantId, status), (tenantId, categoryId)
```

### Event Sourcing Tabloları
- `CustomerMovement(tenantId, customerId)`, `(tenantId, createdAt DESC)`
- `StockMovement(tenantId, productId)`, `(tenantId, warehouseId)`, `(tenantId, createdAt DESC)`

### Log Tabloları
- `SecurityLog(tenantId, createdAt DESC)`, `(event, createdAt DESC)`, `(userId)`
- `NotificationLog(tenantId, status)`, `(userId, isRead)`
- `AIAuditLog(tenantId, createdAt DESC)`, `(userId, action)`

### GIN Index (JSONB)
- `Customer.metadata`, `Product.metadata`

## Query Profiling (PerfModule)

### QueryLoggerService
- Prisma `$on('query')` event handler
- Slow query threshold: 500ms
- Recent buffer: 200 sorgu
- Slow query buffer: 50 sorgu
- Stack trace yavaş sorgularda

### Endpoint'ler (4)
- `GET /perf-admin/queries/stats` → avg/p95/p99 latency (son 5dk)
- `GET /perf-admin/queries/recent?limit=` → son N sorgu
- `GET /perf-admin/queries/slow?limit=` → yavaş sorgular
- `DELETE /perf-admin/queries/clear` → buffer temizle

### Stats Yapısı
```ts
{
  totalQueries: number,
  last5MinCount: number,
  avgDuration: number,
  p95Duration: number,
  p99Duration: number,
  slowQueriesCount: number
}
```

## Frontend
- `/system/perf` sayfası — 4 KPI kartı + yavaş sorgu listesi + son sorgular

## Performans İpuçları
- Pagination: skip + take yerine cursor-based (TODO)
- N+1: her zaman `include` ile eager load
- JSONB: GIN index ile filtreleme
- Sort: `@@index([..., createdAt(sort: Desc)])` liste sayfaları için

## Sık Sorulan Sorular

**S: "Hangi sorgular en yavaş?"**
C: `/system/perf` sayfası veya `GET /perf-admin/queries/slow`.

**S: "Index nasıl eklenir?"**
C: Manuel migration dosyası yaz + `prisma migrate deploy` veya `prisma db push` (dev).

**S: "N+1 sorgu nasıl tespit edilir?"**
C: Prisma query log'da aynı tabloya çok fazla SELECT. `include` ile eager load yap.

**S: "Partial index ne zaman?"**
C: Soft delete tablosunda (isDeleted=false) veya nadir değerler (status=ARCHIVED gibi).

**S: "Composite index sırası önemli mi?"**
C: Evet! `(tenantId, status, createdAt DESC)` — soldan sağa filtreleme sırası.

**S: "JSONB nasıl sorgulanır?"**
C: `WHERE metadata->>'key' = 'value'` veya GIN index ile `metadata @> '{"key": "value"}'`.

**S: "Index çok fazla olursa?"**
C: Yazma (INSERT/UPDATE) yavaşlar. Read-heavy tablolarda agresif, write-heavy tablolarda az.

**S: "Index maintenance?"**
C: PostgreSQL otomatik. `REINDEX` gerekirse büyük data sonrası.
