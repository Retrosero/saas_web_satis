# SaaS İşletme Yönetim Platformu

> **Çok kiracılı (multi-tenant), modüler, paket bazlı, %100 Türkçe SaaS işletme yönetim platformu.**

Bu proje küçük firmadan kurumsal ölçeğe kadar her ölçekte satılabilir; her firma sadece kendi paketine dahil modülleri görür ve kullanır.

---

## 🎯 Özellikler (özet)

- **Multi-tenant SaaS mimarisi** — her firma tamamen izole
- **Modüler yapı** — cari, stok, satış, sipariş, tahsilat, kasa, banka, POS, depo, sayım, iade, raporlar, İK, zimmet, servis, bayi portalı, API/webhook, ERP entegrasyon, log, destek, bildirim
- **Paket sistemi** — Başlangıç / Standart / Profesyonel / Kurumsal / Firmaya Özel
- **Çift çalışma modu** — `SAAS_MASTER` ve `ERP_MASTER`
- **Gelişmiş RBAC** — modül, sayfa, buton, veri erişim seviyelerinde
- **Soft delete & ters kayıt** — para/stok işlemlerinde fiziksel silme yok
- **Hareket bazlı muhasebe** — cari/stok bakiyeleri hareketlerden izlenir
- **Cloudflare R2 storage** — tenant/paket bazlı kota
- **Log & audit** — her kritik işlem loglanır
- **PWA uyumlu responsive arayüz** — masaüstü, tablet, mobil

---

## 🛠 Teknoloji Stack

| Katman | Teknoloji |
|--------|-----------|
| Frontend | React 18 + Vite + TypeScript + Tailwind CSS + shadcn/ui + Zustand + TanStack Query + RHF + Zod |
| Backend | NestJS 10 + Prisma 5 + PostgreSQL 16 |
| Storage | Cloudflare R2 (lokal: MinIO) |
| Monorepo | pnpm workspaces |
| Auth | JWT + Refresh Token (argon2) |
| Test | Vitest + React Testing Library + Playwright (E2E) + Jest (BE) |
| CI/CD | GitHub Actions |

---

## 📁 Monorepo Yapısı

```
saas_web_satis/
├── apps/
│   ├── web/                        # React + Vite + TS (Frontend)
│   └── api/                        # NestJS + Prisma (Backend)
├── packages/
│   ├── shared/                     # Ortak tipler, enum, DTO
│   └── ui/                         # Ortak component (shadcn tabanlı)
├── docs/                           # Mimari ve proje dokümanları
├── docker-compose.yml              # Lokal geliştirme servisleri
└── .env.example                    # Ortam değişkenleri şablonu
```

Detaylı mimari için: [`docs/FAZ-0-ANALIZ-VE-MIMARI.md`](docs/FAZ-0-ANALIZ-VE-MIMARI.md)
DB şeması için: [`docs/db/00-tablo-ozet.md`](docs/db/00-tablo-ozet.md)

---

## 🚀 Hızlı Başlangıç (Lokal Geliştirme)

### Önkoşullar

- **Node.js** 20.x veya üzeri
- **pnpm** 9.x (`corepack enable && corepack prepare pnpm@9.15.0 --activate`)
- **Docker** ve **Docker Compose** (Postgres, Redis, MinIO için)
- **Git**

### Kurulum

```bash
# 1) Bağımlılıkları kur
pnpm install

# 2) Çevre değişkenlerini hazırla
cp .env.example .env

# 3) Veritabanı migration
pnpm --filter @saas/api prisma migrate dev
pnpm --filter @saas/api prisma db seed

# 4) Tüm uygulamaları geliştirme modunda başlat
pnpm dev
```

`pnpm dev` komutu lokal Docker servislerini (`postgres`, `redis`, `meilisearch`, `minio`) otomatik başlatır ve PostgreSQL erişilebilir olana kadar bekler.

- **Web:** http://localhost:5173
- **API:** http://localhost:3000/api/v1
- **Swagger:** http://localhost:3000/api/v1/docs
- **MinIO Konsol:** http://localhost:9001 (minioadmin / minioadmin)

---

## 🧪 Komutlar

| Komut | Açıklama |
|-------|----------|
| `pnpm dev` | Tüm uygulamaları geliştirme modunda başlatır |
| `pnpm build` | Tüm uygulamaları üretim için derler |
| `pnpm lint` | Tüm paketlerde lint çalıştırır |
| `pnpm typecheck` | Tüm paketlerde TypeScript tip kontrolü yapar |
| `pnpm test` | Tüm paketlerde testleri çalıştırır |
| `pnpm format` | Tüm kodu Prettier ile formatlar |

---

## 📜 Lisans

UNLICENSED — Özel mülk.

---

## 🤝 Katkıda Bulunma

Bu proje paralel ajan sistemiyle geliştirilmektedir. Her commit Türkçe açıklama ile yapılır.

Detaylı geliştirme planı için: [`docs/FAZ-0-ANALIZ-VE-MIMARI.md`](docs/FAZ-0-ANALIZ-VE-MIMARI.md) (Bölüm 13 — İlk MVP Faz Planı)
