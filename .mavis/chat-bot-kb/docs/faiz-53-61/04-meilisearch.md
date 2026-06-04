# FAZ 56 — Meilisearch Full-Text Search

## Amaç
Global arama + müşteri/ürün/satış listelerinde sub-50ms arama. Prisma `contains` yavaş (büyük data'da çöker).

## Stack
- **meilisearch** v1.10
- Docker'da `getmeili/meilisearch:v1.10` image
- Port 7700, masterKey

## 4 Index

### customers
- Filterable: tenantId, status
- Searchable: name, code, phone, email, taxNumber
- Sortable: createdAt, name

### products
- Filterable: tenantId, status, type
- Searchable: name, code
- Sortable: createdAt, name

### sales
- Filterable: tenantId, status
- Searchable: saleNumber, customerName
- Sortable: createdAt

### quotes
- Filterable: tenantId, status
- Searchable: quoteNumber, customerName
- Sortable: createdAt

## SearchService
- `indexDocument(indexName, doc)` → ekle
- `removeDocument(indexName, id)` → sil
- `bulkIndex(indexName, docs)` → toplu (reindex için)
- `search(tenantId, query, limit)` → multi-index paralel
- `reindexTenant(tenantId)` → tüm tenant'ı yeniden indeksle
- `getIndexStats()` → per-index counts

## Multi-Tenant İzolasyon
```ts
filter: [`tenantId = "${tenantId}"`]
```
Her sorguda zorunlu.

## Endpoint'ler (3)
- `GET /search?q=&limit=` → multi-index sonuçlar
- `GET /search/stats` → index istatistikleri
- `POST /search-admin/reindex` → tenant reindex

## Frontend
- `GlobalSearchBar` — Meilisearch öncelikli, Prisma fallback
- `/system/search` sayfası — sağlık + 4 index kartı + reindex

## Reindex Stratejisi
- Production'da: her create/update'de incremental index
- Lokal'de: `reindexTenant()` çağrısı yeterli
- Per-tenant: 5000 kayıt/endpoint limit (gerekirse pagination)

## Prisma Fallback
- Meilisearch bağlı değilse GlobalSearchService eski Prisma `contains` kullanır
- Fallback graceful, hata fırlatmaz

## Sık Sorulan Sorular

**S: "Meilisearch nerede çalışıyor?"**
C: Docker'da (port 7700, masterKey). Prod'da Meilisearch Cloud veya self-hosted.

**S: "Türkçe karakter desteği?"**
C: Evet, Meilisearch Unicode normalize eder. "İstanbul" araması "istanbul" eşleşir.

**S: "Typo tolerance?"**
C: Meilisearch varsayılan aktif. "Istanbul" → "İstanbul" eşleşir.

**S: "Yeni index nasıl eklenir?"**
C: `setupIndexes()` + `bulkIndex`. Schema'ya yeni alan ekle.

**S: "Index sync nasıl?"**
C: Şu an manuel reindex. TODO: Prisma middleware ile create/update'de otomatik index.

**S: "MeiliSearch API key?"**
C: masterKey. Prod'da rotasyon gerekir.

**S: "Cluster mode?"**
C: Meilisearch Enterprise. OSS single-node. Yeterli performans için.
