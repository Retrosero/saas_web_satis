# FAZ 0 — PROJE ANALİZİ, MİMARİ VE ÖN TASARIM DOKÜMANI

> **Proje:** SaaS İşletme Yönetim Platformu (Çok Firmalı, Modüler, Paket Bazlı)
> **Hazırlayan:** Proje Mimarı / Orkestratör
> **Tarih:** 2026-06-01
> **Durum:** Onay Bekliyor
> **Referans Repo:** https://github.com/Retrosero/saas_web_satis
> **Referans Tasarım Klasörü:** `sayfatasarimlari/` (100+ HTML ekran tasarımı)

---

## 1. PROJENİN KISA ÖZETİ

**Vizyon:** Türkiye pazarına yönelik, **çok kiracılı (multi-tenant)**, **modüler**, **paket bazlı satılabilir**, **%100 Türkçe** bir SaaS işletme yönetim platformu. Küçük bir firmadan kurumsal bir şirkete kadar her ölçekte satılabilir; her firma sadece kendi paketine dahil modülleri görür ve kullanır.

**Temel Özellikler:**
- **Multi-tenant SaaS mimarisi** — her firma tamamen izole, tek veritabanında `tenant_id` ayrımı.
- **Modüler yapı** — cari, stok, satış, sipariş, tahsilat, kasa, banka, POS, depo, sayım, iade, raporlar, İK, zimmet, servis, bayi portalı, API/webhook, ERP entegrasyon, log, destek, bildirim, akıllı asistan altyapısı.
- **Paket sistemi** — Başlangıç / Standart / Profesyonel / Kurumsal / Firmaya Özel.
- **Çift çalışma modu** — `SAAS_MASTER` (SaaS veritabanı ana kaynak) ve `ERP_MASTER` (Mikro/Logo/Netsis/Paraşüt ana kaynak).
- **Gelişmiş RBAC** — modül, sayfa, buton, veri erişim seviyelerinde yetkilendirme.
- **Soft delete & ters kayıt mantığı** — para/stok işlemlerinde fiziksel silme yok, iptal/ters kayıt.
- **Hareket bazlı muhasebe mantığı** — cari bakiyeler ve stok miktarları sadece hareketlerden izlenir, direkt güncelleme yok.
- **Cloudflare R2 storage** — tenant/paket bazlı kota ile dosya ve görsel yönetimi.
- **Log & audit** — her kritik işlem loglanır, süper admin ve firma admin kendi log merkezinden izler.
- **PWA uyumlu responsive arayüz** — masaüstü, tablet, mobil; saha satışa uygun sadelik.

**İlk MVP Kapsamı:** Auth, tenant, süper admin, paket/modül, RBAC, log altyapısı, cari, stok, satış, sipariş, tahsilat, kasa, temel raporlar, Excel import, R2 storage, PWA iyileştirme.

**Sonraki Fazlar (altyapısı hazır olacak ama kodlanmayacak):** Windows masaüstü, mobil native, ERP adaptörleri, bayi portalı, public API, akıllı asistan, servis/bakım, zimmet.

---

## 2. TASARIM DİLİ ÖZETİ (sayfatasarimlari/ klasöründen çıkarılan)

Mevcut klasörde **100'den fazla statik HTML ekran tasarımı** var. Yapılan analiz sonucu **4 farklı tasarım ailesi** tespit edildi:

| Aile | Ekranlar | Font | Birincil Renk | Karakter |
|------|----------|------|---------------|----------|
| **A. Pastel M3 (Soft)** | giriş_modern_pastel, yeni_kayıt_modern_pastel, dashboard_hareketli_mobil, müşteri_kataloğu | Manrope + Plus Jakarta Sans | `#405ba6` (mavi) | Yumuşak, davetkar, B2C hissi |
| **B. B2B Kurumsal (Inter)** | dashboard_ana_sayfa, satış_ekran, sipariş_listesi, hızlı_satış | Inter + JetBrains Mono | `#003d9b` (koyu mavi) | Profesyonel, B2B satış paneli |
| **C. CariPro (Lacivert)** | cari_hesaplar, cari_hesap_detay, katalog_yonetimi | Hanken Grotesk | `#00083d` (koyu lacivert) + `#006a60` (turkuaz vurgu) | Net, kontrast yüksek, ERP tarzı |
| **D. OpsConsole (Dark Sidebar)** | stok_listesi, stok_takibi, manuel_stok | Hanken Grotesk | `#00083d` + `#00D7C4` (turkuaz) | Sidebar koyu, içerik açık, veri yoğun ekranlar |

### 2.1 Birleşik Tasarım Sistemi Önerisi (MVP İçin)

**Karar:** MVP'de **tek birleşik tema** kullanılacak. Yeni sayfalar açılırken farklı aileler karışmayacak.

**Tavsiye edilen ana tema — "A + C hibrit" (CariPro Soft):**
- **Tipografi:** `Inter` (ana metin) + `JetBrains Mono` (sayılar/fiyler) — B ailesinden.
- **Renk sistemi:** Material 3 token yapısı:
  - `primary`: `#1E3A8A` (kurumsal lacivert)
  - `secondary`: `#0D9488` (turkuaz — C/D ailelerinin başarılı vurgu rengi)
  - `tertiary`: `#D97706` (uyarı/aksiyon)
  - `surface` tonları: `container-lowest` (beyaz) → `container-highest` (soluk mavi)
  - `error`: `#BA1A1A`
- **Geometri:**
  - Köşe yarıçapı: `15px` (kart/buton/input) ve `9999px` (badge)
  - Boşluk ölçeği: 4-8-12-16-24-32-48 (`base / xs / sm / md / lg / xl / 2xl`)
- **İkon:** `Material Symbols Outlined` (var, weight 0/1 ile filled/outlined ayrımı).
- **Layout:**
  - **Desktop:** Sol kenar çubuğu (sidebar, 280px, koyu) + üst bar (topbar, arama+bildirim+profil) + içerik.
  - **Mobil:** Üst bar + alt menü (mobile bottom nav) + içerik.
  - **Auth:** Tam ekran, ortalanmış kart, pastel arka plan.
- **Bileşen kalıpları:**
  - **KPI/Bento kart:** 1/2/4 sütun grid, ikonlu başlık, ana metin (display), yüzde değişim rozeti.
  - **Veri tablosu:** sticky header, satır aksiyon menüsü (3 nokta), sağ üstte filtre+arama+export+ekle.
  - **Filtre çubuğu:** yatayda chip + tarih aralığı + "Filtrele" / "Temizle".
  - **Detay sayfası:** üstte başlık + aksiyon butonları (düzenle/sil/yazdır), sekmeli içerik, sağda özet kartı.
  - **Form:** section gruplu, üstünde başlık, altta sağa yaslı aksiyonlar (Vazgeç / Kaydet).
  - **Boş/Hata/Yükleniyor durumları:** her liste ve detay sayfasında.
- **Erişilebilirlik:** kontrast AA, klavye odak halkası (`focus:ring-2 focus:ring-primary/20`), 48px dokunma hedefi.

### 2.2 Yeni Sayfa Üretim Kuralı

Tasarım bulunmayan sayfalar (örn. ERP entegrasyon ayarları, webhook yönetimi) için **mevcut en yakın ailenin bileşenleri** kullanılarak yeni sayfa üretilecek. Kullanıcıya özel "görsel mockup" sormaya gerek olmayacak; tasarım sistemi tek gerçek kaynak olacak.

---

## 3. ÖNERİLEN TEKNOLOJİ STACK

