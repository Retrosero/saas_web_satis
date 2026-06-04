# FAZ 45 — Teklif Yönetimi

## Modül
QuotesService — Satış öncesi teklif oluşturma, takip, dönüşüm.

## Backend

### QuotesService
- 9 durumlu yaşam döngüsü: `DRAFT → SENT → VIEWED → ACCEPTED/REJECTED → CONVERTED_TO_ORDER/CONVERTED_TO_SALE`
- `validUntil` kontrolü (süresi dolmuş teklif dönüştürülemez)
- Status log: her geçiş `QuoteStatusLog`'a kaydedilir

### Endpoint'ler
- `GET /quotes?status=&customerId=&from=&to=&page=&pageSize=` → listeleme
- `GET /quotes/:id` → detay (items + statusLogs)
- `POST /quotes` → oluştur
- `PUT /quotes/:id/status` → durum değiştir (note ile)
- `POST /quotes/:id/convert-to-order` → Order'a dönüştür
- `POST /quotes/:id/convert-to-sale` → Sale'e dönüştür
- `DELETE /quotes/:id` → soft delete

### Convert Logic
- Teklif `ACCEPTED` durumundaysa ve süresi dolmamışsa
- Order: yeni Order + OrderItem oluşturur
- Sale: yeni Sale + SaleItem oluşturur
- Teklif `CONVERTED_TO_ORDER/SALE` olarak işaretlenir
- `convertedRefType + convertedRefId` ile referans tutulur

## Tablolar
- `Quote` (id, tenantId, quoteNumber, customerId, customerName, quoteDate, validUntil, currency, subTotal, vatTotal, grandTotal, status, sentAt, viewedAt, acceptedAt, rejectedAt, convertedAt, convertedRefType, convertedRefId, ...)
- `QuoteItem` (id, quoteId, productId, productCode, productName, quantity, unitPrice, vatRate, discountRate, lineTotal, sortOrder)
- `QuoteStatusLog` (id, quoteId, fromStatus, toStatus, actorId, note, createdAt)

## Frontend
- `QuotesListPage` — liste + durum filtresi + arama
- `QuoteFormPage` — yeni teklif (müşteri + ürün + miktar + KDV)
- `QuoteDetailPage` — detay, durum geçişi, yazdırma, dönüştürme

## Permission Key'leri
- `quotes.view`, `quotes.create`, `quotes.update`, `quotes.delete`
- `quotes.convert_to_order`, `quotes.convert_to_sale`
- `quotes.export_pdf`

## Sık Sorulan Sorular

**S: "Teklif numarası nasıl üretiliyor?"**
C: Format: `TKL-{timestamp son 8 hane}`. Örnek: `TKL-12345678`.

**S: "Teklifi silebilir miyim?"**
C: Evet, soft delete (`isDeleted: true, deletedAt: now()`). Geri alma yok ama arşivden rapor alınabilir.

**S: "Teklif süresi dolmuşsa ne olur?"**
C: `convert-to-order` ve `convert-to-sale` reddedilir (BadRequestException). Önce `validUntil`'i güncellemek gerekir.

**S: "Birden fazla kez dönüştürebilir miyim?"**
C: Hayır. Dönüştürülmüş teklif (`CONVERTED_TO_*`) status'u değiştirilemez.

**S: "KDV nasıl hesaplanıyor?"**
C: `vatTotal = Σ (quantity × unitPrice × (1 - discountRate/100) × vatRate/100)`. `grandTotal = subTotal + vatTotal`.

**S: "Teklifi PDF olarak indirebilir miyim?"**
C: FAZ 45'te server-side HTML template + browser print. Custom PDF kütüphanesi yok (puppeteer YOK, performans için).
