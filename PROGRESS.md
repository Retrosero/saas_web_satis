# Proje İlerleme Günlüğü

> 🤖 **Yeni AI Editör / Geliştirici**: BURADAN BAŞLA — 5 dakikada bağlam kazan.
> Detay için [Mimari doküman](./docs/FAZ-0-ANALIZ-VE-MIMARI.md) ve [Muhasebe mantığı](./docs/muhasebe-mantigi.md) oku.

---

## 🎯 Proje Özeti (1 dakika)

**Proje:** Türkçe, multi-tenant SaaS İşletme Yönetim Platformu (cari + stok + satış + kasa)
**Stack:** Next.js+Vite (web) / NestJS+Prisma+PostgreSQL (api) / TypeScript monorepo (pnpm workspaces)
**Repo:** `https://github.com/Retrosero/saas_web_satis` (branch: `main`)
**Son güncelleme:** 2026-06-02 07:36 UTC

### Kritik kurallar (her editör bunları BİLMELİ)
- 🚨 **Türkçe UI** — kullanıcıya görünen her metin Türkçe, kod İngilizce
- 🚨 **Event-sourcing muhasebe** — bakiye/stok/kasa SAKLANMAZ, hareketlerden hesaplanır (`packages/shared/src/utils/accounting.ts`)
- 🚨 **Multi-tenant izolasyon** — her sorgu `tenantId` filtresi ile, asla tenant dışı veri dönmez
- 🚨 **Soft delete** — para/stok işlemlerinde DELETE yok, iptal = ters hareket
- 🚨 **Türkçe commit** — mesajlar Türkçe

---

## 📊 Son Durum

- **Faz:** FAZ 12 ✅ TAMAMLANDI (Raporlar Modülü)
- **Testler:** 46/46 accounting (vitest) ✅, API service testleri **yazılacak**
- **TypeScript:** web 0 error, api sadece pre-existing `products.service.ts unitId` hatası
- **Repo durumu:** GitHub main branch'inde, 12 commit, tüm kod push edilmiş

### Aktif branch
```
main
├── 896788f feat(faz12): raporlar modulu
├── 00f0b0d feat(faz11): kasa modulu
├── d4c8f1d feat(faz10): tahsilat modulu
├── 363b336 feat(faz9): siparis modulu
├── 9a7ce6a feat(faz6-8): cari + stok + satis modulleri
├── 300866f ci: pnpm ve lint pipeline duzeltmeleri
├── 310cdd4 ci: pnpm surum cakismasini gider
├── 6414d8c proje        ← Tasarımlar + proje.md (korundu)
└── bcae36e ilk commit
```

---

## ✅ Tamamlanan Fazlar (detay)

| FAZ | Modül | Backend | Frontend | Migration | Test |
|-----|-------|---------|----------|-----------|------|
| 0 | Mimari doküman | — | — | — | — |
| 1 | Monorepo iskeleti | — | — | — | — |
| 2 | DB şeması + muhasebe | — | — | init (504 satır) | **46/46** ✅ |
| 3 | Süper admin paneli | ✅ | 6 sayfa | — | — |
| 3.5 | Bildirim sistemi | ✅ | topbar dropdown | — | — |
| 4 | Tenant admin paneli | ✅ | 5 sayfa | — | — |
| 5 | Log & audit UI | ✅ | 3+2 tab + CSV | — | — |
| 6 | **Cari (Müşteri/Tedarikçi)** | customers modülü (7 endpoint) | 3 sayfa | cari_module (330 satır) | 13/13 ✅ |
| 7 | **Stok (Ürün/Depo)** | 3 modül (16 endpoint) | 5 sayfa | stok_module (288 satır) | — |
| 8 | **Satış** | sales modülü (6 endpoint) | 3 sayfa | satis_module (193 satır) | — |
| 9 | **Sipariş** | orders modülü (5 endpoint) | 3 sayfa | orders_module (193 satır) | — |
| 10 | **Tahsilat** | collections modülü (5 endpoint) | 3 sayfa | collections_module | — |
| 11 | **Kasa/Banka** | cash modülü (8 endpoint) | 2 sayfa | cash_module | — |
| 12 | **Raporlar** | reports modülü (5 endpoint) | 1 sayfa | (yok — aggregate) | — |

---

## 🏗️ Mimari Kararlar (Neden Bu Şekilde?)

