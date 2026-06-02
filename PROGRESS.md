# Proje İlerleme Günlüğü

> 📌 **Yeni editör**: BURADAN BAŞLA. 5 dakikada bağlam kazan.
> Detay için [Mimari doküman](./docs/FAZ-0-ANALIZ-VE-MIMARI.md) ve [Muhasebe mantığı](./docs/muhasebe-mantigi.md) oku.

---

## 🎯 Son Durum

- **Faz**: FAZ 7 ✅ TAMAMLANDI (Stok Modülü)
- **Tarih**: 2026-06-01 23:25 UTC
- **Kapsam**: 8 yeni tablo + 7 enum + 3 backend modül (warehouses + products + stock) + 5 frontend sayfa. Event-sourcing stok miktarı hesabı aktif.
- **Çalışır durum**: ✅ typecheck 3/3 temiz, build başarılı (63 PWA entry), lint 0 error
- **Repo**: https://github.com/Retrosero/saas_web_satis

## ✅ Tamamlanan Fazlar

| FAZ | Başlık | Tarih | Commit | Durum |
|-----|--------|-------|--------|-------|
| 0 | Mimari doküman (15 madde) | 2026-05-28 | (doc) | ✅ |
| 1 | Monorepo iskeleti (web+api+shared) | 2026-05-29 | (FAZ 0-5 squash) | ✅ |
| 2 | DB şeması + muhasebe kütüphanesi (46 test) | 2026-05-30 | (FAZ 0-5 squash) | ✅ |
| 3 | Süper admin paneli (6 sayfa) | 2026-05-31 | (FAZ 0-5 squash) | ✅ |
| 3.5 | Bildirim sistemi (in-app) | 2026-05-31 | (FAZ 0-5 squash) | ✅ |
| 4 | Tenant admin paneli (5 sayfa) | 2026-06-01 | (FAZ 0-5 squash) | ✅ |
| 5 | Log & audit UI (2 sayfa + CSV) | 2026-06-01 | (FAZ 0-5 squash) | ✅ |
| — | Remote fix: auth+postgres+CI+lint | 2026-06-01 | `300866f` | ✅ |
| 6a | Cari backend (5 tablo + customers modülü) | 2026-06-01 | (henüz push yok) | ✅ |
| 6b | Cari frontend (3 sayfa) + service test (13/13) | 2026-06-01 | (henüz push yok) | ✅ |
| 7a | Stok backend (8 tablo + 3 modül) | 2026-06-01 | (henüz push yok) | ✅ |
| 7b | Stok frontend (5 sayfa) | 2026-06-01 | (henüz push yok) | ✅ |

> Squash commit: `c976243 feat: monorepo iskeleti + MVP features (FAZ 0-5)` — 201 dosya, 28309 satır.

## ⏭️ Sıradaki Faz

### FAZ 6 — Cari Modülü (devam — %40 kaldı)
- ✅ DB: 5 yeni tablo + 10 enum (migration: `20260602000000_cari_module`)
- ✅ Backend: `customers` modülü (CRUD + arama + bakiye + ekstre)
- ⏳ Frontend: `/cari/cariler` (liste), `/cari/cariler/[id]` (detay+ekstre), `/cari/yeni`, `/cari/ekstre`
- ⏳ Test: customers service unit testi (jest, bakiye hesabı + ters kayıt) — **13/13 geçti** ✅
- ⏳ Cash modülü (kasa + banka + tahsilat API) — FAZ 9'a bırakıldı

### FAZ 7 — Stok Modülü + R2 Storage (2-3 gün)
- `products`, `product_barcodes`, `warehouses`, `stock_movements` tabloları
- Stok modülü (CRUD + R2'de ürün görseli + barkod)
- `applyStockTransfer`, `applyStockAdjust` entegrasyonu

### FAZ 8 — Satış + Stok/Cari Hareket (2-3 gün)
- `sales`, `sale_items` tabloları
- Satış modülü — `applySale` muhasebe entegrasyonu
- Otomatik: cari DEBIT, stok OUT, KDV

### FAZ 9 — Sipariş + Tahsilat + Kasa (2-3 gün)
- `orders`, `collections`, `cash_accounts`, `cash_movements` tabloları
- Tahsilat: cari CREDIT + kasa IN (applyCollection)
- Kasa transferleri

### FAZ 10-14 — Raporlar, Excel, PWA, Test, Genel temizlik

## 🏗️ Mimari Kararlar (değişmez)

- **Stack**: NestJS 10 + Prisma 5 + PostgreSQL 16 (port 55432) | Vite 5 + React 18 + TypeScript 5 | pnpm 9 monorepo
- **Muhasebe (kırmızı çizgi)**: **Event sourcing** — bakiye/stok/kasa asla saklanmaz, hareketlerden hesaplanır. `applySale/Collection/StockTransfer/Adjust/SaleCancel` fonksiyonları.
- **Multi-tenant**: Her tablo `tenant_id` (nullable, system kayıtları null). İzolasyon servis katmanında (`@InjectTenant` dekoratörü). Tenant guard pipeline'da.
- **Soft delete**: `is_deleted` flag. Para/stok iptali = **ters kayıt** (yeni hareket), asla DELETE yok.
- **Tasarım**: Tek birleşik M3 "CariPro Soft" teması (4 tasarım ailesi konsolide edildi).
- **Yetkilendirme**: JWT + refresh token rotation. `auth.controller.ts` global `@UseGuards(JwtAuthGuard)`, login/refresh `@Public()` muaf.
- **Doğrulama**: Zod şemaları (`@saas/shared`) frontend + backend'de. Backend'de class-validator dekoratörleri DTO'larda (son commit'te eklendi).
- **Türkçe**: UI metni, commit mesajları, dokümanlar. Kod (identifier, log) İngilizce.
- **Modüller (backend)**: `auth`, `tenants`, `super-admin`, `tenant-admin`, `notifications`, `logs`, `health`
- **Modüller (frontend)**: `auth/`, `dashboard/`, `super-admin/` (6 sayfa), `tenant-admin/` (5 sayfa), `settings/`, `notifications/`