### 3.1 Frontend
| Katman | Tercih | Gerekçe |
|--------|--------|---------|
| Framework | **React 18 + Vite** | Hızlı HMR, modern toolchain, shadcn/ui uyumu |
| Dil | **TypeScript (strict)** | Tip güvenliği, backend ile uyum |
| Stil | **Tailwind CSS v3** | Mevcut tasarımların %100'ü Tailwind |
| Component | **shadcn/ui + Radix UI** | Erişilebilir, kopyala-yapıştır, özelleştirilebilir |
| State | **Zustand** (UI/global) + **TanStack Query** (server state) | Sadelik, performans |
| Form | **React Hook Form + Zod** | Tip güvenli validasyon, performans |
| Routing | **React Router v6** | Standart, lazy loading destekli |
| Tablo | **TanStack Table v8** | Headless, esnek, sanallaştırma |
| Tarih | **date-fns** (Türkçe locale) | Hafif, i18n dostu |
| Para | **Dinamik format** (Intl.NumberFormat 'tr-TR') | Tarayıcı API'si yeterli |
| PWA | **vite-plugin-pwa (Workbox)** | Service worker, manifest, offline shell |
| Test | **Vitest + React Testing Library + Playwright (E2E)** | Hızlı unit, gerçekçi E2E |

