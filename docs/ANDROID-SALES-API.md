# Android Satış Uygulaması — API Referans Dokümanı

> **Base URL:** `http://<sunucu>:3000/api/v1`
> **Auth:** Tüm endpoint'ler JWT gerektirir → `Authorization: Bearer <access_token>`

---

## İçindekiler

1. [Kimlik Doğrulama](#1-kimlik-doğrulama)
2. [Cari Yönetimi](#2-cari-ydotmemi)
3. [Satış](#3-satış)
4. [Sipariş](#4-sipariş)
5. [İade](#5-iade)
6. [Tahsilat](#6-tahsilat)
7. [Stok](#7-stok)
8. [Raporlar](#8-raporlar)
9. [Ürün & Depo](#9-üritem--depo)
10. [Genel Arama](#10-genel-arama)
11. [Hata Kodları](#11-hata-kodları)
12. [Enum Referansı](#12-enum-referansı)

---

## 1. Kimlik Doğrulama

### `POST /auth/login`
Kullanıcı girişi — JWT token al.

**Request:**
```json
{
  "email": "kullanici@firma.com",
  "password": "şifre123"
}
```

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 86400,
  "user": {
    "id": "usr_xxxx",
    "email": "kullanici@firma.com",
    "name": "Ahmet Yılmaz",
    "tenantId": "ten_xxxx",
    "role": "ADMIN",
    "permissions": ["sales:view", "sales:create", "customers:view"]
  }
}
```

---

### `POST /auth/register`
Yeni tenant + kullanıcı oluştur (kurulum için).

**Request:**
```json
{
  "email": "yonetici@firma.com",
  "password": "GüçlüŞifre123!",
  "name": "Firma Adı",
  "tenantName": "Firma Adı Ltd."
}
```

---

### `GET /auth/me`
Giriş yapmış kullanıcı bilgisi.

**Response (200):**
```json
{
  "id": "usr_xxxx",
  "email": "kullanici@firma.com",
  "name": "Ahmet Yılmaz",
  "tenantId": "ten_xxxx",
  "role": "ADMIN"
}
```

---

## 2. Cari Yönetimi

> **Controller:** `apps/api/src/modules/customers/customers.controller.ts`
> **Path:** `/customers`

### `GET /customers`
Sayfalı, filtreli cari listesi.

| Query Param | Tip | Açıklama |
|-------------|-----|----------|
| `page` | number | Sayfa (default: 1) |
| `pageSize` | number | Sayfa boyutu (default: 50) |
| `search` | string | Ada göre arama |
| `type` | string | `CUSTOMER \| SUPPLIER \| BOTH` |
| `status` | string | `ACTIVE \| PASSIVE \| BLOCKED` |

**Response (200):**
```json
{
  "data": [
    {
      "id": "cu_xxxx",
      "code": "C-0001",
      "name": "XYZ Tekstil A.Ş.",
      "type": "CUSTOMER",
      "taxNumber": "1234567890",
      "phone": "0532 123 45 67",
      "email": "info@xyz.com",
      "address": "İstanbul, Türkiye",
      "status": "ACTIVE",
      "balance": -15000,
      "balanceLabel": "1.500 ₺ alacaklı",
      "transactionCount": 24
    }
  ],
  "total": 156,
  "page": 1,
  "pageSize": 50
}
```

---

### `GET /customers/:id`
Tek cari detayı (anlık bakiye dahil).

**Response (200):**
```json
{
  "id": "cu_xxxx",
  "code": "C-0001",
  "name": "XYZ Tekstil A.Ş.",
  "type": "CUSTOMER",
  "taxNumber": "1234567890",
  "phone": "0532 123 45 67",
  "email": "info@xyz.com",
  "address": "İstanbul, Türkiye",
  "status": "ACTIVE",
  "balance": -15000,
  "creditLimit": 100000,
  "openingBalance": 0,
  "createdAt": "2025-01-15T09:00:00Z"
}
```

---

### `GET /customers/:id/statement`
**Cari Ekstresi** — cariye ait tüm hareketler + dönem toplamları + bakiye.

| Query Param | Tip | Açıklama |
|-------------|-----|----------|
| `from` | string | Başlangıç tarih (YYYY-MM-DD) |
| `to` | string | Bitiş tarih (YYYY-MM-DD) |
| `refType` | string | `SALE \| COLLECTION \| RETURN \| ...` |
| `page` | number | Sayfa |
| `pageSize` | number | Sayfa boyutu |

**Response (200):**
```json
{
  "customer": {
    "id": "cu_xxxx",
    "code": "C-0001",
    "name": "XYZ Tekstil A.Ş."
  },
  "openingBalance": 0,
  "totalDebit": 85000,
  "totalCredit": 100000,
  "closingBalance": -15000,
  "transactions": [
    {
      "id": "mv_xxxx",
      "date": "2026-06-01",
      "refType": "SALE",
      "refId": "sal_xxxx",
      "description": "Satış Faturası #SF-2026-0042",
      "debit": 25000,
      "credit": 0
    },
    {
      "id": "mv_xxxx2",
      "date": "2026-06-05",
      "refType": "COLLECTION",
      "refId": "col_xxxx",
      "description": "Nakit tahsilat",
      "debit": 0,
      "credit": 10000
    }
  ],
  "page": 1,
  "pageSize": 50,
  "total": 24
}
```

> **Bakiye mantığı:** Negatif = müşteri size borçlu (alacaklısınız). Pozitif = siz müşteriye borçlusunuz.

---

### `POST /customers`
Yeni cari oluştur.

**Request:**
```json
{
  "code": "C-0010",
  "name": "Yeni Müşteri Ltd.",
  "type": "CUSTOMER",
  "taxNumber": "9876543210",
  "phone": "0532 987 65 43",
  "email": "satis@yenimusteri.com",
  "address": "Ankara, Türkiye",
  "taxOffice": "Çankaya VD",
  "openingBalance": 0,
  "creditLimit": 50000,
  "notes": "Potansiyel müşteri"
}
```

---

### `PATCH /customers/:id`
Cari güncelle.

**Request (tüm alanlar opsiyonel):**
```json
{
  "name": "Güncel Müşteri Adı",
  "phone": "0532 111 22 33",
  "email": "yeni@eposta.com",
  "address": "Yeni adres",
  "creditLimit": 75000
}
```

---

### `PATCH /customers/:id/deactivate`
Cariyi pasife al (hareketi olanlar için).

```json
// Request body: boş
// Response: { "id": "cu_xxxx", "status": "PASSIVE" }
```

---

### `DELETE /customers/:id`
Soft delete — sadece **hareketi olmayan** cariler için çalışır.

**Response (400):**
```json
{ "statusCode": 400, "message": "Hareketi olan cari silinemez. Pasife almayı deneyin." }
```

---

## 3. Satış

> **Controller:** `apps/api/src/modules/sales/sales.controller.ts`
> **Path:** `/sales`

### `GET /sales`
Satış listesi.

| Query Param | Tip | Açıklama |
|-------------|-----|----------|
| `page` | number | Sayfa |
| `pageSize` | number | Sayfa boyutu (default: 50) |
| `customerId` | string | Cari filtresi |
| `status` | string | `DRAFT \| CONFIRMED \| SHIPPED \| DELIVERED \| PAID \| CANCELLED` |
| `paymentStatus` | string | `UNPAID \| PARTIALLY_PAID \| PAID` |
| `type` | string | `SALE \| RETURN \| PROFORMA` |
| `search` | string | Arama (fatura no, cari adı) |
| `from` | string | Tarih başlangıç (YYYY-MM-DD) |
| `to` | string | Tarih bitiş (YYYY-MM-DD) |

**Response (200):**
```json
{
  "data": [
    {
      "id": "sal_xxxx",
      "invoiceNo": "SF-2026-0042",
      "type": "SALE",
      "status": "CONFIRMED",
      "paymentStatus": "PARTIALLY_PAID",
      "saleDate": "2026-06-01",
      "dueDate": "2026-06-15",
      "customer": { "id": "cu_xxxx", "name": "XYZ Tekstil A.Ş." },
      "warehouse": { "id": "wh_xxxx", "name": "Ana Depo" },
      "subtotal": 83333.33,
      "totalVat": 16666.67,
      "discountTotal": 0,
      "total": 100000,
      "paidAmount": 40000,
      "remainingAmount": 60000,
      "items": 5,
      "createdBy": { "id": "usr_xxxx", "name": "Ahmet Yılmaz" }
    }
  ],
  "total": 234,
  "page": 1,
  "pageSize": 50
}
```

---

### `GET /sales/:id`
Satış detayı (kalemler dahil).

**Response (200):**
```json
{
  "id": "sal_xxxx",
  "invoiceNo": "SF-2026-0042",
  "type": "SALE",
  "status": "CONFIRMED",
  "paymentStatus": "PARTIALLY_PAID",
  "saleDate": "2026-06-01",
  "dueDate": "2026-06-15",
  "customer": { "id": "cu_xxxx", "name": "XYZ Tekstil A.Ş." },
  "warehouse": { "id": "wh_xxxx", "name": "Ana Depo" },
  "currency": "TRY",
  "subtotal": 83333.33,
  "totalVat": 16666.67,
  "discountTotal": 0,
  "total": 100000,
  "paidAmount": 40000,
  "remainingAmount": 60000,
  "notes": "Kapıda ödeme mevcut",
  "items": [
    {
      "id": "si_xxxx",
      "product": { "id": "pr_xxxx", "name": "Pamuklu Kazak M", "sku": "PKM-001" },
      "unit": { "id": "un_xxxx", "name": "Adet" },
      "quantity": 100,
      "unitPrice": 200,
      "vatRate": 20,
      "vatAmount": 4000,
      "discountRate": 0,
      "subtotal": 24000,
      "total": 24000
    }
  ],
  "payments": [
    { "id": "pmt_xxxx", "amount": 40000, "date": "2026-06-03", "method": "CASH" }
  ]
}
```

---

### `POST /sales`
Yeni satış oluştur. `status: "CONFIRMED"` gönderilirse stok + cari hareketi otomatik oluşur.

**Request:**
```json
{
  "customerId": "cu_xxxx",
  "warehouseId": "wh_xxxx",
  "saleDate": "2026-06-06",
  "dueDate": "2026-06-20",
  "type": "SALE",
  "status": "DRAFT",
  "currency": "TRY",
  "items": [
    {
      "productId": "pr_xxxx",
      "quantity": 5,
      "unitPrice": 1000,
      "vatRate": 20,
      "discountRate": 0,
      "description": "Ürün açıklaması"
    },
    {
      "productId": "pr_yyyy",
      "quantity": 10,
      "unitPrice": 250,
      "vatRate": 20
    }
  ],
  "notes": "Müşteri notu",
  "internalNotes": "dahili not"
}
```

**Response (201):**
```json
{
  "id": "sal_xxxx",
  "invoiceNo": "SF-2026-0043",
  "status": "DRAFT",
  "total": 7500,
  "items": [...],
  "createdAt": "2026-06-06T..."
}
```

---

### `POST /sales/:id/confirm`
DRAFT → CONFIRMED. Stok düşer, cari hareket oluşur.

```json
// Request body: boş
// Response: { "id": "sal_xxxx", "status": "CONFIRMED", "invoiceNo": "SF-2026-0043" }
```

---

### `POST /sales/:id/cancel`
Satışı iptal eder — ters kayıt oluşur (stok iade, cari ters hareket).

**Request:**
```json
{
  "reason": "Müşteri vazgeçti"
}
```

---

### `DELETE /sales/:id`
Sadece DRAFT statüsündeki satışları siler (soft delete).

---

## 4. Sipariş

> **Controller:** `apps/api/src/modules/orders/orders.controller.ts`
> **Path:** `/orders`

### `GET /orders`
Sipariş listesi.

| Query Param | Tip | Açıklama |
|-------------|-----|----------|
| `page` | number | Sayfa |
| `pageSize` | number | Sayfa boyutu (default: 50) |
| `customerId` | string | Cari filtresi |
| `status` | string | `PENDING \| CONFIRMED \| SHIPPED \| DELIVERED \| COMPLETED \| CANCELLED` |
| `type` | string | `SALES_ORDER \| PURCHASE_ORDER \| PROFORMA_ORDER` |
| `search` | string | Arama |
| `from` | string | Tarih başlangıç |
| `to` | string | Tarih bitiş |

**Response (200):** Satış listesi ile aynı yapı (`data[]` + `total` + `page` + `pageSize`).

---

### `GET /orders/:id`
Sipariş detayı.

---

### `POST /orders`
Yeni sipariş.

**Request:**
```json
{
  "customerId": "cu_xxxx",
  "orderDate": "2026-06-06",
  "deliveryDate": "2026-06-10",
  "type": "SALES_ORDER",
  "status": "PENDING",
  "warehouseId": "wh_xxxx",
  "items": [
    {
      "productId": "pr_xxxx",
      "quantity": 20,
      "unitPrice": 500,
      "vatRate": 20,
      "discountRate": 5,
      "description": "Özel sipariş"
    }
  ],
  "notes": "Acil teslimat"
}
```

---

### `POST /orders/:id/confirm`
PENDING → CONFIRMED. Stok rezerve edilir (düşmez).

---

### `POST /orders/:id/cancel`
Siparişi iptal.

**Request:**
```json
{ "reason": "Müşteri iptal etti" }
```

---

### `DELETE /orders/:id`
Sadece PENDING ve satışa bağlı olmayan siparişler silinebilir.

---

## 5. İade

> **Controller:** `apps/api/src/modules/returns/returns.controller.ts`
> **Path:** `/returns`

### `GET /returns`
İade listesi.

| Query Param | Tip | Açıklama |
|-------------|-----|----------|
| `page` | number | Sayfa |
| `pageSize` | number | Sayfa boyutu (default: 25) |
| `customerId` | string | Cari |
| `status` | string | `DRAFT \| PENDING \| APPROVED \| REJECTED \| COMPLETED \| CANCELLED` |
| `reason` | string | İade nedeni |
| `source` | string | İadenin kaynağı (hangi modülden) |
| `search` | string | Arama |
| `from` | string | Tarih başlangıç |
| `to` | string | Tarih bitiş |

---

### `GET /returns/:id`
İade detayı.

---

### `POST /returns`
Yeni iade oluştur (taslak).

**Request:**
```json
{
  "customerId": "cu_xxxx",
  "returnDate": "2026-06-06",
  "source": "SALE",
  "sourceId": "sal_xxxx",
  "reason": "DEFECTIVE",
  "warehouseId": "wh_xxxx",
  "items": [
    {
      "productId": "pr_xxxx",
      "quantity": 2,
      "unitPrice": 1000,
      "vatRate": 20,
      "description": "Fermuar bozuk"
    }
  ],
  "notes": "Müşteri şikayet etti"
}
```

---

### `PUT /returns/:id`
İade güncelle (sadece DRAFT veya PENDING).

---

### `POST /returns/:id/action`
İade aksiyonu — submit / approve / reject / complete / cancel.

**Request:**
```json
{
  "action": "approve",
  "rejectionReason": "İade süresi dolmuş"
}
```

**`action` değerleri:**
| Değer | Açıklama |
|-------|----------|
| `submit` | DRAFT → PENDING (gönder) |
| `approve` | PENDING → APPROVED (onayla, stok değişmez) |
| `reject` | PENDING → REJECTED (reddet, `rejectionReason` zorunlu) |
| `complete` | APPROVED → COMPLETED (stok iade, cari ters hareket) |
| `cancel` | DRAFT/PENDING → CANCELLED |

---

### `DELETE /returns/:id`
Soft delete — sadece DRAFT.

---

## 6. Tahsilat

> **Controller:** `apps/api/src/modules/collections/collections.controller.ts`
> **Path:** `/collections`

### `GET /collections`
Tahsilat listesi.

| Query Param | Tip | Açıklama |
|-------------|-----|----------|
| `page` | number | Sayfa |
| `pageSize` | number | Sayfa boyutu (default: 50) |
| `customerId` | string | Cari |
| `status` | string | `PENDING \| CONFIRMED \| CANCELLED` |
| `type` | string | `CASH \| BANK_TRANSFER \| CREDIT_CARD \| CHECK \| OTHER \| EFT` |
| `search` | string | Arama |
| `from` | string | Tarih başlangıç |
| `to` | string | Tarih bitiş |

**Response (200):**
```json
{
  "data": [
    {
      "id": "col_xxxx",
      "invoiceNo": "TH-2026-0018",
      "customer": { "id": "cu_xxxx", "name": "XYZ Tekstil A.Ş." },
      "type": "CASH",
      "amount": 25000,
      "status": "CONFIRMED",
      "collectionDate": "2026-06-05",
      "linkedSale": { "id": "sal_xxxx", "invoiceNo": "SF-2026-0038" },
      "createdBy": { "id": "usr_xxxx", "name": "Ahmet Yılmaz" }
    }
  ],
  "total": 45,
  "page": 1,
  "pageSize": 50
}
```

---

### `GET /collections/:id`
Tahsilat detayı.

---

### `POST /collections`
Yeni tahsilat oluştur (PENDING).

**Request:**
```json
{
  "customerId": "cu_xxxx",
  "collectionDate": "2026-06-06",
  "type": "CASH",
  "amount": 5000,
  "linkedSaleId": "sal_xxxx",
  "notes": "Haziran faturası kapora"
}
```

---

### `POST /collections/:id/confirm`
Tahsilatı onayla — cari alacak + kasa hareketi oluşur.

**Request:**
```json
{
  "cashAccountId": "csh_xxxx"
}
```

---

### `POST /collections/:id/cancel`
Tahsilatı iptal et — ters hareketler oluşur.

**Request:**
```json
{ "reason": "Müşteri ödemeyi yaptı ama yanlış kayıt" }
```

---

### `DELETE /collections/:id`
Sadece PENDING statüsündeki tahsilatlar silinebilir.

---

## 7. Stok

> **Controller:** `apps/api/src/modules/stock/stock.controller.ts`
> **Path:** `/stock`

### `GET /stock/quantity`
Ürünün belirli depodaki **anlık stok miktarı**.

| Query Param | Tip | Açıklama |
|-------------|-----|----------|
| `productId` | string | Ürün ID (zorunlu) |
| `warehouseId` | string | Depo ID (zorunlu) |

**Response (200):**
```json
{
  "productId": "pr_xxxx",
  "warehouseId": "wh_xxxx",
  "quantity": 342.5
}
```

---

### `GET /stock/movements`
Stok hareketleri listesi.

| Query Param | Tip | Açıklama |
|-------------|-----|----------|
| `warehouseId` | string | Depo filtresi |
| `productId` | string | Ürün filtresi |
| `type` | string | `IN \| OUT \| TRANSFER \| ADJUST` |
| `refType` | string | `SALE \| RETURN \| PURCHASE \| ...` |
| `from` | string | Tarih başlangıç |
| `to` | string | Tarih bitiş |
| `page` | number | Sayfa |
| `pageSize` | number | Sayfa boyutu |

---

### `POST /stock/movement`
Manuel stok hareketi.

**Request:**
```json
{
  "warehouseId": "wh_xxxx",
  "productId": "pr_xxxx",
  "type": "IN",
  "quantity": 50,
  "movementDate": "2026-06-06",
  "referenceType": "MANUAL",
  "referenceId": "manual-2026-001",
  "notes": "Depo giriş"
}
```

---

### `POST /stock/transfer`
Depo arası transfer (atomik — 2 hareket oluşur).

**Request:**
```json
{
  "productId": "pr_xxxx",
  "fromWarehouseId": "wh_xxxx",
  "toWarehouseId": "wh_yyyy",
  "quantity": 20,
  "movementDate": "2026-06-06",
  "notes": "Şubeye transfer"
}
```

---

### `POST /stock/adjust`
Sayım düzeltmesi (fire, hasar, envanter farkı).

**Request:**
```json
{
  "warehouseId": "wh_xxxx",
  "productId": "pr_xxxx",
  "type": "ADJUST",
  "quantity": -3,
  "movementDate": "2026-06-06",
  "notes": "Hasarlı ürün"
}
```

---

### `POST /stock/movement/:id/reverse`
Stok hareketini ters kayıt ile iptal et.

---

## 8. Raporlar

> **Controller:** `apps/api/src/modules/reports/reports.controller.ts`
> **Path:** `/reports`

### `GET /reports/presets`
Hazır rapor şablonları listesi.

**Response (200):**
```json
{
  "data": [
    { "code": "sales_summary", "name": "Satış Özeti", "category": "sales" },
    { "code": "sales_by_product", "name": "Ürün Bazlı Satış", "category": "sales" },
    { "code": "sales_by_customer", "name": "Cari Bazlı Satış", "category": "sales" },
    { "code": "customer_balance", "name": "Cari Bakiye Raporu", "category": "customer" },
    { "code": "stock_summary", "name": "Stok Özeti", "category": "stock" },
    { "code": "collection_summary", "name": "Tahsilat Özeti", "category": "collection" },
    { "code": "profit_loss", "name": "Kar/Zarar", "category": "financial" }
  ]
}
```

---

### `POST /reports/execute`
Rapor çalıştır.

**Request:**
```json
{
  "presetCode": "sales_summary",
  "dateFrom": "2026-06-01",
  "dateTo": "2026-06-30",
  "groupBy": "product",
  "filters": {
    "customerId": "cu_xxxx",
    "warehouseId": "wh_xxxx"
  }
}
```

**Response (200):**
```json
{
  "presetCode": "sales_summary",
  "generatedAt": "2026-06-06T12:00:00Z",
  "parameters": {
    "dateFrom": "2026-06-01",
    "dateTo": "2026-06-30",
    "groupBy": "product"
  },
  "columns": ["Ürün", "Miktar", "Birim Fiyat", "Toplam", "KDV", "Genel Toplam"],
  "rows": [
    ["Pamuklu Kazak M", 150, "200 ₺", "30.000 ₺", "6.000 ₺", "36.000 ₺"]
  ],
  "totals": {
    "totalAmount": 250000,
    "totalVat": 50000,
    "totalWithVat": 300000
  }
}
```

---

## 9. Ürün & Depo

### `GET /products`
Ürün listesi (satış uygulamasında sepete eklemek için).

| Query Param | Tip | Açıklama |
|-------------|-----|----------|
| `search` | string | Ürün adı veya SKU |
| `categoryId` | string | Kategori |
| `status` | string | `ACTIVE` (genellikle sadece aktif ürünler) |
| `page` | number | Sayfa |
| `pageSize` | number | Sayfa boyutu |

**Response (200):**
```json
{
  "data": [
    {
      "id": "pr_xxxx",
      "sku": "PKM-001",
      "name": "Pamuklu Kazak M",
      "category": "Kazak",
      "unit": "Adet",
      "salePrice": 200,
      "stock": 342,
      "image": "https://...",
      "vatRate": 20
    }
  ],
  "total": 520
}
```

---

### `GET /warehouses`
Depo listesi.

**Response (200):**
```json
{
  "data": [
    { "id": "wh_xxxx", "name": "Ana Depo", "address": "İstanbul", "status": "ACTIVE" },
    { "id": "wh_yyyy", "name": "Şube Depo", "address": "Ankara", "status": "ACTIVE" }
  ]
}
```

---

## 10. Genel Arama

### `GET /search`
Tek istekte cari, ürün, sipariş arar. Mobil için ideal.

| Query Param | Tip | Açıklama |
|-------------|-----|----------|
| `q` | string | Arama kelimesi (min 2 karakter) |
| `types` | string | Virgülle ayrılmış: `customer,product,order,sale` |
| `limit` | number | Her kategori için sonuç sayısı (default: 10) |

**Response (200):**
```json
{
  "q": "pamuk",
  "results": {
    "customers": [
      { "id": "cu_xxxx", "name": "Pamukçular Tekstil", "type": "CUSTOMER" }
    ],
    "products": [
      { "id": "pr_xxxx", "name": "Pamuklu Kazak M", "sku": "PKM-001", "salePrice": 200 }
    ],
    "orders": [],
    "sales": []
  }
}
```

---

## 11. Hata Kodları

| HTTP Kod | Açıklama | Örnek |
|----------|----------|-------|
| `400` | Geçersiz istek / validation hatası | `"status must be one of: DRAFT, CONFIRMED..."` |
| `401` | Geçersiz veya süresi dolmuş token | `"Geçersiz veya eksik kimlik bilgisi"` |
| `403` | Yetki yok | `"Bu işlem için yetkiniz yok"` |
| `404` | Kaynak bulunamadı | `"Müşteri bulunamadı"` |
| `409` | Çakışma | `"Bu işlem zaten yapılmış"` |
| `500` | Sunucu hatası | `"Internal server error"` |

**Validation hatası örneği (400):**
```json
{
  "statusCode": 400,
  "message": "Bad Request",
  "errors": [
    { "field": "customerId", "message": "customerId should not be empty" },
    { "field": "items", "message": "items must be a non-empty array" }
  ]
}
```

---

## 12. Enum Referansı

### CustomerType
```typescript
CUSTOMER | SUPPLIER | BOTH
```

### CustomerStatus
```typescript
ACTIVE | PASSIVE | BLOCKED
```

### SaleStatus
```typescript
DRAFT        // Taslak (stok/cari etkilenmez)
CONFIRMED    // Onaylandı (stok düşer, cari borç oluşur)
SHIPPED      // Sevk edildi
DELIVERED    // Teslim edildi
PAID         // Ödendi
CANCELLED    // İptal edildi
```

### SaleType
```typescript
SALE | RETURN | PROFORMA | CONSIGNMENT_OUT
```

### PaymentStatus
```typescript
UNPAID | PARTIALLY_PAID | PAID
```

### OrderStatus
```typescript
PENDING | CONFIRMED | PARTIALLY_SHIPPED | SHIPPED | DELIVERED | COMPLETED | CANCELLED
```

### OrderType
```typescript
SALES_ORDER | PURCHASE_ORDER | PROFORMA_ORDER | RETURN_ORDER | CONSIGNMENT_OUT
```

### ReturnStatus
```typescript
DRAFT | PENDING | APPROVED | REJECTED | COMPLETED | CANCELLED
```

### ReturnReason
```typescript
DEFECTIVE      // Kusurlu ürün
WRONG_ITEM     // Yanlış ürün gönderildi
LATE_DELIVERY  // Geç teslimat
NOT_AS_DESCRIBED // Taahhüt edilen gibi değil
OTHER          // Diğer
```

### CollectionType
```typescript
CASH | BANK_TRANSFER | CREDIT_CARD | CHECK | OTHER | EFT
```

### CollectionStatus
```typescript
PENDING | CONFIRMED | CANCELLED
```

### StockMovementType
```typescript
IN       // Giriş
OUT      // Çıkış
TRANSFER // Transfer
ADJUST   // Düzeltme
```

---

## Android Uygulama Tavsiyeleri

### Offline Desteği
- Satış/tahsilat verilerini **lokal SQLite**'da tut
- Bağlantı olunca **arka planda senkronize et**
- `status: "DRAFT"` ile kaydet, online olunca `confirm` çağır

### Satış Akışı (Saha Satış)
```
1. Login              → token al, localde sakla
2. GET /warehouses    → depo seç
3. GET /search        → müşteri ara
4. GET /customers/:id/statement → borç durumuna bak
5. GET /products      → ürün ara / sepete ekle
6. GET /stock/quantity → her ürün için stok kontrolü
7. POST /sales        → satış oluştur (DRAFT)
8. POST /sales/:id/confirm → onayla
9. POST /collections  → tahsilat yap (varsa)
```

### Token Saklama
- Android: `EncryptedSharedPreferences` veya `Keychain`
- Token süresi: 24 saat (expires_in: 86400)
- Refresh token: backend'de refresh mekanizması varsa kullan

### Stok Kontrolü
Satış onaylanmadan önce her ürün için:
```kotlin
GET /stock/quantity?productId=xxx&warehouseId=yyy
// quantity < siparişMiktarı → uyarı göster
```

### Cari Bakiye Kontrolü
Tahsilat yapmadan önce:
```kotlin
GET /customers/:id
// balance < 0 ve büyük → riskli müşteri uyarısı
```