| Karar | Neden |
|-------|-------|
| **NestJS+Prisma+PostgreSQL** (Laravel değil) | TypeScript uyumu + guard yapısı SaaS için ideal |
| **M3 (Material 3) "CariPro Soft"** | 4 farklı tasarım ailesi birleştirildi, tek hibrit tema |
| **Event-sourcing muhasebe** | Kullanıcı "sakın atlama" dedi — KRİTİK |
| **`@saas/shared` workspace** | Ortak tipler, enumlar, DTOs, Zod, muhasebe utility'leri |
| **Vite alias** `@saas/shared` → `packages/shared/src/index.ts` | Frontend direkt TS source kullanır, build yok |
| **Backend paths** `@saas/shared` → `packages/shared/src/index.ts` | tsconfig + rootDir trick ile |
| **`(this.prisma.client as any)` pattern** | Prisma client generate olmadan compile (sandbox kısıtı) |
| **Squash merge yerine düz commit** | Geçmişe dönük erişim kolaylığı |

---

## 📂 Kritik Dosya Yolları

### Mimari / doküman
- `docs/FAZ-0-ANALIZ-VE-MIMARI.md` — 15 maddelik mimari karar belgesi
- `docs/muhasebe-mantigi.md` — muhasebe felsefesi (en kritik doküman)
- `docs/FAZ-*` — faz faz yapılanlar
- `apps/api/prisma/schema.prisma` — tüm DB şeması (12 SaaS + 6 cari + 8 stok + 2 satış + 2 sipariş + 1 tahsilat + 1 kasa)

### Backend
- `apps/api/src/modules/{customers,products,warehouses,stock,sales,orders,collections,cash,reports}/` — 9 modül
- `apps/api/src/modules/auth/` — JWT + refresh token + guard pipeline
- `apps/api/src/common/guards/` — JwtAuthGuard, TenantGuard, PermissionGuard
- `apps/api/src/app.module.ts` — tüm modüllerin kayıt yeri

### Frontend
- `apps/web/src/router.tsx` — 25+ route
- `apps/web/src/components/layout/` — AppLayout, Sidebar, PageHeader
- `apps/web/src/features/{customers,products,warehouses,stock,sales,orders,collections,cash,reports}/api.ts` — 9 React Query API katmanı
- `apps/web/src/pages/{customers,products,warehouses,stock,sales,orders,collections,cash,reports}/` — 25+ sayfa

### Shared
- `packages/shared/src/utils/accounting.ts` — **EN KRİTİK** muhasebe kütüphanesi (22KB, 46 test)
- `packages/shared/src/enums/common.enum.ts` — ortak enum'lar (Customer/Order/Sale/Collection/Cash/PaymentStatus vb.)
- `packages/shared/src/types/` — interface'ler (Customer, Product, Sale, Order, Collection, CashAccount, CashMovement)
- `packages/shared/src/index.ts` — barrel export

---

## 🛠️ Komutlar (cheat sheet)

```bash
# Setup
pnpm install                  # Monorepo bağımlılıklar
cp .env.example apps/api/.env
docker compose up -d           # Postgres + Redis + MinIO
pnpm db:migrate               # Prisma migration
pnpm db:seed                  # Demo verileri

# Geliştirme
pnpm dev                      # web (5173) + api (3000) birlikte
pnpm --filter web build       # PWA bundle
pnpm --filter api start       # NestJS dev mode

# Test
pnpm --filter shared test     # vitest — 46 test (accounting)
# (FAZ 6-12 API testleri yazılacak — jest+sandbox'ta yok)

# Tip kontrol
pnpm typecheck                # 3 workspace, 0 hata (pre-existing products.service.ts unitId hariç)

# Push
# token'ı secret tool'a kaydet → git push origin main
```

### Demo hesaplar (seed sonrası)
- Süper admin: `admin@sistem.local` / `ChangeMe123!`
- Demo tenant admin: `admin@demo.local` / `Demo123!`
- Demo tenant code: `demo`

---

## ⏭️ Sıradaki Faz (öneri)

### FAZ 13 — Chat Bot Bilgi Tabanı + Test Coverage
- ✅ **Chat bot bilgi tabanı** — `docs/CHAT-BOT-KNOWLEDGE.md` (8 modül, 60+ örnek soru)
- ✅ **Skill** — `.skills/chat-bot-kb/SKILL.md` (her yeni modül için otomatik knowledge base güncelleme)
- ⏳ API testleri: orders, collections, cash, sales, reports (jest)
- ⏳ Bot query endpoint'i: POST /bot/query (NL→SQL)
- ⏳ Bot UI: chat panel (sağ alt köşede)
- `customers.service` zaten 13/13 ✅ (FAZ 6)
- `accounting.ts` 46/46 ✅ (FAZ 2)
- **Yazılacaklar:**
  - `orders.service.spec.ts` (PENDING→CONFIRMED, satışa bağlı kontrol)
  - `collections.service.spec.ts` (PENDING→CONFIRMED, müşteri/kasa hareket üretimi)
  - `cash.service.spec.ts` (bakiye hesabı event-sourced, ters kayıt)
  - `sales.service.spec.ts` (applySale entegrasyonu, otomatik hareketler)
  - `reports.service.spec.ts` (top debtors, stock alerts, trend)
