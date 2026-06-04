# Finans Modülleri

CHAT-BOT-KNOWLEDGE.md'de detaylı sorgu noktaları listelenen finansal modüllerin detay sayfaları.

## 1. Cari (Customers)

**Backend:** `apps/api/src/modules/customers/`
**Frontend:** `/customers`, `/customers/new`, `/customers/:id`
**Prisma:** `Customer`, `CustomerMovement`, `PaymentMethod`

### Endpoint'ler
- `GET /customers` — Liste (filtre: search, status, hasDebt, page)
- `GET /customers/:id` — Detay
- `POST /customers` — Oluştur
- `PATCH /customers/:id` — Güncelle
- `DELETE /customers/:id` — Soft delete
- `GET /customers/:id/statement` — Ekstre
- `GET /customers/:id/movements` — Hareketler
- `GET /reports/top-debtors` — En çok borçlular

### Event-Sourcing Pattern
**Bakiye = `SUM(DEBIT) - SUM(CREDIT)`** — tüm hareketlerden hesaplanır, cached alan yoktur.

### Permission Key'leri
- `customers:view`, `customers:create`, `customers:update`, `customers:delete`
- `customers:view_sensitive` (TC/Vergi no)

### Sık Sorulanlar
- "Müşteri bakiyesi nasıl güncellenir?" → Hareket eklenince otomatik hesaplanır
- "Borçlu müşterileri listele?" → `?hasDebt=true`
- "Müşteri silince hareketleri de silinir mi?" → Hayır, soft delete; hareketler korunur

---

## 7. Kasa (Cash)

**Backend:** `apps/api/src/modules/cash/`
**Frontend:** `/cash`, `/cash/:id`
**Prisma:** `CashAccount`, `CashMovement`

### Endpoint'ler
- `GET /cash/accounts` — Kasa listesi
- `GET /cash/accounts/:id` — Kasa detay + bakiye
- `POST /cash/movements` — Hareket ekle
- `GET /cash/movements` — Hareketler (filtre: accountId, date)
- `POST /cash/transfers` — Kasa arası transfer

### Bakiye Hesabı
**Bakiye = `SUM(IN direction) - SUM(OUT direction)`** per kasa

---

## 6. Tahsilat (Collections)

**Backend:** `apps/api/src/modules/collections/`
**Frontend:** `/collections`, `/collections/new`, `/collections/:id`
**Prisma:** `Collection`, `CollectionAllocation`

### Endpoint'ler
- `GET /collections` — Liste
- `POST /collections` — Yeni tahsilat (müşteriye bağla, fatura kapat)
- `GET /collections/:id` — Detay
- `GET /collections/unallocated` — Henüz bir tahsilat edilmemiş
- `GET /reports/collections-trend` — Aylık trend

---

## 18. Bankalar (Banks)

**Backend:** `apps/api/src/modules/banks/`
**Frontend:** `/banks`, `/banks/new`, `/banks/:id`, `/banks/transactions`, `/banks/transactions/new`, `/banks/pos/devices`, `/banks/pos/collections`, `/banks/pos/commissions`
**Prisma:** `BankAccount`, `BankTransaction`, `PosDevice`, `PosCollection`, `PosCommission`

### Endpoint'ler
- `GET /banks/accounts` — Banka hesapları
- `POST /banks/accounts` — Yeni hesap
- `GET /banks/transactions` — İşlemler
- `POST /banks/transactions` — Manuel işlem
- `POST /banks/transactions/import` — Ekstre import
- `GET /banks/pos/devices` — POS cihazları
- `GET /banks/pos/collections` — POS tahsilatları
- `GET /banks/pos/commissions` — POS komisyonları

### Özellikler
- **Ekstre import**: CSV/MT940 formatı
- **Otomatik eşleştirme**: Cari hareketlerle
- **POS komisyon takibi**: Aylık rapor