## ⚠️ Bilinen Sorunlar / TODO

- [ ] Frontend lint: 14 warning (çoğu unused import — kozmetik, temizlenebilir)
- [ ] Vite dev server port 5173'te uzun süredir açık (PID 366), test sonrası kapatılabilir
- [ ] Sandbox'ta vitest esbuild binary sorunu (kullanıcının PC'sinde yok, CI'da yeşil)
- [ ] `package-lock.json` eklendi ama pnpm kullanılıyor (npm için referans — kalabilir)
- [ ] PostgreSQL sandbox'ta yok, DB migrate/seed lokal test edilemedi (kullanıcı PC'de doğruladı)
- [ ] FAZ 6 frontend sayfaları (cariler listesi, detay, yeni) henüz yok

## 📚 Detaylı Dokümanlar

| Başlık | Yol | Ne Zaman Oku |
|--------|-----|--------------|
| Mimari (15 madde) | [`docs/FAZ-0-ANALIZ-VE-MIMARI.md`](./docs/FAZ-0-ANALIZ-VE-MIMARI.md) | Yeni başlarken, karar almadan önce |
| Muhasebe mantığı (KRİTİK) | [`docs/muhasebe-mantigi.md`](./docs/muhasebe-mantigi.md) | Muhasebe kodu yazarken |
| FAZ 1 teslimat notu | [`docs/FAZ-1-TESLIMAT-NOTU.md`](./docs/FAZ-1-TESLIMAT-NOTU.md) | Monorepo yapısını anlamak için |
| FAZ 2 teslimat notu | [`docs/FAZ-2-TESLIMAT-NOTU.md`](./docs/FAZ-2-TESLIMAT-NOTU.md) | DB şeması + muhasebe testleri |
| DB diyagramları | [`docs/diagrams/`](./docs/diagrams/) | ER ilişkilerini görsel anlamak için |
| Prisma schema | [`apps/api/prisma/schema.prisma`](./apps/api/prisma/schema.prisma) | DB yapısının tek gerçek kaynağı |
| Muhasebe kod | [`packages/shared/src/utils/accounting.ts`](./packages/shared/src/utils/accounting.ts) | Tüm muhasebe hesaplamaları |
| Migration SQL | [`apps/api/prisma/migrations/20260601000000_init/migration.sql`](./apps/api/prisma/migrations/20260601000000_init/migration.sql) | Tablo yapısı + indexler + FK'lar |

## 🔄 Son Güncellemeler

- **2026-06-01 21:55 UTC** — FAZ 6a tamamlandı: cari backend (5 tablo + customers modülü + ekstre API), build OK
- **2026-06-01 21:37 UTC** — PROGRESS.md oluşturuldu (skill: `progress-log`), FAZ 6'ya geçildi
- **2026-06-01 21:00 UTC** — Remote'da auth/postgres/CI/lint fix'leri merge edildi (`300866f`)
- **2026-06-01 18:00 UTC** — Main branch'e monorepo + tasarımlar squash merge edildi (`c976243`)
- **2026-06-01 09:00 UTC** — feat/mvp-v1 → main squash merge (8 commit → 1)

## 🚀 Hızlı Başlangıç (yeni editör)

```bash
# Repo
git clone https://github.com/Retrosero/saas_web_satis
cd saas_web_satis

# Kurulum
corepack enable && pnpm install
cp .env.example .env

# Çalıştır
pnpm dev          # hem api (3000) hem web (5173)
pnpm test:run     # muhasebe testleri (vitest)
pnpm typecheck    # tüm workspace
pnpm lint         # ESLint
```

**DB gerekli**: `docker compose up -d postgres` (port 55432) → `pnpm --filter api prisma migrate deploy && pnpm --filter api prisma db seed`

**Demo hesaplar** (seed sonrası):
- Süper admin: `admin@sistem.local` / `ChangeMe123!`
- Demo firma admin: `admin@demo.local` / `Demo123!` (tenant: `demo`)
- Demo muhasebeci: `muhasebe@demo.local` / `Demo123!`