### 3.2 Backend
| Katman | Tercih | Gerekçe |
|--------|--------|---------|
| Runtime | **Node.js 20 LTS** | Stabil, yaygın |
| Framework | **NestJS 10** | Modüler, DI, guard/interceptor/pipeline mimarisi SaaS için biçilmiş kaftan; TypeScript uyumlu |
| ORM | **Prisma 5** | Tip güvenli, migration CLI güçlü, multi-dialect |
| DB | **PostgreSQL 16** | RLS desteği ileride eklenebilir, JSONB, güçlü index |
| Cache/Queue | **Redis 7** (opsiyonel MVP'de) | Oturum, rate limit, job queue (Excel import) |
| Validation | **class-validator + class-transformer** | NestJS ile doğal |
| Auth | **@nestjs/jwt + passport-jwt + argon2** | Refresh token rotation, modern hash |
| Doc | **Swagger (OpenAPI 3)** — `@nestjs/swagger` | Otomatik API doc, frontend için tip üretimi |
| Storage SDK | **@aws-sdk/client-s3** (R2 uyumlu) | R2 S3 API'sini destekler |
| Excel | **exceljs** (xlsx okuma/yazma, stream) | Büyük dosya, ön izleme |
| Logger | **pino** (JSON log, hızlı) | Üretim için ideal |
| Test | **Jest + supertest** | NestJS ile entegre |

### 3.3 Altyapı
| Katman | Tercih |
|--------|--------|
| Object Storage | **Cloudflare R2** (S3 uyumlu API) |
| Email | **Resend** veya SMTP (Pazarlama/transactional) — MVP sonrası |
| Deploy (öneri) | Backend: Fly.io / Railway / Hetzner; Frontend: Cloudflare Pages veya Vercel; DB: Neon / Supabase Postgres |
| Container | Docker + docker-compose (local geliştirme) |
| CI/CD | GitHub Actions (lint, test, build, typecheck) |
| Monitoring | Sentry (FE+BE), Pino log → Loki/CloudWatch |

### 3.4 Neden NestJS + Prisma + PostgreSQL?
- **NestJS'in guard/interceptor yapısı**, her istekte tenant/modül/permission kontrolünü pipeline'a bağlamayı çok kolaylaştırır — SaaS için kritik.
- **Prisma'nın migration sistemi** `prisma migrate` ile zorunlu ve geri alınabilir. Migration'sız tablo değişikliği yapılamaz.
- **PostgreSQL**: `partial index` (örn. `WHERE deleted_at IS NULL`), `JSONB` (esnek metadata), `CITEXT` (case-insensitive email), `generated columns` (örn. bakiye özet için) desteği.

---

## 4. FRONTEND KLASÖR YAPISI

Monorepo önerisi: **TEK REPO — `apps/web` + `apps/api` + `packages/shared` + `packages/ui`** (pnpm workspaces).

```
saas_web_satis/
├── apps/
│   ├── web/                        # React + Vite + TS
│   │   ├── public/
│   │   │   ├── manifest.webmanifest
│   │   │   ├── icons/              # PWA ikonları
│   │   │   └── locales/            # i18n (ileride)
│   │   ├── src/
│   │   │   ├── main.tsx
│   │   │   ├── App.tsx
│   │   │   ├── router.tsx
│   │   │   ├── layouts/
│   │   │   │   ├── AppLayout.tsx           # sidebar + topbar + content
│   │   │   │   ├── AuthLayout.tsx          # giriş/kayıt için
│   │   │   │   ├── DashboardLayout.tsx     # ana panel iç yapısı
│   │   │   │   └── PublicLayout.tsx        # bayi portal (ileride)
│   │   │   ├── pages/
│   │   │   │   ├── auth/
│   │   │   │   │   ├── LoginPage.tsx
│   │   │   │   │   ├── ForgotPasswordPage.tsx
│   │   │   │   │   └── ResetPasswordPage.tsx
│   │   │   │   ├── super-admin/
│   │   │   │   │   ├── TenantsPage.tsx
│   │   │   │   │   ├── PlansPage.tsx
│   │   │   │   │   ├── ModulesPage.tsx
│   │   │   │   │   ├── SystemLogsPage.tsx
│   │   │   │   │   └── StorageMonitorPage.tsx
│   │   │   │   ├── dashboard/
│   │   │   │   │   ├── DashboardPage.tsx
│   │   │   │   │   └── SuperAdminDashboard.tsx
│   │   │   │   ├── customers/              # cari
│   │   │   │   ├── products/               # stok
│   │   │   │   ├── sales/                  # satış
│   │   │   │   ├── orders/                 # sipariş
│   │   │   │   ├── collections/            # tahsilat
│   │   │   │   ├── cash/                   # kasa
│   │   │   │   ├── reports/                # raporlar
│   │   │   │   ├── import/                 # excel import
│   │   │   │   ├── settings/               # firma ayarları
│   │   │   │   ├── users/                  # kullanıcı/rol/yetki
│   │   │   │   └── errors/
│   │   │   │       ├── NotFoundPage.tsx
│   │   │   │       ├── ForbiddenPage.tsx
│   │   │   │       └── ErrorPage.tsx
│   │   │   ├── features/                   # modül bazlı mantık (UI'dan ayrı)
│   │   │   │   ├── auth/
│   │   │   │   │   ├── api.ts
│   │   │   │   │   ├── hooks.ts
│   │   │   │   │   ├── store.ts
│   │   │   │   │   └── schemas.ts
│   │   │   │   ├── customers/
│   │   │   │   ├── products/
│   │   │   │   ├── sales/
│   │   │   │   └── ...
│   │   │   ├── components/                 # → aşağıda detay
│   │   │   ├── hooks/
│   │   │   ├── lib/
│   │   │   │   ├── api-client.ts           # axios + interceptor
│   │   │   │   ├── query-client.ts
│   │   │   │   ├── format.ts               # para, tarih
│   │   │   │   ├── permissions.ts
│   │   │   │   └── errors.ts
│   │   │   ├── stores/                     # zustand global
│   │   │   ├── styles/
│   │   │   │   ├── tokens.css              # M3 renk değişkenleri
│   │   │   │   └── globals.css
│   │   │   └── types/
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   ├── tailwind.config.ts
│   │   ├── postcss.config.js
│   │   ├── tsconfig.json
│   │   └── package.json
│   └── api/                        # NestJS
│       ├── src/
│       ├── prisma/
│       ├── test/
│       └── package.json
├── packages/
│   ├── shared/                     # ortak tipler, enum, DTO
│   │   ├── src/
│   │   │   ├── types/
│   │   │   ├── enums/
│   │   │   ├── dto/                # ortak DTO (örn. PaginatedResponse)
│   │   │   └── constants/
│   │   └── package.json
│   └── ui/                         # ortak component (shadcn tabanlı)
│       ├── src/
│       │   ├── components/         # Button, Input, DataTable...
│       │   ├── tokens/             # M3 token export
│       │   └── index.ts
│       └── package.json
├── pnpm-workspace.yaml
├── package.json
├── .editorconfig
├── .gitignore
├── .nvmrc
├── README.md
└── docs/                           # proje dokümanları
```

**Neden bu yapı?**
- `apps/web` ve `apps/api` ayrı deployable — frontend CDN'e, backend container'a.
- `packages/shared` içinde enum/DTO ortak; frontend ve backend arası tip uyumu.
- `packages/ui` MVP'de opsiyonel ama tasarım sistemi tek kaynaktan yönetilir.
- `features/` dizini UI'dan bağımsız iş mantığı içerir; test edilebilir, taşınabilir.

---

## 5. COMPONENT KLASÖR YAPISI

Frontend component sistemi `apps/web/src/components/` ve `packages/ui/src/components/` altında iki seviyede.

```
components/
├── layout/                         # Layout bileşenleri
│   ├── AppLayout.tsx
│   ├── AuthLayout.tsx
│   ├── Sidebar.tsx
│   ├── Topbar.tsx
│   ├── MobileBottomNav.tsx
│   ├── PageHeader.tsx
│   ├── Breadcrumb.tsx
│   ├── ModuleGuard.tsx             # modül aktif mi?
│   └── PermissionGuard.tsx         # permission var mı?
├── forms/                          # Form bileşenleri
│   ├── TextInput.tsx
│   ├── NumberInput.tsx
│   ├── CurrencyInput.tsx
│   ├── SelectInput.tsx
│   ├── DateInput.tsx
│   ├── DateRangeInput.tsx
│   ├── SearchInput.tsx
│   ├── TextareaInput.tsx
│   ├── CheckboxInput.tsx
│   ├── FormSection.tsx
│   ├── FormActions.tsx
│   └── ValidationMessage.tsx
├── data/                           # Tablo/Liste
│   ├── DataTable.tsx
│   ├── DataTableHeader.tsx
│   ├── DataTableFilter.tsx
│   ├── DataTablePagination.tsx
│   ├── DataTableActions.tsx
│   ├── DataTableRowActions.tsx
│   ├── EmptyState.tsx
│   ├── LoadingState.tsx
│   ├── ErrorState.tsx
│   └── MobileCardList.tsx
├── cards/
│   ├── StatCard.tsx
│   ├── ModuleCard.tsx
│   ├── InfoCard.tsx
│   ├── AlertCard.tsx
│   ├── CustomerCard.tsx
│   ├── ProductCard.tsx
│   └── ReportCard.tsx
├── modals/
│   ├── ConfirmModal.tsx
│   ├── FormModal.tsx
│   ├── DetailDrawer.tsx
│   ├── FilterDrawer.tsx
│   └── ActionSheet.tsx
├── actions/                        # İşlem butonları
│   ├── SaveButton.tsx
│   ├── DeleteButton.tsx
│   ├── CancelButton.tsx
│   ├── EditButton.tsx
│   ├── ExportButton.tsx
│   ├── ImportButton.tsx
│   ├── PrintButton.tsx
│   ├── StatusBadge.tsx
│   ├── SyncStatusBadge.tsx
│   └── ModuleStatusBadge.tsx
├── notifications/
│   ├── Toast.tsx
│   ├── AlertBox.tsx
│   ├── NotificationItem.tsx
│   └── SystemWarningBanner.tsx
├── files/
│   ├── FileUploader.tsx
│   ├── ImageUploader.tsx
│   ├── FilePreview.tsx
│   └── StorageUsageBar.tsx
├── permissions/
│   ├── RoleSelector.tsx
│   ├── PermissionMatrix.tsx
│   └── UserAccessScopeSelector.tsx
└── saas/
    ├── PlanCard.tsx
    ├── ModuleToggle.tsx
    ├── TenantStatusBadge.tsx
    ├── SubscriptionStatusCard.tsx
    └── StorageLimitCard.tsx
```

**Component kuralları:**
1. Her component TypeScript ile yazılır, generic ve prop-tip güvenli.
2. Tekrar eden hiçbir HTML yapısı sayfa içine gömülmez; component'ten gelir.
3. shadcn/ui bazlı; `cn()` helper ile sınıf birleştirme.
4. Form validasyonu RHF + Zod ile, hata mesajları `ValidationMessage` üzerinden.
5. Liste/Detay aksiyonları her zaman `ModuleGuard` + `PermissionGuard` ile sarılır.

---

## 6. BACKEND KLASÖR YAPISI (NestJS)

```
apps/api/
├── prisma/
│   ├── schema.prisma                # ana şema
│   ├── migrations/                  # migration dosyaları
│   ├── seed.ts                      # seed verisi
│   └── seed/
│       ├── plans.ts
│       ├── modules.ts
│       ├── permissions.ts
│       └── super-admin.ts
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── common/
│   │   ├── decorators/
│   │   │   ├── current-user.decorator.ts
│   │   │   ├── tenant-id.decorator.ts
│   │   │   ├── permissions.decorator.ts
│   │   │   └── public.decorator.ts
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   ├── tenant.guard.ts
│   │   │   ├── subscription.guard.ts
│   │   │   ├── module.guard.ts
│   │   │   └── permission.guard.ts
│   │   ├── interceptors/
│   │   │   ├── audit-log.interceptor.ts
│   │   │   ├── response.interceptor.ts
│   │   │   └── timeout.interceptor.ts
│   │   ├── filters/
│   │   │   ├── http-exception.filter.ts
│   │   │   └── prisma-exception.filter.ts
│   │   ├── pipes/
│   │   │   └── zod-validation.pipe.ts
│   │   ├── middleware/
│   │   │   ├── tenant-resolver.middleware.ts
│   │   │   └── request-logger.middleware.ts
│   │   ├── services/
│   │   │   ├── audit-log.service.ts
│   │   │   ├── error-log.service.ts
│   │   │   └── storage.service.ts
│   │   └── utils/
│   │       ├── pagination.ts
│   │       ├── hash.ts
│   │       ├── mask.ts
│   │       └── id.ts
│   ├── config/
│   │   ├── app.config.ts
│   │   ├── database.config.ts
│   │   ├── jwt.config.ts
│   │   ├── r2.config.ts
│   │   └── validation.schema.ts
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── strategies/jwt.strategy.ts
│   │   │   ├── strategies/refresh.strategy.ts
│   │   │   └── dto/
│   │   ├── tenants/
│   │   ├── users/
│   │   ├── roles/
│   │   ├── permissions/
│   │   ├── modules/
│   │   ├── plans/
│   │   ├── subscriptions/
│   │   ├── customers/                # cari
│   │   ├── customer-movements/
│   │   ├── products/                 # stok
│   │   ├── product-barcodes/
│   │   ├── product-categories/
│   │   ├── brands/
│   │   ├── warehouses/
│   │   ├── stock-movements/
│   │   ├── sales/                    # satış
│   │   ├── sale-items/
│   │   ├── orders/                   # sipariş
│   │   ├── order-items/
│   │   ├── collections/              # tahsilat
│   │   ├── cash-accounts/            # kasa
│   │   ├── cash-movements/
│   │   ├── reports/
│   │   ├── imports/                  # excel
│   │   ├── files/                    # R2 storage
│   │   ├── audit-logs/
│   │   ├── error-logs/
│   │   ├── system-alerts/
│   │   └── super-admin/              # süper admin paneline özel controller
│   ├── prisma/
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts         # TenantAwarePrismaService wrapper
│   └── health/
│       └── health.controller.ts
├── test/
│   ├── e2e/
│   ├── integration/
│   └── unit/
├── .env.example
├── nest-cli.json
├── tsconfig.json
└── package.json
```

**Her modülün iç yapısı:**
- `*.module.ts` — Nest modülü
- `*.controller.ts` — HTTP uçları (validation, guard çağrısı)
- `*.service.ts` — iş mantığı
- `*.repository.ts` — Prisma erişim katmanı
- `dto/` — request/response tipleri (Zod şemaları)
- `entities/` — domain modelleri (Prisma'dan üretilen tip genişletmeleri)
- `guards/` — modüle özel ek guard'lar (örn. cari için cari:read)

**Neden katmanlı (controller → service → repository)?**
- Controller sadece HTTP + guard ile ilgilenir.
- Service iş mantığını yürütür (örn. satış iptalinde ters hareket üretme).
- Repository DB erişimini izole eder; testte mocklanabilir.
- Transaction'lar service katmanında Prisma `$transaction` ile yönetilir.

---

## 7. İLK VERİTABANI TAbLO LİSTESİ

Aşağıdaki 35 tablo MVP'yi ve sonraki faz altyapısını karşılar. Tüm tablolarda standart alanlar: `id (cuid)`, `tenant_id (FK, NULL olabilir sadece SaaS-kök tablolarda)`, `created_at`, `updated_at`, `created_by (FK users, NULL)`, `updated_by`, `is_active (bool)`, `is_deleted (bool)`, `deleted_at (NULL)`, `deleted_by`.

### 7.1 SaaS Çekirdek (10 tablo)
| # | Tablo | Amaç |
|---|-------|------|
| 1 | `tenants` | Firmalar |
| 2 | `tenant_settings` | Firma ayarları (JSONB) |
| 3 | `users` | Tüm kullanıcılar (süper admin dahil) |
| 4 | `roles` | Roller (süper admin, firma admin, muhasebeci vs.) |
| 5 | `permissions` | Permission katalog (modül:sayfa:işlem) |
| 6 | `role_permissions` | Rol → permission eşlemesi |
| 7 | `user_roles` | Kullanıcı → rol eşlemesi (tenant kapsamında) |
| 8 | `modules` | Modül kataloğu (kod, ad, ikon, path) |
| 9 | `plans` | Paket tanımları |
| 10 | `plan_modules` | Paket → modül eşlemesi (limitlerle) |
| 11 | `tenant_modules` | Firmaya özel modül aç/kapat ve limit override |
| 12 | `subscriptions` | Aktif abonelik kaydı (firma, paket, başlangıç, bitiş, durum) |

### 7.2 Cari / Stok / Satış / Operasyon (16 tablo)
| # | Tablo | Amaç |
|---|-------|------|
| 13 | `customers` | Cari hesaplar |
| 14 | `customer_movements` | Cari hareketler (borç/alacak, hareket tipi, ref) |
| 15 | `products` | Ürünler / stok kartları |
| 16 | `product_barcodes` | Barkodlar (1 ürün → N barkod) |
| 17 | `product_categories` | Kategoriler (ağaç) |
| 18 | `brands` | Markalar |
| 19 | `warehouses` | Depolar |
| 20 | `stock_movements` | Stok hareketleri (giriş/çıkış, ref) |
| 21 | `sales` | Satış başlık |
| 22 | `sale_items` | Satış kalemleri |
| 23 | `orders` | Sipariş başlık |
| 24 | `order_items` | Sipariş kalemleri |
| 25 | `collections` | Tahsilat kayıtları |
| 26 | `cash_accounts` | Kasa tanımları |
| 27 | `cash_movements` | Kasa hareketleri |
| 28 | `bank_accounts` | Banka tanımları (MVP sonrası kullanım) |

### 7.3 Log & Audit (5 tablo)
| # | Tablo | Amaç |
|---|-------|------|
| 29 | `audit_logs` | Kritik işlem audit trail |
| 30 | `error_logs` | Uygulama hataları |
| 31 | `security_logs` | Giriş/çıkış, başarısız deneme, IP, UA |
| 32 | `api_logs` | API istek logları (yavaş sorgu izleme) |
| 33 | `system_alerts` | Süper admin uyarı kuyruğu |

### 7.4 Import / Arşiv (4 tablo)
| # | Tablo | Amaç |
|---|-------|------|
| 34 | `import_batches` | Excel import batch'leri |
| 35 | `import_errors` | Hatalı satırlar |
| 36 | `archived_sales` | Eski sistemden gelen satış geçmişi (cari/stok ETKİLEMEZ) |
| 37 | `archived_sale_items` | Arşiv satır kalemleri |

### 7.5 Storage (3 tablo)
| # | Tablo | Amaç |
|---|-------|------|
| 38 | `files` | Dosya metadata (R2 key, mime, boyut, tenant, modül) |
| 39 | `tenant_storage_limits` | Paket bazlı kota tanımı |
| 40 | `tenant_storage_usage` | Anlık kullanım sayacı (modül bazlı kırılım) |

### 7.6 Akıllı Asistan Altyapısı (3 tablo)
| # | Tablo | Amaç |
|---|-------|------|
| 41 | `assistant_knowledge_base` | Modül bazlı yardım/dokümantasyon (modül, başlık, içerik) |
| 42 | `assistant_tools` | Asistan'ın kullanabileceği API tool listesi (güvenli kapsam) |
| 43 | `assistant_question_logs` | Sorulan sorular (anonimleştirilmiş) |

### 7.7 API & Webhook (5 tablo)
| # | Tablo | Amaç |
|---|-------|------|
| 44 | `api_keys` | Public API anahtarları |
| 45 | `api_key_permissions` | Anahtar → modül/permission |
| 46 | `webhook_endpoints` | Abone URL'ler |
| 47 | `webhook_events` | Event tanımları |
| 48 | `webhook_delivery_logs` | Teslim denemeleri |

**Toplam: 48 tablo.** Prisma `schema.prisma` dosyasında modellenmiş, ilk MVP için 30 tanesi aktif kullanılacak; geri kalanı ileride açılacak.

**Önemli ERP-entegrasyon alanları** (cari, ürün, sipariş, satış tablolarında):
```
source_system         String?   // 'MICRO', 'LOGO', 'NETSIS', 'PARASUT', 'SAAS'
external_id           String?   // ERP'deki Id
external_updated_at   DateTime?
last_seen_in_source_at DateTime?
source_status         String?   // 'ACTIVE', 'PASSIVE', 'DELETED'
sync_status           String?   // 'SYNCED', 'PENDING', 'CONFLICT', 'IGNORED'
import_batch_id       String?
import_status         String?
import_error          String?
```

Bu alanlar MVP'de dolu olmak zorunda değil ama kolonlar şemada hazır bulunacak.

### 7.4 Şema Diyagramı (Özet)

Detaylı tablo şeması için: [`docs/db/01-schema-detay.md`](./db/01-schema-detay.md). Mermaid diyagramı için: [`docs/db/02-schema-diagram.md`](./db/02-schema-diagram.md).

---

## 8. MİGRATİON STRATEJİSİ

**Kural:** Migration olmadan hiçbir tablo değişikliği yapılmayacak. Prisma migration bu işin tek aracı.

### 8.1 Prisma Migration Kuralları
1. **Tek geliştirici ortamı için:** `npx prisma migrate dev --name aciklama` ile migration üretilir.
2. **Üretim:** `npx prisma migrate deploy` ile uygulanır; el ile SQL yasak.
3. **Geri alınabilir migration:** Geri alma gerekirse yeni bir migration yazılır, eski geri sarılmaz.
4. **Migration dosya adlandırma:** `20260601120000_add_tenant_modules_table/migration.sql`.
5. **Migration her PR'da review edilir:** Veritabanı ajanı (DB & Migration Ajanı) tarafından kontrol.
6. **Yasaklar:**
   - `prisma db push` prod'da yasak.
   - Migration içinde `DROP COLUMN` yok; soft delete tercih edilir.
   - Veri kaybına yol açacak migration için onay mekanizması (önce dry-run, geri alma prosedürü notu).
7. **Seed verisi:** `prisma/seed.ts` ile başlangıç verileri (süper admin, modül kataloğu, paketler, permission kataloğu).

### 8.2 Tablo Ortak Alanları Standardı
Her yeni tablo eklendiğinde **migration şablonu**:
```sql
CREATE TABLE x (
  id            TEXT PRIMARY KEY,
  tenant_id     TEXT NOT NULL REFERENCES tenants(id),
  is_active     BOOLEAN NOT NULL DEFAULT true,
  is_deleted    BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP(3) NOT NULL,
  created_by    TEXT REFERENCES users(id),
  updated_by    TEXT REFERENCES users(id),
  deleted_at    TIMESTAMP(3),
  deleted_by    TEXT REFERENCES users(id)
);
CREATE INDEX idx_x_tenant ON x(tenant_id);
CREATE INDEX idx_x_tenant_active ON x(tenant_id) WHERE is_deleted = false;
```

### 8.3 Index Stratejisi
- **Zorunlu:** `(tenant_id)`, `(tenant_id, is_deleted)`, `(tenant_id, created_at DESC)`.
- **Tekil:** Tenant kapsamında benzersiz alanlar (örn. cari kodu, ürün barkodu) → `UNIQUE(tenant_id, code)`.
- **Raporlama:** `(tenant_id, sale_date)` `(tenant_id, customer_id, created_at)`.
- **Partial index:** `WHERE is_deleted = false` (soft delete'leri dışla).

### 8.4 Versiyon Takibi
- Her migration DB & Migration Ajanı tarafından kontrol edilir.
- Migration README'si (`prisma/migrations/README.md`) ile tutulur.
- Büyük şema değişikliklerinde (ör. ERP entegrasyonu açıldığında) `migration-strategy.md` dokümanı yazılır.

---

## 9. AUTH + TENANT + YETKİ AKIŞI

### 9.1 Auth Akışı (JWT + Refresh)
```
[Kullanıcı] → POST /api/v1/auth/login {email, password}
   ↓
[AuthService] → DB'den user + tenant + active subscription al
   ↓
Şifre argon2 ile doğrulanır
   ↓
Access token (15dk, JWT, payload: sub, tid, role) + Refresh token (7g, httpOnly cookie)
   ↓
Response: { user, tenant, permissions[], modules[] }
```

- **Access token:** Bellekte (Zustand), 15dk.
- **Refresh token:** httpOnly + secure + sameSite=strict cookie, rotation ile.
- **Çıkış:** Refresh token DB'de invalid sayılır (revoked_at).
- **Şifre politikası:** Min 8 karakter, büyük/küçük harf + rakam; zayıf parolalar reddedilir (zxcvbn).
- **Rate limit:** `/auth/login` → 5 deneme / 15dk / IP.

### 9.2 Tenant Çözümleme
- **Kök alan adı:** `app.sirketiniz.com` → süper admin login.
- **Tenant URL stratejisi:** `firma1.sirketiniz.com` (subdomain) VEYA `app.sirketiniz.com/t/firma1` (path). MVP'de **path-based** (`/t/:tenantSlug`) yeterli; subdomain altyapısı sonradan.
- **Kullanıcı birden fazla tenant'a üye olabilir:** Giriş sonrası `select-tenant` ekranı; ardından `tenantId` token claim'ine eklenir.

### 9.3 Pipeline (Her İstek İçin Zorunlu)
```
Request
  → RequestLoggerMiddleware      (api_logs)
  → TenantResolverMiddleware      (path veya JWT'den tenantId al)
  → JwtAuthGuard                  (token doğrula)
  → TenantGuard                   (tenant aktif mi? suspended mi?)
  → SubscriptionGuard             (abonelik süresi dolmuş mu?)
  → ModuleGuard                   (modül aktif mi? tenant_modules'de)
  → PermissionGuard @Permissions() (rol yeterli mi?)
  → Controller → Service → Repository
  → ResponseInterceptor           (standart response envelope)
  → AuditLogInterceptor           (POST/PUT/DELETE için)
```

**Bu pipeline sayesinde:**
- Modül kapalıyken API endpoint'i 403 döner (UI butonu gizlemek yetmez, API tarafı da korumalı).
- Bir firma kullanıcısı başka firmaya ait `id` ile istek atsa 404 (var/yok sızdırma).
- Audit log her kritik işlemde otomatik oluşur.

### 9.4 Yetki Modeli (4 Katman)
1. **Modül yetkisi:** Kullanıcının rolü bu modüle erişebilir mi? (örn. `cari:read`)
2. **Sayfa yetkisi:** Belirli sayfayı açabilir mi? (örn. `customers.balance_report:view`)
3. **İşlem/buton yetkisi:** Belirli aksiyonu yapabilir mi? (örn. `customers:delete`, `sales:cancel`)
4. **Veri erişim yetkisi:** Sadece kendi şubesi mi, tüm firma mı? (data scope: `OWN` / `BRANCH` / `TENANT`)

Permission formatı: `modul:resource:action` → örnekler:
```
cari:view
cari:create
cari:update
cari:delete
cari:export
cari.balance_report:view
satis:fis:create
satis:fis:cancel
stok:transfer:approve
admin:user:manage
admin:role:manage
```

**Kural:** Bir kullanıcı bir modülü göremiyorsa, o modülün sayfaları, menüleri ve API'leri tamamen gizlenir. Frontend'de `<ModuleGuard module="cari">` ve `<PermissionGuard permission="cari:delete">` ile sarılır.

### 9.5 Roller (Seed)
| Rol | Açıklama | Tipik Yetkiler |
|-----|----------|----------------|
| `super_admin` | Platform yöneticisi (firma dışı) | Tüm firmaları yönetir, logları görür |
| `tenant_owner` | Firma sahibi | Tam firma yetkisi |
| `tenant_admin` | Firma yöneticisi | Kullanıcı/rol/ayar yönetimi hariç tam firma yetkisi |
| `accountant` | Muhasebe | Cari/tahsilat/kasa/banka tam; satış/sipariş sınırlı |
| `sales_manager` | Satış müdürü | Satış/sipariş/tahsilat tam; raporlar |
| `sales_staff` | Satış personeli | Satış oluştur, kendi satışlarını gör |
| `warehouse_manager` | Depo müdürü | Stok/depo/sayım tam |
| `warehouse_staff` | Depo personeli | Stok hareketi, sınırlı |
| `hr_manager` | İK müdürü | İK/zimmet tam |
| `hr_staff` | İK personeli | Sınırlı |
| `reporter` | Rapor kullanıcısı | Sadece raporlar (read-only) |
| `viewer` | Salt görüntüleyen | Hiçbir işlem yetkisi yok |

---

## 10. MODÜL / PAKET KONTROL MANTIĞI

### 10.1 Paket Yapısı
```ts
Plan {
  code: "starter" | "standard" | "pro" | "enterprise" | "custom"
  name: string
  monthly_price: number
  yearly_price: number
  currency: "TRY"
  limits: {
    user_limit: number
    branch_limit: number
    warehouse_limit: number
    api_key_limit: number
    webhook_limit: number
    storage_mb_limit: number    // R2 dosya limiti
  }
  plan_modules: PlanModule[]      // bu pakete dahil modüller
}
```

### 10.2 Modül Yapısı
```ts
Module {
  code: "cari" | "stok" | "satis" | ...     // benzersiz kod
  name: string
  category: "core" | "operations" | "finance" | "addon"
  default_route: string
  icon: string
  sort_order: number
}
```

### 10.3 Modül Erişim Kontrol Zinciri
```
İstek geldi → controller'da @Module('cari') dekoratörü
  → ModuleGuard:
      1. tenant_modules tablosunda bu tenant için modül var mı?
         - Varsa, is_active=true mi?
         - Yoksa: plan_modules tablosunda bu plan için modül var mı?
      2. Sonuç: aktif ise geç; değilse 403 "MODULE_DISABLED"
```

### 10.4 Özel Modül Açma (Tenant Bazlı Override)
Süper admin bir firmaya özel modül açabilir:
```
tenant_modules:
  tenant_id: T1
  module_id: M_X  (plan'da yok ama tenant için açıldı)
  is_active: true
  source: "manual_override"
  limit_override: {...}
  valid_until: 2027-01-01
  note: "Sözleşme gereği 1 yıl ücretsiz"
```

Bu sayede:
- Paket yükseltmeden tek modül açılabilir.
- Tarihli açılır (süre sonunda otomatik pasifleşir).
- Audit log'a düşer.

### 10.5 Modül Pasifken UI
- Menüde görünmez.
- `/cari` gibi bir sayfaya direkt URL ile gidilirse `ModuleDisabledPage` açılır.
- API isteği 403 döner.
- Diğer modüllerdeki ilgili referanslar (örn. satış ekranındaki cari seçimi) hâlâ çalışır; sadece cari detayına tıklanırsa modül kapalı mesajı çıkar.

---

## 11. LOG SİSTEMİ TASLAĞI

### 11.1 Log Türleri ve Tabloları

| Tür | Tablo | Seviye | Tetikleyici | Maskeleme |
|-----|-------|--------|-------------|-----------|
| Audit | `audit_logs` | INFO/WARN/CRITICAL | Tüm POST/PUT/DELETE, modül açma, abonelik değişimi | Hassas alanlar maskeli |
| Hata | `error_logs` | ERROR/FATAL | Yakalanmamış exception, Prisma hatası, 5xx | - |
| Güvenlik | `security_logs` | INFO/WARN/CRITICAL | Login (başarılı/başarısız), token yenileme, yetkisiz deneme, IP değişimi, MFA | Şifre/token asla |
| API | `api_logs` | INFO/WARN | Tüm HTTP isteği (yöntem, path, status, süre, IP, UA, user) | Authorization header maskeli |
| Sistem | `system_alerts` | INFO/WARN/CRITICAL | Disk %80, token hataları, R2 kota aşımı, migration hatası | - |

### 11.2 Audit Log Yapısı
```ts
AuditLog {
  id
  tenant_id
  user_id
  module: string                 // 'cari', 'satis', ...
  action: string                 // 'CREATE', 'UPDATE', 'DELETE', 'CANCEL', 'APPROVE', ...
  entity_type: string            // 'Customer', 'Sale', ...
  entity_id: string
  old_values: Json?              // güncelleme öncesi
  new_values: Json?              // güncelleme sonrası
  changed_fields: String[]?      // ['balance', 'is_active']
  ip_address: String
  user_agent: String
  request_id: String
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  created_at
}
```

### 11.3 Loglama Kuralları
- **Tüm POST/PUT/DELETE** → otomatik audit log (interceptor).
- **Soft delete** → audit log `old_values` = tüm kayıt.
- **İptal/ters kayıt** → audit log `action='CANCEL'` + referans verilen orijinal kayıt id.
- **Login başarısız** → security_log `risk_level='HIGH'`.
- **5 ardışık başarısız login** → hesap geçici kilit + super_admin'e system_alert.
- **Modül açma/kapatma, abonelik değişimi, rol değişimi** → CRITICAL seviye audit log.
- **Maskeleme utility:** `maskSensitive(obj, ['password','token','apiSecret'])` → `***`.

### 11.4 Log Merkezi (Süper Admin)
- `/super-admin/logs` → filtre: tenant, user, modül, aksiyon, tarih, risk seviyesi.
- Liste + detay drawer; CSV export.
- `/super-admin/logs/errors` → hata logları; stack trace; etkilenen kullanıcı/tenant.
- `/super-admin/logs/security` → güvenlik olayları; anomali uyarıları.
- **Firma admin** sadece kendi tenant loglarını görebilir (süper admin yetkisi yok).

### 11.5 Log Retention
- **Audit / güvenlik logları:** min 2 yıl (yasal gereklilik), sonra arşiv.
- **API logları:** 90 gün (performans için).
- **Hata logları:** 30 gün (yığın olmasın).

---

## 12. STORAGE / R2 KULLANIM MANTIĞI

### 12.1 Mimari
```
[Client] → POST /api/v1/files (presigned upload URL iste)
            ↓
[Backend] → R2'de presigned PUT URL üretir (15dk geçerli)
            ↓
[Client] → R2'ye doğrudan yükler (sunucu trafiği yok)
            ↓
[Client] → POST /api/v1/files/confirm { key, size, mime, module }
            ↓
[Backend] → files tablosuna metadata yazar, tenant_storage_usage günceller
```

**Neden presigned URL?**
- Büyük dosyalar (video, fatura PDF) backend'den geçmez.
- Ölçeklenebilir; backend sadece koordine eder.

### 12.2 Klasör Yapısı (R2)
```
tenants/
  {tenant_id}/
    products/         # ürün görselleri
    documents/        # cari/personel evrakları
    imports/          # excel import dosyaları (orijinal)
    exports/          # kullanıcının dışa aktardığı raporlar
    support/          # destek ekleri
    invoices/         # e-fatura PDF
    temp/             # geçici (24 saat sonra silinir)
```

### 12.3 Kota ve Sayaç
- Paket bazlı `storage_mb_limit` (örn. Starter 2 GB, Standard 10 GB, Pro 50 GB, Enterprise 500 GB).
- `tenant_storage_usage` tablosunda anlık toplam kullanım (trigger veya uygulama katmanında güncellenir).
- **Yükleme öncesi kontrol:** `current_usage + new_file_size <= limit` değilse 403 `STORAGE_LIMIT_EXCEEDED`.
- **Silme sonrası:** Sayaç düşer (eventual consistency; nightly job ile reconcile).
- **UI:** `<StorageUsageBar>` her dosya yükleme noktasında gösterilir.

### 12.4 Dosya Erişim Güvenliği
- **Public erişim:** R2 public bucket kullanılmaz; tüm dosyalar private.
- **Okuma:** Kullanıcı dosyayı istediğinde backend kısa süreli (5dk) presigned GET URL üretir.
- **Tenant kontrolü:** Dosya metadata'sında `tenant_id` kontrolü yapılır; başka tenant'ın dosyasına erişim 404.
- **Permission:** Modüle özel ek kontrol (örn. cari evrak → cari modülü + ilgili cari erişim yetkisi).

### 12.5 MVP'de R2 Olmadan Çalışabilme
- **Local geliştirme:** `STORAGE_DRIVER=local` → `./storage/tenants/{id}/...` dizini.
- **Üretim:** `STORAGE_DRIVER=r2` → presigned URL'ler R2'ye gider.
- Storage service interface'i driver pattern ile yazılır; kod değişmeden driver değişir.

---

## 13. İLK MVP FAZ PLANI

Her faz **küçük parçalara bölünecek**, her parça sonunda mini rapor (ne yapıldı, hangi dosyalar değişti, hangi migration eklendi, hangi testler yapıldı, hangi ajanlar kontrol etti). Bir önceki fazın ajan onayı alınmadan diğerine geçilmeyecek.

### FAZ 1 — Proje İskeleti (1-2 gün)
- [ ] Monorepo kurulumu (pnpm workspaces).
- [ ] `apps/web` (Vite + React + TS) + `apps/api` (NestJS) + `packages/shared`.
- [ ] Tailwind + M3 token CSS + shadcn/ui kurulumu.
- [ ] ESLint + Prettier + tsconfig strict + EditorConfig.
- [ ] .env.example, .gitignore, .nvmrc, README.
- [ ] Docker compose: postgres + redis + local R2 (minio).
- [ ] **Ajan onayı:** Frontend Mimari & Component Ajanı, Proje Mimarı.

### FAZ 2 — Veritabanı & Migration (1 gün)
- [ ] Prisma schema: 12 SaaS çekirdek tablo.
- [ ] Initial migration.
- [ ] Seed: süper admin, modül kataloğu, plan kataloğu, permission kataloğu, örnek roller.
- [ ] **Ajan onayı:** DB & Migration Ajanı, Güvenlik Ajanı.

### FAZ 3 — Auth & Tenant & Süper Admin (3-4 gün)
- [ ] Auth module: register (süper admin tarafından tenant oluşturma dahil), login, refresh, logout.
- [ ] Tenant resolver middleware.
- [ ] JWT strategy + refresh rotation.
- [ ] Guards pipeline iskeleti (tenant, subscription, module, permission).
- [ ] Süper admin: tenant listesi, oluşturma, düzenleme, pasifleştirme, paket atama, modül aç/kapat.
- [ ] Süper admin dashboard (toplam firma, aktif abonelik, depolama, son loglar).
- [ ] **Ajan onayı:** Güvenlik, Modül & Paket, Log & Audit.

### FAZ 4 — Paket/Modül Sistemi (1-2 gün)
- [ ] Plan CRUD (süper admin).
- [ ] Plan-module eşleme, limit yönetimi.
- [ ] Tenant-module override.
- [ ] Permission matrisi, rol CRUD (süper admin ve tenant admin).
- [ ] Kullanıcı CRUD, rol atama.
- [ ] **Ajan onayı:** Modül & Paket, Güvenlik, Muhasebe Mantığı (yardımcı).

### FAZ 5 — Log & Audit Altyapısı (1 gün)
- [ ] Audit log interceptor, error log middleware, security log, API log.
- [ ] Log merkezi UI (süper admin + tenant admin).
- [ ] **Ajan onayı:** Log & Audit, Güvenlik.

### FAZ 6 — Cari Modülü (2 gün)
- [ ] Cari CRUD + arama + filtre + sıralama + sayfalama.
- [ ] Cari detay, bakiye alanı (hareketlerden hesaplanır, kaydedilmez).
- [ ] Cari hareket altyapısı (henüz satış bağlı değil ama altyapı hazır).
- [ ] **Ajan onayı:** Muhasebe Mantığı, Raporlama & Performans, Frontend Mimari.

### FAZ 7 — Stok Modülü + R2 Storage (2-3 gün)
- [ ] Ürün CRUD, barkod, marka, kategori, fiyat.
- [ ] Depo tanımları.
- [ ] R2 storage service + presigned URL + local driver.
- [ ] Ürün görseli yükleme, görsel gösterimi.
- [ ] Storage kullanım bar'ı.
- [ ] **Ajan onayı:** Storage, Muhasebe Mantığı, Modül & Paket.

### FAZ 8 — Satış + Stok/Cari Hareket (2-3 gün)
- [ ] Satış oluşturma: cari seç, ürün seç, sepet, adet/fiyat/iskonto.
- [ ] Satış kaydı: stok çıkışı + cari borç + (opsiyonel) tahsilat.
- [ ] Satış listesi, detay, iptal (ters kayıt).
- [ ] **Ajan onayı:** Muhasebe Mantığı (EN KRİTİK), Raporlama, Log & Audit.

### FAZ 9 — Sipariş + Tahsilat + Kasa (2-3 gün)
- [ ] Sipariş: oluştur, listele, durumlar (taslak→onay→sevk→kapalı/iptal).
- [ ] Tahsilat: cari seç, tutar, ödeme tipi, kasa seç, kayıt → cari alacak azalır + kasa hareketi.
- [ ] Kasa tanımları, kasa hareketleri, kasa bakiyesi.
- [ ] **Ajan onayı:** Muhasebe Mantığı, Raporlama, Log & Audit.

### FAZ 10 — Temel Raporlar (1-2 gün)
- [ ] Günlük satış, cari bakiye listesi, stok listesi, tahsilat listesi.
- [ ] Dashboard (firma): günlük satış, açık sipariş, kritik stok, en çok satanlar.
- [ ] Export Excel (csv + xlsx).
- [ ] **Ajan onayı:** Raporlama & Performans, Frontend Mimari.

### FAZ 11 — Excel Import (1-2 gün)
- [ ] Cari import (şablon, ön izleme, hata, batch).
- [ ] Stok import.
- [ ] Fiyat import.
- [ ] Import batch UI (ilerleme, hata listesi, retry).
- [ ] **Ajan onayı:** Veri Taşıma, Log & Audit.

### FAZ 12 — PWA & Mobil İyileştirme (1-2 gün)
- [ ] vite-plugin-pwa, manifest, ikonlar, offline shell.
- [ ] Bottom nav, büyük dokunma hedefleri, saha satış ekranları (basit).
- [ ] **Ajan onayı:** Frontend Mimari, Test & QA.

### FAZ 13 — Test & Hata Düzeltme (2 gün)
- [ ] Unit: muhasebe fonksiyonları, bakiye hesapları.
- [ ] Integration: yetkisiz erişim, tenant karışımı, modül kapalı.
- [ ] E2E: login → cari → satış → tahsilat → iptal.
- [ ] **Ajan onayı:** Test & QA, Güvenlik.

### FAZ 14 — Sonraki Fazlara Hazırlık (1 gün)
- [ ] ERP entegrasyonu için alanlar kontrol (external_id vs).
- [ ] Public API iskeleti (Swagger).
- [ ] Bayi portalı için ayrı route grubu (UI yok, altyapı notu).
- [ ] Akıllı asistan knowledge_base seed (boş tablo + CRUD).
- [ ] **Ajan onayı:** Tüm ajanlar mini review.

**Toplam tahmini süre: ~3-4 hafta** (yoğun çalışmayla). Ajan takımı paralel çalıştırılarak kısaltılabilir (örn. frontend iskeleti ve backend iskeleti paralel; storage ajanı faz 7'de devreye girer).

---

## 14. AJAN TAKIMI GÖREV PAYLAŞIMI

Ajan takımı çalışma şekli:
- Her faz başında **Proje Mimarı** faz planını netleştirir.
- **Aktif ajan(lar)** o fazda kod üretir + diğer ajanlar review yapar.
- Bir sonraki faza geçiş, ilgili **3-4 ajanın onayı** ile olur.
- **Ajan listesi ve odağı:**

| # | Ajan | MVP'deki Birincil Sorumluluk | Review Ettiği Çıktılar |
|---|------|------------------------------|-------------------------|
| 1 | **Proje Mimarı / Orkestratör** | Faz sırası, mimari tutarlılık, MVP şişmesini engellemek | Tüm PR'lar; haftalık mimari review |
| 2 | **Frontend Mimari & Component** | Tasarım sistemi, ortak component, responsive/PWA | Tüm FE PR'ları; haftada 1 tasarım review |
| 3 | **Veritabanı & Migration** | Şema, index, FK, soft delete, migration review | Tüm DB değişiklikleri; her migration |
| 4 | **Muhasebe Mantığı** | Cari/stok/kasa/tahsilat/satış/iade mantığı, iptal/ters kayıt, bakiye doğruluğu | Satış, tahsilat, cari, kasa PR'ları |
| 5 | **API / Backend** | Katmanlı mimari, response standardı, transaction, pagination, validation, error handling | Tüm BE PR'ları |
| 6 | **Güvenlik & Yetki** | RBAC, tenant izolasyon, JWT, R2 erişim, password/token, rate limit | Auth, RBAC, dosya erişim, kritik endpointler |
| 7 | **Modül & Paket** | Paket/plan/limit, modül aç/kapat, özel modül override | Paket/modül değişiklikleri |
| 8 | **Log & Audit** | Audit interceptor, log maskesi, retention, log UI | Kritik işlem endpointleri |
| 9 | **Test & QA** | Test senaryoları, yetkisiz/tenant/modül-kapalı testleri, muhasebe testleri | Her faz sonu |
| 10 | **Raporlama & Performans** | Rapor sorguları, index önerisi, dashboard performans, pagination | Rapor + dashboard PR'ları |
| 11 | **Entegrasyon** | ERP alanları (external_id vs.), source_status kullanımı, ileride adaptör altyapısı notu | Cari/stok/satış şema değişiklikleri |
| 12 | **Veri Taşıma** | Excel import, arşiv tabloları, eski satış bakiye etkilemez kuralı | Import + arşiv PR'ları |
| 13 | **Akıllı Asistan** | assistant_knowledge_base CRUD, yardım metinleri seed | UI'da yardım altyapısı eklendiğinde |
| 14 | **Storage** | R2 presigned URL, kota, tenant klasör yapısı, dosya güvenliği | Storage ile ilgili tüm PR'lar |

**İlk MVP'de ajan etkileşim akışı (örnek, Faz 8 — Satış):**
```
[Proje Mimarı] → "Satış modülüne geçiyoruz, MVP'de kapsam: cari seç, ürün seç, sepet, kayıt, iptal"
   ↓
[API/Backend] + [Frontend Mimari] → kodu yazar
   ↓
[Muhasebe Mantığı] → "Bakiye ters kayıt doğru mu? Stok giriş/çıkış yönü? İptalde cari hareket ters mi?"
   ↓
[Güvenlik] → "tenant kontrolü var mı, permission var mı, audit log düşüyor mu?"
   ↓
[Log & Audit] → "her satış ve iptal loglanıyor mu, hassas alan maskeli mi?"
   ↓
[Test & QA] → "yazılım test senaryoları: tek tenant'ta satış, başka tenant verisi erişilemiyor, modül kapalıyken 403"
   ↓
Onay → Faz 9
```

---

## 15. RİSKLİ NOKTALAR VE DİKKAT EDİLMESİ GEREKENLER

### 15.1 Mimari Riskler
| # | Risk | Etki | Önlem |
|---|------|------|-------|
| R1 | **Tek DB, çok tenant** — `tenant_id` unutulursa veri sızıntısı | KRİTİK | Her repository'de `where: { tenantId }` zorunlu; Prisma middleware ile uyarı; tüm list/detail endpoint'lerinde kontrol; E2E test. |
| R2 | **Para/stok direkt güncelleme** — cari bakiye veya stok miktarı direkt UPDATE yapılırsa | KRİTİK | Bu alanlar `GENERATED ALWAYS AS` veya **sadece hareketlerden hesaplanan view**; tabloda `current_balance` kolonu varsa bile yalnızca trigger ile; service layer'da "direkt update" yasak kuralı. |
| R3 | **Fiziksel silme** — cari/ürün/satış silinince geçmiş bağlantı kopar | YÜKSEK | Soft delete (`is_deleted`, `deleted_at`); "sil" butonu = `is_deleted=true` + audit log. |
| R4 | **Modül kontrolü atlanır** — UI'da gizli ama API açık | YÜKSEK | `ModuleGuard` interceptor'da pipeline'da; frontend + backend çift kontrol; test. |
| R5 | **Yetki sadece UI'da** — buton gizlemek | YÜKSEK | Her endpoint'te `@RequirePermission(...)` dekoratörü + guard; UI gizleme sadece UX. |
| R6 | **Refresh token çalınması** | YÜKSEK | httpOnly+secure+sameSite=strict; rotation; iptal listesi; şüpheli IP değişiminde tüm token'ları revoke. |
| R7 | **Migration geri dönülemez** — büyük şema değişikliği veri kaybı | ORTA | Migration stratejisi: geri alma = yeni migration; büyük değişikliklerde staging + backup. |
| R8 | **R2 kota aşımı** — büyük dosya yükleme | ORTA | Yükleme öncesi kota kontrolü; UI'da anlık kullanım bar; yöneticilere uyarı. |
| R9 | **Excel import büyük dosya → timeout/memory** | ORTA | Streaming okuma (exceljs stream), chunk insert, batch job, background queue. |
| R10 | **Muhasebe mantığı test edilmezse** — sonradan telafi edilmesi zor hatalar | KRİTİK | Her muhasebe fonksiyonu unit test; bakiye + stok miktarları property-based test. |

### 15.2 Ürün / UX Riskleri
| # | Risk | Önlem |
|---|------|-------|
| R11 | **ERP tarzı karmaşık UI** — saha personeli için ağır | Mobil öncelikli sadelik; her ekranda "mobilde nasıl görünür" review; 3 tık kuralı. |
| R12 | **Çok fazla modül → kullanıcı kafası karışır** | Modüler sidebar; sık kullanılanlar üstte; arama; rol-bazlı sadeleştirme. |
| R13 | **Türkçe lokalizasyon eksik** | Tüm string'ler `tr.json`; tek tek inline Türkçe değil (ileride i18n'e hazır). |

### 15.3 Operasyonel Riskler
| # | Risk | Önlem |
|---|------|-------|
| R14 | **Süper admin yanlışlıkla firma silerse** | Hard delete yok; soft delete + süre sonunda kalıcı silme job'ı; kritik aksiyonlar için 2. onay. |
| R15 | **Eski verilerin SaaS'a taşınması sırasında bakiye/stok hatası** | İmport sadece arşiv; cari/stok bakiyesi "**0**" ile başlar, sonra manuel mutabakat veya "devir kaydı" özelliği. |
| R16 | **Yedekleme stratejisi yoksa veri kaybı** | Günlük otomatik PG yedek (yedekleme runbook'u); R2 dosya versiyonlama. |
| R17 | **Geliştirici terk ederse proje sahipsiz kalır** | Bu doküman + ADRs/CHANGELOG tutulur; mimari kararlar `docs/decisions/` altında. |

### 15.4 Gelecek Fazlara Hazırlık (Risk Değil, Not)
- **ERP adaptörleri** (Mikro/Logo/Netsis/Paraşüt) → her tabloya `source_system`, `external_id`, `sync_status` eklendi; adaptör zamanı geldiğinde sadece `adapters/` dizini yazılacak.
- **Akıllı asistan** → `assistant_knowledge_base` tablosu seed edilebilir; UI'da her sayfanın yardım butonu bu tabloya bağlanır.
- **Bayi portalı** → `apps/web` içinde `/portal` route grubu ayrılabilir; tenant ile aynı DB, ek `portal_user` rolü.
- **Windows / mobil** → NestJS API zaten platform-bağımsız; PWA zaten mobil için yeterli; native gerektiğinde `apps/mobile` (React Native) eklenir.

---

## ONAY

Bu doküman **onaylandıktan sonra**:
1. Repo `main` branch'ine FAZ 1 iskeleti kurulacak.
2. Her faz sonunda mini rapor paylaşılacak.
3. Ajan takımı paralel çalıştırılarak MVP 3-4 haftada tamamlanacak.

**Lütfen şunları onayla/ekle/değiştir:**
- [ ] Teknoloji stack (React+Vite / NestJS / Prisma / PostgreSQL / Cloudflare R2)
- [ ] Monorepo yapısı (pnpm workspaces)
- [ ] Birleşik tasarım teması (M3 hibrit — yukarıda önerilen)
- [ ] 48 tablo planı (özellikle 30 aktif + 18 altyapı)
- [ ] Auth/Tenant/Permission pipeline sırası
- [ ] MVP faz planı (13 faz, 3-4 hafta)
- [ ] Ajan takımı sorumluluk dağılımı
- [ ] Risk listesi ve alınacak önlemler

Onayın geldiği gün **FAZ 1 — Proje İskeleti**'ne başlanır.
