# FAZ 48 — Toplu İşlemler (Bulk Operations)

## Amaç
Yüzlerce-binlerce kaydı tek işlemle güncelle. Preview→Confirm→Execute→Rollback akışı.

## 10 İşlem Tipi
- **PRICE_UPDATE** — Toplu fiyat güncelleme (yüzdelik veya sabit değer)
- **CATEGORY_CHANGE** — Toplu kategori değiştirme
- **BRAND_ASSIGN** — Toplu marka atama
- **PRODUCT_DEACTIVATE** — Toplu pasif yapma
- **CUSTOMER_DEACTIVATE** — Toplu cari pasif yapma
- **TAG_ASSIGN** — Toplu etiket atama
- **EXPORT_BULK** — Toplu export
- **STATUS_UPDATE** — Toplu durum güncelleme
- **PRICE_LIST_ASSIGN** — Toplu fiyat listesi atama
- **WAREHOUSE_UPDATE** — Toplu depo transferi

## 4 Adımlı Akış

### 1) Preview
- Filtreler verilir (örn: `status=ACTIVE, categoryId=X`)
- Eşleşen kayıt sayısı döner
- 5 örnek kayıt gösterilir

### 2) Create
- DRAFT durumunda operation kaydı
- Filtre + update bilgisi saklanır
- Snapshot (rollback için) henüz alınmaz

### 3) Execute
- Status `RUNNING`
- Snapshot alınır (BulkOperationItem.beforeState)
- Her kayıt update edilir
- 100'lü batch'ler halinde işlenir
- Status `COMPLETED` veya `FAILED`
- Log: success/failed count

### 4) Rollback
- Sadece COMPLETED işlemler için
- BulkOperationItem.beforeState kullanılarak geri alınır
- Status `ROLLED_BACK`

## Backend

### BulkOperationsService
- `list(tenantId, filters)` → tüm işlemler
- `preview(tenantId, type, filters, update)` → eşleşen sayı + örnekler
- `create(tenantId, name, type, filters, update, userId)` → DRAFT
- `execute(tenantId, id, userId)` → RUNNING → COMPLETED
- `rollback(tenantId, id, userId)` → ROLLED_BACK

### Snapshot/Rollback
- Ürün update'inde `p.unitPrice` kullanılır (Product'ta `salePrice` yok)
- `BulkOperationItem` tablosunda her satır için `beforeState` (JSON) saklanır
- Rollback'te `prisma.product.update({ data: beforeState })` ile geri alınır

## Tablolar
- `BulkOperation` (id, tenantId, name, type, status, filters, update, totalMatched, totalProcessed, totalSuccess, totalFailed, batchId, errorMessage, startedAt, completedAt, rolledBackAt, approvedAt, approvedById, createdById)
- `BulkOperationItem` (id, operationId, entityType, entityId, beforeState, afterState, status, error, processedAt)
- `BulkOperationLog` (id, operationId, action, actorId, details)

## BulkOperationStatus
- `DRAFT`, `RUNNING`, `COMPLETED`, `FAILED`, `ROLLED_BACK`, `APPROVED`

## Endpoint'ler
- `GET /bulk-operations?type=&status=&page=&pageSize=` → liste
- `POST /bulk-operations/preview` → önizleme
- `POST /bulk-operations` → yeni
- `POST /bulk-operations/:id/execute` → çalıştır
- `POST /bulk-operations/:id/rollback` → geri al

## Frontend
- `BulkOperationsPage` — liste, yeni oluştur modal (tip + filtre + update), execute/rollback butonları

## Permission Key'leri
- `bulk_operations.view`, `.create`, `.approve`, `.rollback`

## Performans
- 100'lü batch (her iterasyonda 100 kayıt)
- 10.000 kayıt = ~30s (ürün güncelleme hızına bağlı)
- BullMQ ile arka planda çalıştırılabilir (FAZ 54)

## Sık Sorulan Sorular

**S: "Toplu işlem geri alınabilir mi?"**
C: Evet, COMPLETED olanlar için. Snapshot BulkOperationItem.beforeState'te saklanır.

**S: "Kaç kayıt tek seferde işlenebilir?"**
C: 100'lü batch. 10.000+ için BullMQ önerilir (FAZ 54'te queue mevcut).

**S: "Onay mekanizması var mı?"**
C: approvedAt + approvedById alanı var, `bulk_operations.approve` permission key'i ile. UI'da onay akışı eklenebilir.

**S: "Hata olursa ne olur?"**
C: Hata olan kayıt `FAILED` olarak işaretlenir, işlem devam eder. Toplam success/failed count döner. Tüm batch failed olursa status `FAILED`.

**S: "Filtre nasıl tanımlanır?"**
C: JSON object: `{ status: 'ACTIVE', categoryId: 'cat-1', brandId: 'brand-2' }`. Prisma where clause'a direkt geçer.
