# FAZ 50 — Ürün Görsel Yönetimi

## Amaç
Ürün görsellerini toplu yükle, ürünlerle eşleştir, sakla.

## Storage
- Cloudflare R2 (S3-uyumlu)
- Signed URL (güvenli, süreli)
- Lokal geliştirmede MinIO (docker-compose)

## 3 Eşleştirme Kuralı
1. **filename** — Dosya adı = product code (örn: `urun-001.jpg`)
2. **barcode** — Dosya adı = barkod (örn: `1234567890.jpg`)
3. **productCode** — Dosya adı = ürün kodu (Product.code)

## Backend

### ProductImagesService
- `list(tenantId, filters)` → sayfalanmış liste
- `getDashboard(tenantId)` → toplam ürün, görselli, görselsiz, MB kullanım
- `add(tenantId, input, userId)` → tek görsel ekle
- `remove(tenantId, id)` → soft delete
- `batchUpload(tenantId, files, matchBy, userId)` → toplu yükleme + eşleştirme

### Endpoint'ler
- `GET /product-images?productId=&isMain=&page=&pageSize=` → liste
- `GET /product-images/dashboard` → KPI
- `POST /product-images` → tek ekle
- `POST /product-images/batch-upload` → toplu
- `DELETE /product-images/:id` → sil

## Tablolar
- `ProductImage` (id, tenantId, productId, r2Key, url, thumbnailUrl, fileName, fileSize, mimeType, width, height, isMain, sortOrder, altText, uploadedById, isDeleted, deletedAt)
- `ImageUploadBatch` (id, tenantId, uploadedById, totalFiles, successCount, failedCount, status, matchBy, completedAt)
- `ImageMatchLog` (id, batchId, fileName, matched, productId, errorReason)

## ImageMatchLog Detay
Her dosya için:
- matched: true/false
- productId: eşleşen ürün
- errorReason: eşleşmediyse neden

## Dashboard Metrikleri
```ts
{
  totalProducts: number,
  totalImages: number,
  productsWithImages: number,  // distinct productId
  productsWithoutImages: number,
  storageUsedMB: number
}
```

## Frontend
- `ProductImagesPage` — KPI dashboard + 3 matchBy toggle + grid görünüm + toplu yükleme simülasyonu

## Permission Key'leri
- `product_images.view`, `product_images.upload`, `product_images.update`, `product_images.delete`

## Sık Sorulan Sorular

**S: "Görseller nerede saklanıyor?"**
C: Cloudflare R2 (S3-uyumlu). Lokal'de MinIO (docker-compose).

**S: "Toplu yükleme nasıl çalışıyor?"**
C: Dosya adından ürün eşleştirilir (3 kural). Eşleşen ImageUploadBatch başarılı, eşleşmeyen başarısız.

**S: "Ana görsel nasıl işaretlenir?"**
C: POST /product-images'da `isMain: true` gönderilir. Diğer ana görseller otomatik kaldırılır (sadece 1 ana olabilir).

**S: "Soft delete mi?"**
C: Evet, `isDeleted + deletedAt`. Bulk upload batch'inde cleanup için log tutulur.

**S: "Görsel sıkıştırma var mı?"**
C: Frontend'de html2canvas değil, browser native. R2'ye yüklemeden önce client-side resize önerilir (sonraki FAZ).

**S: "Kaç görsel bir ürüne?"**
C: Sınırsız (sortOrder ile sıralı). isMain ile 1 tane ana.
