# Satış & Sipariş Modülleri

## 2. Stok/Ürün (Products)

**Backend:** `apps/api/src/modules/products/`
**Frontend:** `/products`, `/products/new`, `/products/:id`
**Prisma:** `Product`, `ProductBarcode`, `ProductPrice`, `Unit`, `Brand`, `ProductCategory`

### Endpoint'ler
- `GET /products` — Liste (search, category, hasStock, page)
- `GET /products/:id` — Detay
- `POST /products` — Yeni ürün
- `PATCH /products/:id` — Güncelle
- `DELETE /products/:id` — Soft delete
- `GET /products/:id/stock` — Depo bazlı stok
- `GET /products/:id/prices` — Fiyat listeleri
- `GET /products/:id/barcodes` — Barkodlar
- `GET /reports/stock-alerts` — Düşük stok

### Özellikler
- **Çoklu barkod** desteği
- **Kategori hiyerarşisi** (parent/child)
- **Çoklu fiyat listesi** (müşteri grubu bazlı)

---

## 3. Depo (Warehouses) + 39. Stok + 40. Stok Sayım

**Backend:** `apps/api/src/modules/warehouses/`, `stock/`
**Frontend:** `/warehouses`, `/stock/movements`, `/stock-count/*`
**Prisma:** `Warehouse`, `WarehouseStock`, `StockMovement`, `StockCount`, `StockCountLine`, `WarehouseTransfer`

### Endpoint'ler
- `GET /warehouses` — Depo listesi
- `POST /warehouses` — Yeni depo
- `GET /warehouses/:id/stock` — Depo stok durumu
- `GET /warehouses/:id/movements` — Hareketler
- `POST /warehouses/transfers` — Depo arası transfer
- `GET /stock/movements` — Tüm stok hareketleri
- `POST /stock/adjustments` — Stok düzeltme
- `GET /stock-count` — Sayım listesi
- `POST /stock-count` — Yeni sayım
- `POST /stock-count/:id/lines` — Sayım satırları
- `POST /stock-count/:id/approve` — Sayım onayı (fark varsa stok hareketi oluşturur)
- `GET /stock-count/differences` — Fark analizi

### Stok Hareket Tipleri
- `IN` — Giriş (satın alma, üretim, iade)
- `OUT` — Çıkış (satış, fire, transfer çıkış)
- `TRANSFER` — Depo arası
- `ADJUSTMENT` — Manuel düzeltme
- `COUNT` — Sayım farkı

### Event-Sourcing
**Stok = `SUM(IN) - SUM(OUT) + TRANSFER_IN - TRANSFER_OUT` per (product, warehouse)**

---

## 4. Satış (Sales)

**Backend:** `apps/api/src/modules/sales/`
**Frontend:** `/sales`, `/sales/new`, `/sales/:id`
**Prisma:** `Sale`, `SaleItem`, `SalePayment`

### Endpoint'ler
- `GET /sales` — Liste
- `POST /sales` — Yeni satış (stok düşer, cari hareket oluşur)
- `GET /sales/:id` — Detay
- `POST /sales/:id/cancel` — İptal (stok iade)
- `GET /reports/sales-trend` — Aylık ciro trendi
- `GET /reports/top-products` — En çok satanlar
- `GET /reports/profit-margin` — Kâr marjı

### Satış Akışı
1. Müşteri seç (veya yeni oluştur)
2. Ürün ekle (barkod veya arama)
3. Fiyat otomatik gelir (müşteri grubu bazlı)
4. Ödeme tipi seç (nakit, kart, vadeli, havale)
5. Kaydet → stok düşer + cari hareket oluşur

---

## 5. Sipariş (Orders)

**Backend:** `apps/api/src/modules/orders/`
**Frontend:** `/orders`, `/orders/new`, `/orders/:id`
**Prisma:** `Order`, `OrderItem`, `OrderStatusHistory`

### Endpoint'ler
- `GET /orders` — Liste
- `POST /orders` — Yeni sipariş
- `GET /orders/:id` — Detay
- `POST /orders/:id/approve` — Onayla
- `POST /orders/:id/ship` — Sevk et
- `POST /orders/:id/receive` — Teslim al
- `POST /orders/:id/cancel` — İptal
- `GET /orders/:id/history` — Durum geçmişi

### Sipariş Durumları
`DRAFT → PENDING → APPROVED → SHIPPED → RECEIVED → CLOSED`
veya herhangi bir adımda `CANCELLED`

---

## 35. Teklif (Quotes)

**Backend:** `apps/api/src/modules/quotes/`
**Frontend:** `/quotes`, `/quotes/new`, `/quotes/:id`
**Prisma:** `Quote`, `QuoteItem`, `QuoteStatusHistory`

### Endpoint'ler
- `GET /quotes` — Liste
- `POST /quotes` — Yeni teklif
- `GET /quotes/:id` — Detay (PDF export)
- `POST /quotes/:id/send` — Müşteriye gönder (email)
- `POST /quotes/:id/accept` — Müşteri kabul etti
- `POST /quotes/:id/reject` — Müşteri reddetti
- `POST /quotes/:id/convert-to-sale` → Satışa dönüştür
- `POST /quotes/:id/convert-to-order` → Siparişe dönüştür

### Teklif Durumları
`DRAFT → SENT → ACCEPTED / REJECTED / EXPIRED`
`ACCEPTED → CONVERTED (sale/order)`

---

## 37. İade (Returns)

**Backend:** `apps/api/src/modules/returns/`
**Frontend:** `/returns`, `/returns/new`, `/returns/:id`, `/returns/:id/approve`
**Prisma:** `Return`, `ReturnItem`, `ReturnReason`

### Endpoint'ler
- `GET /returns` — Liste
- `POST /returns` — Yeni iade (satışa bağlı)
- `GET /returns/:id` — Detay
- `POST /returns/:id/approve` → Onayla (stok iade + cari alacak)
- `POST /returns/:id/reject` → Reddet
- `GET /returns/reasons` — İade nedenleri listesi