- Lokal: `pnpm --filter api test` (jest + ts-jest)
- CI: GitHub Actions'a ekle

### FAZ 14 — Tamamlama / Polish
- Sayfa tasarımları (`sayfatasarimlari/`) ile karşılaştırma
- Demo data seed güncelleme (her modül için 5-10 örnek)
- README.md güncelleme (kurulum, demo bilgisi)
- `seed.ts` çalıştırma scripti (col, sales, orders, cash için)

### FAZ 15 — Production hazırlık
- `docker-compose.yml` doğrulama
- GitHub Actions CI/CD pipeline (lint + typecheck + test + build)
- Vite PWA cache stratejisi
- Rate limiting (NestJS throttler zaten var)
- Sentry / error tracking

### FAZ 16 — Bot Altyapısı
- `POST /bot/query` endpoint (NL→SQL)
- LLM entegrasyonu (GPT-4/Claude) veya rule-based intent classifier
- Frontend chat panel (sağ alt köşede)
- Bilgi tabanı: `docs/CHAT-BOT-KNOWLEDGE.md` (60+ soru)

---

## ⚠️ Bilinen Kısıtlar / TODO'lar

1. **Prisma generate** lokal yapılmalı (`pnpm prisma generate`) — sandbox DB yok
2. **TypeScript path** her iki tsconfig.json'da `@saas/shared` → `src/index.ts` (built dist değil)
3. **`products.service.ts` unitId** nullable uyumsuzluğu — FAZ 7'den, FAZ 8-12'de yeni hata yok
4. **Sayfa tasarımları** (`sayfatasarimlari/`) korundu ama UI implementasyonu eksik olabilir
5. **E2E test** (Playwright) yazılmadı — sadece unit/integration
6. **PaymentMethod** tablosu schema'da var ama kullanılmıyor (FAZ 16+)
7. **Mevcut TODO'lar** koda gömülü: ödeme yöntemleri dropdown, fatura PDF, e-imza

---

## 🔐 Güvenlik & Operasyon

- **GitHub PAT:** Geçici, secret tool'a kaydedilir, push sonrası silinir
- **.env:** Local'de, git'te yok
- **Multi-tenant bypass:** Asla `tenantId` filtresi unutulmaz
- **Soft delete:** `isDeleted=true` (fiziksel DELETE yok)

---

## 🤖 AI Asistan İçin Pratik İpuçları

1. **Kullanıcı "devam" derse**: PROGRESS.md'deki "Sıradaki Faz"a bak
2. **Türkçe konuş**: UI metinleri Türkçe, commit mesajları Türkçe, kullanıcı yanıtları Türkçe (ama kod/değişken İngilizce)
3. **Hata mesajları kullanıcıya sıcak**: `toast.error(msg)` Türkçe, backend'de `new BadRequestException('Açıklayıcı Türkçe mesaj')`
4. **Migration yazarken**: Prisma schema'da model değişince `apps/api/prisma/migrations/{TARIH}_{MODUL}/migration.sql` oluştur
5. **Test yazarken**: Vitest (shared) + Jest (api) — prisma'yı mock'la, gerçek DB olmadan çalıştır
6. **Push öncesi**: token'ı secret tool'a kaydet, push sonrası sil
7. **Her commit öncesi**: `node_modules/.bin/tsc --noEmit -p apps/web/tsconfig.json` ve `... apps/api/tsconfig.json`

---

## 📜 Değişiklik Geçmişi

| Tarih | Editör | Değişiklik |
|-------|--------|------------|
| 2026-06-02 07:36 | Mavis | FAZ 12 Raporlar push, PROGRESS.md güncellendi (FAZ 7 → FAZ 12) |
| 2026-06-02 06:00 | Mavis | FAZ 11 Kasa push |
| 2026-06-02 05:00 | Mavis | FAZ 10 Tahsilat push |
| 2026-06-02 04:30 | Mavis | FAZ 9 Sipariş push |
| 2026-06-01 22:00 | Mavis | FAZ 6-8 (cari + stok + satış) tek commit |
| 2026-06-01 19:00 | CI | Pipeline fix (pnpm + lint) |
| 2026-06-01 14:00 | - | İlk commit: proje.md + tasarımlar |

